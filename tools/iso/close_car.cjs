// Close buildArt: insert body/glass/grille/lamp/badge/exhaust + assembly + close
const fs = require('fs');
let s = fs.readFileSync('C:/Users/shah/Documents/GitHub/US_Executive/tools/iso/art_car.mjs','utf8');
const insertBefore = '} // end buildArt';
const closeBody = `

  /* ── CLOSE: assembly + close ──────────────────────────────────────────── */
  const bodySvg = out.map((e) => e.svg).join("");
  const defs = \`<defs>
    <radialGradient id="car-lamp-far"><stop offset="0" stop-color="#ec4899" stop-opacity="0.28"/><stop offset="0.6" stop-color="#ec4899" stop-opacity="0.08"/><stop offset="1" stop-color="#ec4899" stop-opacity="0"/></radialGradient>
    <radialGradient id="car-lamp-near"><stop offset="0" stop-color="#ec4899" stop-opacity="0.9"/><stop offset="1" stop-color="#ec4899" stop-opacity="0"/></radialGradient>
    <radialGradient id="car-badge-far"><stop offset="0" stop-color="#ec4899" stop-opacity="0.35"/><stop offset="0.5" stop-color="#ec4899" stop-opacity="0.1"/><stop offset="1" stop-color="#ec4899" stop-opacity="0"/></radialGradient>
    <radialGradient id="car-badge-near"><stop offset="0" stop-color="#ec4899" stop-opacity="0.95"/><stop offset="1" stop-color="#ec4899" stop-opacity="0"/></radialGradient>
    <linearGradient id="car-glass-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0" stop-color="#f8f3eb" stop-opacity="0.18"/><stop offset="0.5" stop-color="#ebe5da" stop-opacity="0.08"/><stop offset="1" stop-color="#d9d0c3" stop-opacity="0.12"/></linearGradient>
    <linearGradient id="car-chrome-grad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0" stop-color="#f8f3eb"/><stop offset="0.4" stop-color="#ebe5da"/><stop offset="0.6" stop-color="#d9d0c3"/><stop offset="1" stop-color="#cbc2b4"/></linearGradient>
  </defs>\`;
  const svg = \`<svg xmlns="http://www.w3.org/2000/svg" class="iso iso-svg car-svg" data-theme="dark" viewBox="0 0 \${W} \${H}" role="img" aria-labelledby="car-title car-desc" data-dc-wheel="16" data-car-susp="2">
    <title id="car-title">US Executive — luxury chauffeur car</title>
    <desc id="car-desc">A long-wheelbase executive saloon.</desc>
    <style>\${k.ISO_CSS}</style>
    \${defs}
    \${bodySvg}
  </svg>\`;
  return { svg, projection: P, parts: out };
`;
s = s.replace(insertBefore, closeBody + '\n' + insertBefore);
fs.writeFileSync('C:/Users/shah/Documents/GitHub/US_Executive/tools/iso/art_car.mjs', s);
console.log('closed buildArt');
