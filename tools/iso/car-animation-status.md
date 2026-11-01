# Car Animation — Status (interrupted)

- File: `tools/iso/art_car.mjs` (880×520, azimuth 35, elevation 24)
- Theme: bone parts (#d9d0c3) on near-black card (#110b0e), pink (#ec4899) only on cabin lamp + AVAILABLE badge
- Concept: luxury chauffeur saloon — cast alloy base, 4 wheels (front steerable ±3°), grille shutter, glass cabin, head/tail lamps, chrome grille, exhaust
- Completed in file: DEF gradients (lamp-far/near, badge-far/near, chrome, glass), halo, base plate + screws + badge, wheel groups (with steering group IDs), body envelope (BODY + cab + bonnet + boot)
- Missing/incorrect: assembly (buildArt does not return completed svg — ends at line ~248); syntax error on nuts array-comprehension line; no glass cabin, grille, lamp glow group, badge group, exhaust, door handles, marque, head/tail lamp parts fully wired; no model.js / live loop for car
- Recommendation: finish original dispatch hero (fully delivered); if car is required, restart `art_car.mjs` with shorter chunks, or use the complete `art.mjs` dispatch console (already in hero) as the hero figure
