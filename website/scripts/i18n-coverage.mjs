#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
/**
 * Report translation coverage per locale.
 *
 *   node scripts/i18n-coverage.mjs
 *   node scripts/i18n-coverage.mjs --stale     # only pages needing attention
 *
 * `fallbackLanguage` makes an untranslated page render its English body under
 * the locale's own URL. That keeps the site whole, but it also means nothing
 * visibly breaks when a translation is missing or has gone out of date — this
 * script is the only thing that surfaces either.
 *
 * "stale" = the English source was committed more recently than the
 * translation, i.e. the translation describes an older version of the docs.
 */
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = path.join(root, 'content/docs');
const DEFAULT = 'en';
const staleOnly = process.argv.includes('--stale');

function walk(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, base));
    else if (entry.name.endsWith('.mdx')) out.push(path.relative(base, full));
  }
  return out;
}

/** Last commit time per file, in one git call rather than one per file. */
function commitTimes() {
  const out = execFileSync(
    'git',
    ['log', '--format=@%ct', '--name-only', '--', 'content/docs'],
    { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  );
  const times = new Map();
  let current = 0;
  for (const line of out.split('\n')) {
    if (line.startsWith('@')) current = Number(line.slice(1));
    else if (line.trim() && !times.has(line)) times.set(line, current);
  }
  return times;
}

const times = commitTimes();
const timeOf = (locale, rel) => {
  const key = `website/content/docs/${locale}/${rel}`;
  if (times.has(key)) return times.get(key);
  // Not committed yet — treat the working copy as current.
  try {
    return statSync(path.join(docsDir, locale, rel)).mtimeMs / 1000;
  } catch {
    return 0;
  }
};

const locales = readdirSync(docsDir, { withFileTypes: true })
  .filter(e => e.isDirectory())
  .map(e => e.name);

const sourcePages = walk(path.join(docsDir, DEFAULT)).toSorted();
const rows = [];

for (const locale of locales) {
  if (locale === DEFAULT) continue;
  const own = new Set(walk(path.join(docsDir, locale)));
  const translated = sourcePages.filter(p => own.has(p));
  const stale = translated.filter(p => timeOf(DEFAULT, p) > timeOf(locale, p));
  const extra = [...own].filter(p => !sourcePages.includes(p));
  rows.push({ locale, translated, stale, extra });
}

const pad = (s, n) => String(s).padEnd(n);
const total = sourcePages.length;

console.log(`\ncontent/docs — ${total} pages in "${DEFAULT}"\n`);
console.log(
  `  ${pad('locale', 8)}${pad('translated', 14)}${pad('fallback', 12)}stale`
);
console.log(`  ${'-'.repeat(46)}`);
for (const { locale, translated, stale } of rows) {
  const pct = Math.round((translated.length / total) * 100);
  console.log(
    `  ${pad(locale, 8)}${pad(`${translated.length}/${total} (${pct}%)`, 14)}` +
      `${pad(total - translated.length, 12)}${stale.length || ''}`
  );
}

for (const { locale, stale, extra } of rows) {
  if (stale.length) {
    console.log(
      `\n  ${locale} — English source is newer than these translations:`
    );
    for (const p of stale) console.log(`    ${p}`);
  }
  if (extra.length) {
    console.log(
      `\n  ${locale} — no matching English page (renamed or removed upstream?):`
    );
    for (const p of extra) console.log(`    ${p}`);
  }
}

if (!staleOnly) {
  for (const { locale, translated } of rows) {
    const missing = sourcePages.filter(p => !translated.includes(p));
    if (missing.length) {
      console.log(
        `\n  ${locale} — falling back to English (${missing.length}):`
      );
      for (const p of missing) console.log(`    ${p}`);
    }
  }
}
console.log();
