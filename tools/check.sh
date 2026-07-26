#!/usr/bin/env bash
# 无头自检：注入 window.onerror 捕获运行时错误，并输出关键渲染指标
# 用法: tools/check.sh <page.html> [hash]
set -e
PAGE="${1:-index.html}"
HASH="${2:-}"
TMP="_check_tmp.html"
python3 - "$PAGE" "$TMP" <<'PY'
import sys, io
src, dst = sys.argv[1], sys.argv[2]
s = io.open(src, encoding='utf-8').read()
s = s.replace('<head>', '<head><script>window.__err=[];window.onerror=function(m,u,l,c){window.__err.push(m+" @"+l+":"+c);};</script>', 1)
s = s.replace('</body>', '<script>setTimeout(function(){var d=document.createElement("pre");d.id="errbox";d.textContent="__ERRORS__ "+(window.__err.join(" || ")||"none");document.body.appendChild(d);},1200);</script></body>', 1)
io.open(dst, 'w', encoding='utf-8').write(s)
PY
D=$(mktemp -d)
timeout 60 google-chrome --headless=new --no-sandbox --disable-gpu --user-data-dir="$D" \
  --virtual-time-budget=6000 --dump-dom "http://localhost:8088/$TMP$HASH" 2>/dev/null > /tmp/check.dom || true
rm -rf "$D" "$TMP"
grep -o '__ERRORS__[^<]*' /tmp/check.dom | tail -1
echo "undefined=$(grep -o 'undefined' /tmp/check.dom | wc -l) NaN=$(grep -o 'NaN' /tmp/check.dom | wc -l) icon残留=$(grep -o 'data-icon' /tmp/check.dom | wc -l)"
