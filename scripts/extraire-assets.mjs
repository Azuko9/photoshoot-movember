// Sort les images de l'objet ASSETS (base64) d'un index.html d'origine vers assets/<clé>.<ext>.
// Usage : node scripts/extraire-assets.mjs <index.html d'origine> [dossier de sortie]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [source, sortie = 'assets'] = process.argv.slice(2);
if (!source) { console.error('Usage : node scripts/extraire-assets.mjs <index.html> [dossier]'); process.exit(1); }

const html = readFileSync(source, 'utf8');
const debut = html.indexOf('const ASSETS=');
if (debut < 0) { console.error('Objet ASSETS introuvable'); process.exit(1); }
const json = html.slice(debut + 'const ASSETS='.length, html.indexOf('\n', debut)).replace(/;\s*$/, '');
const assets = JSON.parse(json);

mkdirSync(sortie, { recursive: true });
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
for (const [cle, uri] of Object.entries(assets)) {
  const m = /^data:([^;]+);base64,(.*)$/s.exec(uri);
  if (!m || !EXT[m[1]]) { console.error(`Format inattendu pour ${cle}`); process.exit(1); }
  const octets = Buffer.from(m[2], 'base64');
  writeFileSync(join(sortie, `${cle}.${EXT[m[1]]}`), octets);
  console.log(`${cle}.${EXT[m[1]]}\t${octets.length} octets`);
}
console.log(`${Object.keys(assets).length} images`);
