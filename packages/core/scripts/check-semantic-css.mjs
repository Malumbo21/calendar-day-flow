import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CORE_SCAN_DIRS = [
  'src/components',
  'src/views',
  'src/renderer',
  'src/utils',
];
const CORE_SCAN_FILES = ['src/styles/classNames.ts'];

const LEGACY_SEMANTIC_PATTERN =
  /(?<![\w-])((?:group-[\w-]+|hover|focus|active|dark):)?(?:bg|text|border|ring|shadow|outline)-(primary|secondary|destructive|muted|card)(?:-(foreground))?(?:\/(\d+))?\b/g;

function collectFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs.readdirSync(dirPath, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      return collectFiles(entryPath);
    }

    return /\.(ts|tsx)$/.test(entry.name) ? [entryPath] : [];
  });
}

function scanLegacySemanticClasses(coreRoot, workspaceRoot) {
  const files = [
    ...CORE_SCAN_DIRS.flatMap(dir => collectFiles(path.join(coreRoot, dir))),
    ...CORE_SCAN_FILES.map(file => path.join(coreRoot, file)).filter(file =>
      fs.existsSync(file)
    ),
    ...collectFiles(path.join(workspaceRoot, 'packages/plugins')),
  ];

  const matches = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const match of content.matchAll(LEGACY_SEMANTIC_PATTERN)) {
      matches.push({ file, className: match[0] });
    }
  }

  return matches;
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = path.resolve(root, '..', '..');
const matches = scanLegacySemanticClasses(root, workspaceRoot);

if (matches.length > 0) {
  console.error(
    '[check-semantic-css] Legacy semantic Tailwind classes were reintroduced. Use df-* semantic classes instead.'
  );
  for (const match of matches) {
    console.error(
      `  - ${path.relative(root, match.file)} -> ${match.className}`
    );
  }
  process.exit(1);
}

console.log('No legacy semantic Tailwind classes found.');
