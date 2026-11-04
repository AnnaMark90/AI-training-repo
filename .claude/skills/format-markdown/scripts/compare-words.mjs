// Compares the word sequences of two files, ignoring Markdown markup and punctuation.
// Any reported difference is a text change, so it must match an edit the user approved.
// Usage: node compare-words.mjs <original> <formatted>
import { readFileSync } from 'node:fs';
import process from 'node:process';

const [originalPath, formattedPath] = process.argv.slice(2);
if (!originalPath || !formattedPath) {
  process.stderr.write('Usage: node compare-words.mjs <original> <formatted>\n');
  process.exit(2);
}

const words = (path) => readFileSync(path, 'utf8').toLowerCase().match(/[\p{L}\p{N}_]+/gu) ?? [];

const a = words(originalPath);
const b = words(formattedPath);

// LCS table, fine for document-sized inputs.
const lcs = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
for (let i = a.length - 1; i >= 0; i--) {
  for (let j = b.length - 1; j >= 0; j--) {
    lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
  }
}

// Group consecutive removed/added words into hunks with a little context.
const hunks = [];
let current = null;
let i = 0;
let j = 0;
const flush = () => {
  if (current) hunks.push(current);
  current = null;
};
const hunk = () => (current ??= { before: a.slice(Math.max(0, i - 3), i).join(' '), removed: [], added: [] });

while (i < a.length || j < b.length) {
  if (i < a.length && j < b.length && a[i] === b[j]) {
    flush();
    i++;
    j++;
  } else if (j < b.length && (i === a.length || lcs[i][j + 1] >= lcs[i + 1][j])) {
    hunk().added.push(b[j++]);
  } else {
    hunk().removed.push(a[i++]);
  }
}
flush();

if (hunks.length === 0) {
  process.stdout.write('OK: word sequences are identical, only markup changed.\n');
} else {
  process.stdout.write(`Text changes: ${hunks.length}\n`);
  for (const h of hunks) {
    process.stdout.write(`- after "…${h.before}": -[${h.removed.join(' ')}] +[${h.added.join(' ')}]\n`);
  }
  process.exitCode = 1;
}
