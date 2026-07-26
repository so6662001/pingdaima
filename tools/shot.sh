#!/usr/bin/env bash
# 本地自检脚本：用无头 Chrome 为原型页面截图
# 用法: tools/shot.sh <page.html> [width] [height]
set -e
PAGE="${1:-index.html}"
W="${2:-1600}"
H="${3:-1400}"
OUT="/tmp/shots/$(basename "$PAGE" .html).png"
mkdir -p /tmp/shots
rm -rf "/tmp/chrome-profile-$$"
google-chrome --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
  --user-data-dir="/tmp/chrome-profile-$$" \
  --window-size="$W,$H" --virtual-time-budget=4000 \
  --screenshot="$OUT" "http://localhost:8088/$PAGE" >/dev/null 2>&1
rm -rf "/tmp/chrome-profile-$$"
echo "$OUT"
