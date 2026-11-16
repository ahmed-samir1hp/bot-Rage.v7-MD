#!/usr/bin/env node
// يصلّح: Named export 'xxx' not found. The requested module '@whiskeysockets/baileys' is a CommonJS module
// الاستخدام:  node fix-baileys-imports.mjs [المجلد=.] [--dry]
// - بيلف على كل ملفات .js/.mjs (ما عدا node_modules / sessions / tmp / .git)
// - بيحوّل  import { a, b as c } from '@whiskeysockets/baileys'  لشكل آمن
// - وكمان  const { a } = await import('@whiskeysockets/baileys')
// - بيحتفظ بالسطر الأصلي كتعليق، ومش بيعدّل ملف اتصلّح قبل كده (آمن لو شغّلته مرتين)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const root = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const SELF = fileURLToPath(import.meta.url);
const SKIP = new Set(['node_modules', 'sessions', 'tmp', '.git']);
const PKG = '@whiskeysockets/baileys';

const MERGE_HEADER =
  `import * as __baileysNs from '${PKG}'\n` +
  `const __baileys = { ...(__baileysNs.default && typeof __baileysNs.default === 'object' ? __baileysNs.default : {}), ...__baileysNs }\n`;

const MERGE_INLINE =
  `(await import('${PKG}').then((m) => ({ ...(m.default && typeof m.default === 'object' ? m.default : {}), ...m })))`;

const toDestructure = (list) =>
  list
    .split(',')
    .map((x) => x.trim())
    .filter((x) => x && !/^type\s+/.test(x.trim()))
    .map((x) => x.replace(/\s+as\s+/, ': '))
    .join(', ');

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/\.(m?js)$/.test(e.name) && p !== SELF) yield p;
  }
}

function fix(src) {
  let out = src;
  let changed = 0;

  // 1) static named imports  (يشمل الأسطر المتعددة)
  const staticRe = new RegExp(
    String.raw`^[ \t]*import\s*\{([^}]*)\}\s*from\s*['"]${PKG.replace('/', '\\/')}['"]\s*;?[ \t]*$`,
    'gm'
  );
  let headerAdded = out.includes('__baileysNs');
  out = out.replace(staticRe, (full, list) => {
    changed++;
    const commented = full.split('\n').map((l) => '// [auto-fix] ' + l.trim()).join('\n');
    let r = commented + '\n';
    if (!headerAdded) { r += MERGE_HEADER; headerAdded = true; }
    r += `const { ${toDestructure(list)} } = __baileys`;
    return r;
  });

  // 2) const { a, b } = await import('@whiskeysockets/baileys')
  const dynRe = new RegExp(
    String.raw`(const\s*\{[^}]*\}\s*=\s*)await\s+import\(\s*['"]${PKG.replace('/', '\\/')}['"]\s*\)(?!\s*\.\s*(?:default|then))`,
    'g'
  );
  out = out.replace(dynRe, (full, head) => { changed++; return head + MERGE_INLINE; });

  return { out, changed };
}

let files = 0, total = 0;
for (const f of walk(root)) {
  const src = fs.readFileSync(f, 'utf8');
  if (!src.includes(PKG)) continue;
  const { out, changed } = fix(src);
  if (!changed) continue;
  files++; total += changed;
  console.log(`${dry ? '[dry] ' : ''}fixed ${changed} → ${path.relative(root, f)}`);
  if (!dry) {
    fs.writeFileSync(f + '.bak', src);   // نسخة احتياطية
    fs.writeFileSync(f, out);
  }
}
console.log(`\nDone: ${total} import(s) in ${files} file(s)${dry ? ' (dry run, nothing written)' : ' — backups saved as *.bak'}`);
