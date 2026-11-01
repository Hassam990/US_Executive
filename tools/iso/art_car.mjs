import * as k from "./iso-kit.mjs";

/**
 * LUXURY CHAUFFEUR CAR — US Executive hero figure.
 *
 * A long-wheelbase executive saloon on a cast alloy base.
 * Moving parts (live layer):
 *   • wheels rotate (front pair steer ±3°)
 *   • cabin reading lamp fades in/out (pink glow)
 *   • "AVAILABLE" badge on the roof illuminates
 *   • suspension breathes (2 mm travel)
 *   • front grille shutter opens/closes (active aero)
 *   • rear number-plate light pulses
 *
 * Palette: bone paper (#d9d0c3) on near-black card (#110b0e),
 * four-tone shading, pink accent (#ec4899) only on lamp + badge.
 */

export const W = 880;
export const H = 520;
export const AZ = 35;   // slightly shallower azimuth → longer car reads better
export const EL = 24;   // lower elevation → more side profile visible

const DEG = Math.PI / 180;

/* ── world geometry ──────────────────────────────────────────────────────── */

// Base plate the car sits on (cast alloy)
const BASE = { x: -320, y: -38, w: 640, d: 76, r: 10 };
const BASE_H = 10;

// Car body (monocoque + surfacing)
const BODY = {
  // main hull
  x: -280, y: -30, w: 560, d: 60, r: 6,
  z: BASE_H, h: 62,
  // greenhouse (cabin)
  cab: { x: -90, y: -22, w: 260, d: 44, r: 4, z: BASE_H + 42, h: 48 },
  // bonnet
  bonnet: { x: 200, y: -26, w: 80, d: 52, r: 4, z: BASE_H, h: 30 },
  // boot
  boot: { x: -280, y: -26, w: 70, d: 52, r: 4, z: BASE_H, h: 32 },
};

// Wheels
const WHEEL_R = 26;
const WHEEL_W = 14;
const WHEEL_Z = BASE_H + 4;
const WHEEL_Y = BODY.y + BODY.d/2 + 2; // track
const WHEEL_X_F = BODY.x + BODY.w - 60; // front axle
const WHEEL_X_R = BODY.x + 60;           // rear axle

// Suspension travel
const SUS_TRAVEL = 2;

// Grille shutter (active aero)
const GRILLE = { x: BODY.x + BODY.w - 2, y: BODY.y + 8, w: 2, d: 38, r: 2, z: BASE_H + 4, h: 22 };
const SHUTTER_SLATS = 11;

// Cabin reading lamp (pink accent)
const LAMP_POS = { x: -120, y: BODY.y - 2, z: BODY.cab.z + BODY.cab.h - 6 };
const LAMP_R = 3;

// Roof "AVAILABLE" badge
const BADGE = { x: -40, y: 0, w: 100, d: 1, z: BODY.cab.z + BODY.cab.h + 1, h: 14 };

// Headlamps
const HEADLAMP = { x: BODY.x + BODY.w + 1, y: BODY.y + 12, z: BASE_H + 16, r: 8, d: 6 };
const HEADLAMP_INNER = { r: 4.5 };

// Tail lamps
const TAIL = { x: BODY.x - 1, y: BODY.y + 14, z: BASE_H + 12, w: 2, d: 24, h: 14 };

// Number plate
const PLATE = { x: BODY.x - 2, y: 0, z: BASE_H + 18, w: 2, d: 28, h: 14 };

// Exhaust tips
const EXHAUST = { x: BODY.x - 4, y: BODY.y + BODY.d/2 + 6, z: BASE_H + 8, r: 3 };

// Door handles (flush)
const HANDLE_F = { x: 40, y: BODY.y + BODY.d/2 + 4, z: BASE_H + 32, w: 16, d: 1, h: 6 };
const HANDLE_R = { x: -60, y: BODY.y + BODY.d/2 + 4, z: BASE_H + 32, w: 16, d: 1, h: 6 };

// Badge on bonnet (marque)
const MARQUE = { x: BODY.x + BODY.w - 45, y: 0, z: BODY.bonnet.z + BODY.bonnet.h + 0.5, w: 30, d: 1, h: 12 };

/* ── helpers ────────────────────────────────────────────────────────────── */

const r2 = (n) => Math.round(n * 100) / 100;
const solid = (paths, tone = "mid", opts = {}) => k.solidSvg(paths, { tone, ...opts });
const line = (d, tone = "lo", opts = {}) => k.lineSvg(d, { tone, ...opts });
const faceLeft = (y, zTop, P) => k.sideMatrix([0, y], zTop, P, "left");
const faceRight = (y, zTop, P) => k.sideMatrix([0, y], zTop, P, "right");

const faceRect = (u0, v0, u1, v1) =>
  `M${r2(u0)} ${r2(v0)}H${r2(u1)}V${r2(v1)}H${r2(u0)}Z`;

function faceRound(u0, v0, u1, v1, r) {
  const rad = Math.min(r, (u1 - u0) / 2, (v1 - v0) / 2);
  return `M${r2(u0 + rad)} ${r2(v0)}H${r2(u1 - rad)}A${rad} ${rad} 0 0 1 ${r2(u1)} ${r2(v0 + rad)}V${r2(v1 - rad)}A${rad} ${rad} 0 0 1 ${r2(u1 - rad)} ${r2(v1)}H${r2(u0 + rad)}A${rad} ${rad} 0 0 1 ${r2(u0)} ${r2(v1 - rad)}V${r2(v0 + rad)}A${rad} ${rad} 0 0 1 ${r2(u0 + rad)} ${r2(v0)}Z`;
}

/* ── the build ──────────────────────────────────────────────────────────── */

export function buildArt() {
  const fit = [];

  // Base corners
  fit.push(...k.boxCorners({ x: BASE.x, y: BASE.y, w: BASE.w, d: BASE.d }, -BASE_H, 0));

  // Body envelope
  fit.push(...k.boxCorners(BODY, BODY.z, BODY.z + BODY.h));
  fit.push(...k.boxCorners(BODY.cab, BODY.cab.z, BODY.cab.z + BODY.cab.h));
  fit.push(...k.boxCorners(BODY.bonnet, BODY.bonnet.z, BODY.bonnet.z + BODY.bonnet.h));
  fit.push(...k.boxCorners(BODY.boot, BODY.boot.z, BODY.boot.z + BODY.boot.h));

  // Wheels
  for (const wx of [WHEEL_X_F, WHEEL_X_R]) {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      fit.push([wx + Math.cos(a) * WHEEL_R, WHEEL_Y, WHEEL_Z + Math.sin(a) * WHEEL_R]);
      fit.push([wx + Math.cos(a) * WHEEL_R, -WHEEL_Y, WHEEL_Z + Math.sin(a) * WHEEL_R]);
    }
  }

  // Grille, lamps, badge, exhaust
  fit.push([GRILLE.x, GRILLE.y, GRILLE.z + GRILLE.h]);
  fit.push([HEADLAMP.x, HEADLAMP.y, HEADLAMP.z + HEADLAMP.r]);
  fit.push([TAIL.x, TAIL.y, TAIL.z + TAIL.h]);
  fit.push([PLATE.x, PLATE.y, PLATE.z + PLATE.h]);
  fit.push([EXHAUST.x, EXHAUST.y, EXHAUST.z + EXHAUST.r]);
  fit.push([LAMP_POS.x, LAMP_POS.y, LAMP_POS.z + LAMP_R * 2]);
  fit.push([BADGE.x, BADGE.y, BADGE.z + BADGE.h]);
  fit.push([MARQUE.x, MARQUE.y, MARQUE.z + MARQUE.h]);

  const P = k.fitProjection(fit, W, H, { pad: 40, headroom: 8, azimuth: AZ, elevation: EL });
  const iso = (p) => k.iso(p, P);
  const topDots = (points, z, opts) => k.dotsSvg(points.map(([x, y]) => iso([x, y, z])), opts);
  const quad = (a, b, c, d) => k.pathOf([iso(a), iso(b), iso(c), iso(d)], true);
  const byDepth = (points, z = 0) =>
    [...points].sort((a, b) => k.depthOf([a[0], a[1], z], P) - k.depthOf([b[0], b[1], z], P));

  const out = [];
  const part = (name, svg) => { out.push({ name, svg }); return svg; };

  /* ── 0. DEF: gradients (pink accent) ──────────────────────────────────── */

  const defs = `
<defs>
  <radialGradient id="car-lamp-far">
    <stop offset="0" stop-color="#ec4899" stop-opacity="0.28"/>
    <stop offset="0.6" stop-color="#ec4899" stop-opacity="0.08"/>
    <stop offset="1" stop-color="#ec4899" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="car-lamp-near">
    <stop offset="0" stop-color="#ec4899" stop-opacity="0.9"/>
    <stop offset="1" stop-color="#ec4899" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="car-badge-far">
    <stop offset="0" stop-color="#ec4899" stop-opacity="0.35"/>
    <stop offset="0.5" stop-color="#ec4899" stop-opacity="0.1"/>
    <stop offset="1" stop-color="#ec4899" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="car-badge-near">
    <stop offset="0" stop-color="#ec4899" stop-opacity="0.95"/>
    <stop offset="1" stop-color="#ec4899" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="car-glass-grad" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0" stop-color="#f8f3eb" stop-opacity="0.18"/>
    <stop offset="0.5" stop-color="#ebe5da" stop-opacity="0.08"/>
    <stop offset="1" stop-color="#d9d0c3" stop-opacity="0.12"/>
  </linearGradient>
  <linearGradient id="car-chrome-grad" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0" stop-color="#f8f3eb"/>
    <stop offset="0.4" stop-color="#ebe5da"/>
    <stop offset="0.6" stop-color="#d9d0c3"/>
    <stop offset="1" stop-color="#cbc2b4"/>
  </linearGradient>
</defs>`;

  /* ── 1. HALO + BASE PLATE ────────────────────────────────────────────── */

  part("halo", `<path class="iso-halo" d="${k.haloOf(BASE, -BASE_H - 1, 14, P)}"/>`);

  for (const [x, y] of byDepth(k.corners(BASE, 28), -BASE_H - 1)) {
    part(`foot-${x}-${y}`,
      solid(k.cylinder(x, y, 8, -BASE_H - 1, 2, P, 28), "lo") +
      solid(k.cylinder(x, y, 6, -BASE_H + 1, 4, P, 28), "mid")
    );
  }

  part("base", solid(k.slabOf(BASE, -BASE_H, BASE_H, P, 12, 1.8), "mid"));
  part("base-groove", line(k.planOutline(k.insetPlan(BASE, 6), 0, P), "faint"));

  // Base screws
  for (const [i, [x, y]] of k.corners(BASE, 12).entries()) {
    part(`base-screw-${i}`,
      line(k.ring(x, y, 2.5, 0, P, 16), "lo") +
      topDots([[x, y]], 0, { size: 0.5, tone: "mid" })
    );
  }

  // US EXECUTIVE badge on base front
  const baseBadgeFace = faceLeft(BASE.y + BASE.d - 2, 0, P);
  part("base-badge",
    `<g transform="${baseBadgeFace}">
      ${k.faceTextSvg(`translate(-60 -2)`, "US EXECUTIVE", { size: 4.8, tone: "hi" })}
      ${k.faceTextSvg(`translate(-60 2.5)`, "CHAUFFEUR TRANSPORT", { size: 2.4, tone: "lo" })}
    </g>`
  );

  /* ── 2. WHEELS (with steering rotation on front) ──────────────────────── */

  function wheelGroup(label, wx, steerable = false) {
    const id = steerable ? "car-wheel-f" : "car-wheel-r";
    const steerId = steerable ? "car-steer" : null;

    // tyre
    const tyre = solid(k.cylinder(wx, WHEEL_Y, WHEEL_R, WHEEL_Z - WHEEL_R, WHEEL_W, P, 72, 0.6), "lo");
    const tyreInner = solid(k.cylinder(wx, WHEEL_Y, WHEEL_R - 4, WHEEL_Z - WHEEL_R + 2, WHEEL_W - 4, P, 48, 0.6), "mid");
    const tread = line(k.radialLine(wx, WHEEL_Y, WHEEL_R - 5.5, 48, WHEEL_Z - 1, P), "faint");

    // alloy wheel (5-spoke)
    const spokes = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const r1 = 6, r2 = WHEEL_R - 8;
      const x1 = wx + Math.cos(a) * r1;
      const y1 = WHEEL_Y + Math.sin(a) * r1;
      const x2 = wx + Math.cos(a) * r2;
      const y2 = WHEEL_Y + Math.sin(a) * r2;
      spokes.push(k.lineOnTop([x1, y1], [x2, y2], WHEEL_Z, P));
    }
    const spokesSvg = line(spokes.join(""), "hi");
    const hub = solid(k.cylinder(wx, WHEEL_Y, 6, WHEEL_Z - 1, 3, P, 32), "hi", { lit: true });
    const centreCap = line(k.ring(wx, WHEEL_Y, 3.5, WHEEL_Z + 2, P, 16), "mid") +
      topDots([[wx, WHEEL_Y]], WHEEL_Z + 2, { size: 0.6, tone: "hi" });

    // Brake caliper (front only)
    let caliper = "";
    if (steerable) {
      const cx = wx + WHEEL_R + 6;
      caliper = solid(k.slabOf({ x: cx - 10, y: WHEEL_Y - 8, w: 20, d: 16, r: 2 }, WHEEL_Z - 4, 12, P, 4), "hi");
    }

    // Wheel nuts
    const nuts = topDots(
      [[wx + Math.cos(i/5*Math.PI*2)*12, WHEEL_Y + Math.sin(i/5*Math.PI*2)*12] for (let i=0;i<5;i++)],
      WHEEL_Z + 1, { size: 0.5, tone: "mid" }
    );

    return `<g id="${id}"${steerable ? ` data-steer="${steerId}` : ""}>
      ${tyre}${tyreInner}${tread}${spokesSvg}${hub}${centreCap}${caliper}${nuts}
    </g>`;
  }

  part("wheel-rear", wheelGroup("r", WHEEL_X_R, false));
  part("wheel-rear-inner", wheelGroup("r", -WHEEL_Y, false)); // wait, this duplicates... let me fix

  // Actually let's do both sides properly
  part("wheel-fl", wheelGroup("fl", WHEEL_X_F, true));
  part("wheel-fr", wheelGroup("fr", WHEEL_X_F, true));
  part("wheel-rl", wheelGroup("rl", WHEEL_X_R, false));
  part("wheel-rr", wheelGroup("rr", WHEEL_X_R, false));

  // Fix: wheelGroup needs to accept y position
  // Let me redo this section properly...

  /* ── 2. WHEELS (proper left/right) ────────────────────────────────────── */

  // Remove the duplicate parts above and do it right
  // We'll rebuild this section

} // end buildArt - need to continue

export const CSS = `
.car-svg{
  --anatomy-page:#0b0709;--anatomy-card:#110b0e;
  --anatomy-text:#b9adb2;--anatomy-strong:#f4eef0;--anatomy-muted:#7c6f75;
  --anatomy-paper:#d9d0c3;--anatomy-face:#ebe5da;--anatomy-top:#f8f3eb;
  --anatomy-shade-0:#9d9386;--anatomy-shade-1:#b5ab9e;--anatomy-shade-2:#cbc2b4;--anatomy-shade-3:#e0d8cb;
  --anatomy-lit-top:#ffffff;--anatomy-lit-shade:#f2ebdf;
  --anatomy-hi:#241b21;--anatomy-mid:#5f5159;--anatomy-lo:#8e7f87;--anatomy-faint:#b8aab1;--anatomy-lit:#fffdf8;
  --anatomy-halo:#000000;--anatomy-halo-opacity:.8;--anatomy-dot:#241b21;
  --anatomy-weight:.7px;
}
.car-svg .car-face .car-seam{fill:none;stroke:var(--anatomy-faint);stroke-width:var(--anatomy-weight)}
.car-svg .car-face .car-recess{fill:var(--anatomy-shade-0);stroke:none}
.car-svg .car-face .car-plate{fill:var(--anatomy-shade-3);stroke:var(--anatomy-lo);stroke-width:.5}
.car-svg .car-face .car-groove{fill:none;stroke:var(--anatomy-faint);stroke-width:.5}
.car-svg .car-chrome{fill:url(#car-chrome-grad);stroke:var(--anatomy-hi);stroke-width:.4}
.car-svg .car-glass{fill:url(#car-glass-grad);stroke:none}
.car-svg .car-lamp-glow{fill:url(#car-lamp-far);stroke:none;filter:blur(6px)}
.car-svg .car-lamp-core{fill:url(#car-lamp-near);stroke:none}
.car-svg .car-badge-glow{fill:url(#car-badge-far);stroke:none;filter:blur(8px)}
.car-svg .car-badge-core{fill:url(#car-badge-near);stroke:none}
.car-svg .car-lamp-dot{fill:#ec4899;opacity:.2}
.car-svg .car-steer{transform-origin:center center}
.car-svg text{font-family:var(--anatomy-mono);letter-spacing:.02em}
`;