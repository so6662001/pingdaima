#!/usr/bin/env node
/**
 * PRD 引用校验：扫描源码中的 `@prd <文件>#<锚点>` 注解，
 * 校验目标文档与锚点真实存在，防止代码与 PRD 逐渐失联。
 *
 * 用法：node tools/check-prd-refs.mjs [扫描目录...]
 * 默认扫描 apps、packages、prisma、e2e（不存在则跳过）。
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SCAN_DIRS = process.argv.slice(2).length ? process.argv.slice(2) : ['apps', 'packages', 'prisma', 'e2e'];
const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.prisma', '.sql']);
const SKIP_DIR = new Set(['node_modules', 'dist', 'build', '.next', 'coverage', '.git']);

/** GitHub 风格锚点生成（与 github-slugger 行为对齐，保留 CJK） */
function slug(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '') // 去掉标点与符号，保留字母数字（含 CJK）、空白、_ 与 -
    .replace(/ /g, '-'); // 逐个空格转连字符，与 github-slugger 行为一致
}

function collectAnchors(mdPath) {
  const set = new Set();
  const counts = new Map();
  for (const line of fs.readFileSync(mdPath, 'utf8').split('\n')) {
    const m = line.match(/^#{1,6}\s+(.*?)\s*$/);
    if (!m) continue;
    let s = slug(m[1]);
    const n = counts.get(s) || 0;
    counts.set(s, n + 1);
    if (n > 0) s = `${s}-${n}`;
    set.add(s);
  }
  return set;
}

function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIR.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (CODE_EXT.has(path.extname(e.name))) yield p;
  }
}

const anchorCache = new Map();
let total = 0;
const problems = [];

for (const d of SCAN_DIRS) {
  for (const file of walk(path.join(ROOT, d))) {
    const src = fs.readFileSync(file, 'utf8');
    const lines = src.split('\n');
    lines.forEach((line, i) => {
      const m = line.match(/@prd\s+(\S+)/);
      if (!m) return;
      total++;
      const [docRel, hash] = m[1].split('#');
      const docAbs = path.join(ROOT, docRel);
      const where = `${path.relative(ROOT, file)}:${i + 1}`;
      if (!fs.existsSync(docAbs)) {
        problems.push(`${where}  文档不存在: ${docRel}`);
        return;
      }
      if (!hash) return;
      if (!anchorCache.has(docAbs)) anchorCache.set(docAbs, collectAnchors(docAbs));
      if (!anchorCache.get(docAbs).has(decodeURIComponent(hash))) {
        problems.push(`${where}  锚点不存在: ${docRel}#${hash}`);
      }
    });
  }
}

if (problems.length) {
  console.error('PRD 引用校验失败：\n' + problems.map((p) => '  ✗ ' + p).join('\n'));
  console.error(`\n共 ${total} 处 @prd 注解，${problems.length} 处无效。`);
  process.exit(1);
}

if (total === 0) {
  console.log('未发现 @prd 注解（源码目录可能尚未建立）。实现 PRD 规则的代码必须加注解，见 .cursor/rules/02-prd-compliance.mdc');
} else {
  console.log(`PRD 引用校验通过：${total} 处 @prd 注解全部有效。`);
}
