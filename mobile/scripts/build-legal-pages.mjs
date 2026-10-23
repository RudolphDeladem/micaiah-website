// Renders the in-app legal text (src/lib/legal.ts, the single source of truth) into the
// website's privacy.html and terms.html. Run from the repository root:
//   node mobile/scripts/build-legal-pages.mjs
import { readFileSync, writeFileSync } from 'node:fs';
const src = readFileSync('mobile/src/lib/legal.ts', 'utf8');
const pick = (name) => {
  const m = src.match(new RegExp(`export const ${name}: LegalDoc = (\\{[\\s\\S]*?\\n\\});`));
  return m[1];
};
const SUPPORT_EMAIL = src.match(/SUPPORT_EMAIL = '([^']+)'/)[1];
const DATE = src.match(/LEGAL_EFFECTIVE_DATE = '([^']+)'/)[1];
const evalDoc = (code) => Function('SUPPORT_EMAIL', `return (${code});`)(SUPPORT_EMAIL);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const page = (title, bodyHtml) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} · Micaiah AI</title>
<meta name="description" content="${title} for the Micaiah AI app.">
<link rel="stylesheet" href="legal.css">
</head>
<body>
<header><a class="brand" href="index.html">MICAIAH AI</a></header>
<main>
${bodyHtml}
</main>
<footer>© 2026 Micaiah AI · <a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a> · <a href="support.html">Support</a></footer>
</body>
</html>
`;
for (const [name, file] of [['PRIVACY_POLICY', 'privacy.html'], ['TERMS_OF_USE', 'terms.html']]) {
  const doc = evalDoc(pick(name));
  const body = `<h1>${esc(doc.title)}</h1>\n<p class="date">Effective ${DATE}</p>\n` +
    doc.sections.map((s) => `<h2>${esc(s.heading)}</h2>\n<p>${esc(s.body).replace(SUPPORT_EMAIL, `<a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>`)}</p>`).join('\n');
  writeFileSync(file, page(doc.title, body));
  console.log('wrote', file);
}
