// Fills in KJV text for every { "ref": "Book C:V[-V]" } without "text" in a JSON data file,
// using the bundled KJV (assets/bibles/kjv.bible). Fails on any reference that does not exist.
//
// Usage: node scripts/fill-verse-text.mjs src/data/scripture-extra.json
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = process.argv[2];
if (!file) throw new Error('Usage: node scripts/fill-verse-text.mjs <data.json>');

const kjv = JSON.parse(readFileSync(join(root, 'assets/bibles/kjv.bible'), 'utf8'));
// Verses already in the core library keep its wording (it keeps the KJV's "LORD"; the bundled text does not).
const core = new Map(
  JSON.parse(readFileSync(join(root, 'src/data/scripture.json'), 'utf8')).themes.flatMap((t) =>
    t.verses.map((v) => [v.ref, v.text]),
  ),
);
const books = JSON.parse(readFileSync(join(root, 'src/data/bible-books.json'), 'utf8')).map((b) => b.name);
const ALIASES = { psalm: 'psalms', 'song of songs': 'song of solomon' };
// The bundled KJV keeps psalm titles at the start of verse 1; quotes should not include them.
const SUPERSCRIPTION = /^(?:(?:A Psalm|A Song|A Prayer|To the chief Musician|Michtam|Maschil|Shiggaion)[^.]*\.\s*)+/;

function lookup(ref) {
  const m = /^(.+?) (\d+):(\d+)(?:-(\d+))?$/.exec(ref);
  if (!m) throw new Error(`Bad reference: ${ref}`);
  const name = m[1].toLowerCase();
  const book = books.findIndex((b) => b.toLowerCase() === (ALIASES[name] ?? name));
  const chapter = kjv[book]?.[Number(m[2]) - 1];
  if (!chapter) throw new Error(`No such book or chapter: ${ref}`);
  const start = Number(m[3]);
  const end = m[4] ? Number(m[4]) : start;
  const parts = [];
  for (let v = start; v <= end; v++) {
    if (!chapter[v - 1]) throw new Error(`No such verse: ${ref}`);
    parts.push(chapter[v - 1]);
  }
  return parts.join(' ').replace(SUPERSCRIPTION, '');
}

let filled = 0;
function walk(node) {
  if (Array.isArray(node)) return node.forEach(walk);
  if (!node || typeof node !== 'object') return;
  if (typeof node.ref === 'string' && (typeof node.text !== 'string' || (core.has(node.ref) && node.text !== core.get(node.ref)))) {
    node.text = core.get(node.ref) ?? lookup(node.ref);
    filled++;
  }
  Object.values(node).forEach(walk);
}

const path = join(root, file);
const data = JSON.parse(readFileSync(path, 'utf8'));
walk(data);
writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Filled ${filled} verse(s) in ${file}`);
