import * as k from "./iso-kit.mjs";

/**
 * DISPATCH CONSOLE — the figure behind the US Executive hero.
 *
 * One desk instrument in three bays on a cast base: a split-flap departure
 * board, a pickup dial that counts the hour down, and a quote drum bolted at
 * £84.00, with the key that lifts when the seal is released. A junction box
 * and a handset sit between them.
 *
 * Built once, at rest. The live layer moves only: the needle, the drum strips,
 * the bolt, the shutter, the key, the lamp's glow and the status row's tiles.
 */

export const W = 760;
export const H = 600;
export const AZ = 45;
export const EL = 30;

const DEG = Math.PI / 180;

/* ── world ──────────────────────────────────────────────────────────────── */

const BASE = { x: -150, y: -72, w: 300, d: 144, r: 12 };
const PLATE_H = 12;

const PED = { x: -140, y: -68, w: 96, d: 38, r: 4 };
const PED_H = 42;

const BOARD = { x: -136, y: -26, w: 84, d: 6, r: 1 };
const BOARD_Z = 48;
const BOARD_H = 68;
const BOARD_TOP = BOARD_Z + BOARD_H;
const BOARD_FACE = -20;
const FIELD = { u0: -132, u1: -56, v0: 6, v1: 64 };
const COLS = 7;
const ROWS = 3;

const DIAL = [62, -34];
const DIAL_R = 33;
const DIAL_Z = 30;

const FARE = { x: 24, y: 8, w: 122, d: 58, r: 4 };
const FARE_H = 44;
const FARE_FACE = 66;
const WIN = { u0: 48, u1: 132, v0: 8, v1: 32 };
const SLOT_W = 18;
const SLOT_GAP = 3;
const SLOT_TOP = 49.5;
const DIGIT_STEP = 16;
const BOLT_TRAVEL = 18;

const KEYDECK = { x: -136, y: 14, w: 54, d: 44, r: 3 };
const DECK_H = 13;
const LOCK = [-108, 39];
const LOCK_R = 9;
const KEYLIFT = 7;

const BOX = { x: -38, y: -52, w: 40, d: 32, r: 3 };
const BOX_H = 15;

const HAND = { x: -44, y: -6, w: 46, d: 34, r: 3 };
const LAMP = [-94, 24];

/* ── helpers ────────────────────────────────────────────────────────────── */

const r2 = (n) => Math.round(n * 100) / 100;
const solid = (paths, tone = "mid", opts = {}) => k.solidSvg(paths, { tone, ...opts });
const line = (d, tone = "lo", opts = {}) => k.lineSvg(d, { tone, ...opts });
const faceLeft = (y, zTop, P) => k.sideMatrix([0, y], zTop, P, "left");

const faceRect = (u0, v0, u1, v1) =>
  `M${r2(u0)} ${r2(v0)}H${r2(u1)}V${r2(v1)}H${r2(u0)}Z`;

function faceRound(u0, v0, u1, v1, r) {
  const rad = Math.min(r, (u1 - u0) / 2, (v1 - v0) / 2);
  return `M${r2(u0 + rad)} ${r2(v0)}H${r2(u1 - rad)}A${rad} ${rad} 0 0 1 ${r2(u1)} ${r2(v0 + rad)}V${r2(v1 - rad)}A${rad} ${rad} 0 0 1 ${r2(u1 - rad)} ${r2(v1)}H${r2(u0 + rad)}A${rad} ${rad} 0 0 1 ${r2(u0)} ${r2(v1 - rad)}V${r2(v0 + rad)}A${rad} ${rad} 0 0 1 ${r2(u0 + rad)} ${r2(v0)}Z`;
}

/* ── the build ──────────────────────────────────────────────────────────── */

export function buildArt() {
  const fit = [];

  fit.push(...k.boxCorners({ x: BASE.x, y: BASE.y, w: BASE.w, d: BASE.d }, -18, 0));
  fit.push(...k.boxCorners(PED, 0, PED_H));
  fit.push(...k.boxCorners(BOARD, BOARD_Z, BOARD_TOP));
  fit.push(...k.boxCorners(FARE, 0, FARE_H + 3));
  fit.push([FARE.x, FARE.y, FARE_FACE + 4], [FARE.x + FARE.w, FARE.y, FARE_FACE + 4]);
  fit.push(...k.boxCorners(KEYDECK, 0, DECK_H));
  fit.push(...k.boxCorners(BOX, 0, BOX_H + 4));
  fit.push(...k.boxCorners(HAND, 0, 17));
  fit.push([LOCK[0], LOCK[1], DECK_H + 30], [LAMP[0], LAMP[1], DECK_H + 26]);
  for (let i = 0; i < 16; i += 1) {
    const a = (i / 16) * Math.PI * 2;
    fit.push([DIAL[0] + Math.cos(a) * 37, DIAL[1] + Math.sin(a) * 37, DIAL_Z + 8]);
  }

  const P = k.fitProjection(fit, W, H, { pad: 36, headroom: 4, azimuth: AZ, elevation: EL });
  const iso = (p) => k.iso(p, P);
  const topDots = (points, z, opts) => k.dotsSvg(points.map(([x, y]) => iso([x, y, z])), opts);
  const quad = (a, b, c, d) => k.pathOf([iso(a), iso(b), iso(c), iso(d)], true);
  const byDepth = (points, z = 0) =>
    [...points].sort((a, b) => k.depthOf([a[0], a[1], z], P) - k.depthOf([b[0], b[1], z], P));

  const out = [];
  const part = (name, svg) => {
    out.push({ name, svg });
    return svg;
  };

  /* ── 1. halo, feet, base ─────────────────────────────────────────────── */

  part("halo", `<path class="iso-halo" d="${k.haloOf(BASE, -17, 12, P)}"/>`);

  for (const [x, y] of byDepth(k.corners(BASE, 24), -17)) {
    part(
      `foot-${x}-${y}`,
      solid(k.cylinder(x, y, 7, -17, 1.6, P, 28), "lo") +
        solid(k.cylinder(x, y, 5.4, -15.4, 3.4, P, 28), "mid"),
    );
  }

  part("base", solid(k.slabOf(BASE, -PLATE_H, PLATE_H, P, 10, 1.6), "mid"));
  part("base-groove", line(k.planOutline(k.insetPlan(BASE, 5), 0, P), "faint"));

  for (const [i, [x, y]] of k.corners(BASE, 10).entries()) {
    part(
      `base-screw-${i}`,
      line(k.ring(x, y, 2.2, 0, P, 16), "lo") + topDots([[x, y]], 0, { size: 0.5, tone: "mid" }),
    );
  }

  /* label plate, front-centre of the bed */
  const LABEL = { x: -60, y: 58, w: 80, d: 11, r: 1.6 };
  part("label", solid(k.slabOf(LABEL, 0, 0.9, P, 4), "lo", { crease: "none" }));
  part("label-inset", line(k.planOutline(k.insetPlan(LABEL, 1.6), 0.9, P), "faint"));
  for (const [i, len] of [64, 46, 56].entries()) {
    const y = LABEL.y + 3.4 + i * 2.3;
    part(`label-rule-${i}`, line(k.lineOnTop([LABEL.x + 5, y], [LABEL.x + 5 + len, y], 0.9, P), "lo", { free: true }));
  }
  part("label-screws", topDots(k.corners(LABEL, 3), 0.9, { size: 0.45, tone: "mid" }));

  /* ruler strip, in front of the fare deck */
  const RULER = { x: 40, y: 66, w: 100, d: 5.5, r: 1 };
  part("ruler", solid(k.slabOf(RULER, 0, 0.6, P, 3), "lo", { crease: "none" }));
  const ticks = k.topTicks(RULER.x + 4, RULER.x + RULER.w - 4, 4, 5, RULER.y + 0.6, 0.6, [1.1, 2.6], P);
  part("ruler-minor", line(ticks.minor, "lo"));
  part("ruler-major", line(ticks.major, "mid"));

  /* ── 2. departure board on its pedestal ──────────────────────────────── */

  part("pedestal", solid(k.slabOf(PED, 0, PED_H, P, 5, 1.2), "mid", { inner: line(k.sideSeam(PED, 30, P, 5), "faint") }));
  part("pedestal-top", line(k.planOutline(k.insetPlan(PED, 3), PED_H, P), "faint"));
  for (const [i, [x, y]] of k.corners(PED, 7).entries()) {
    part(`ped-bolt-${i}`, line(k.ring(x, y, 1.5, PED_H, P, 12), "lo") + topDots([[x, y]], PED_H, { size: 0.4, tone: "mid" }));
  }

  const pedFace = faceLeft(-30, PED_H, P);
  part(
    "pedestal-face",
    `<g transform="${pedFace}" class="dc-face">
      <path class="dc-seam" d="${faceRect(-134, 4, -50, 40)}"/>
      <path class="dc-seam" d="M-134 18H-50"/>
      <path class="dc-recess" d="${faceRound(-112, 21, -72, 36, 1.5)}"/>
      <path class="dc-plate" d="${faceRound(-111, 22, -73, 35, 1.2)}"/>
      <path class="dc-groove" d="${faceRound(-103, 25.5, -81, 28.5, 1.1)}"/>
      <path class="dc-groove" d="${faceRound(-103, 30, -89, 31.6, 0.7)}"/>
      <circle class="dc-bolt" cx="-130" cy="7" r="0.8"/>
      <circle class="dc-bolt" cx="-54" cy="7" r="0.8"/>
    </g>`,
  );
  part("pedestal-name", k.faceTextSvg(`translate(-131 14.6)`, "US EXECUTIVE", { size: 5.4, tone: "hi" }));
  part("pedestal-no", k.faceTextSvg(`translate(-131 17.6)`, "DISPATCH No. 07", { size: 2.7, tone: "lo" }));
  // re-parent the two engraved lines onto the pedestal face
  out[out.length - 2].svg = `<g transform="${pedFace}">${out[out.length - 2].svg}</g>`;
  out[out.length - 1].svg = `<g transform="${pedFace}">${out[out.length - 1].svg}</g>`;

  part("board", solid(k.slabOf(BOARD, BOARD_Z, BOARD_H, P, 4, 0.7), "mid"));
  part(
    "board-top",
    line(k.planOutline(k.insetPlan(BOARD, 1.2), BOARD_TOP, P), "faint") +
      line(k.planOutline(BOARD, BOARD_Z, P), "faint"),
  );

  const bf = faceLeft(BOARD_FACE, BOARD_TOP, P);
  const fieldW = FIELD.u1 - FIELD.u0;
  const fieldH = FIELD.v1 - FIELD.v0;
  const colW = fieldW / COLS;
  const rowH = fieldH / ROWS;

  const statusA = ["BA 118 ", "LHR T5 ", "LANDED "];
  const statusB = ["BA 118 ", "LHR T5 ", "ON TIME"];

  let tiles = "";
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const u0 = FIELD.u0 + col * colW;
      const v0 = FIELD.v0 + row * rowH;
      const cx = u0 + colW / 2;
      const cy = v0 + rowH / 2;
      const ch = statusA[row][col];
      const alt = statusB[row][col];
      tiles += `<path class="dc-tile" d="${faceRound(u0 + 0.4, v0 + 0.4, u0 + colW - 0.4, v0 + rowH - 1, 0.7)}"/>`;
      tiles += `<path class="dc-tile-shade" d="${faceRect(u0 + 0.6, v0 + rowH - 2.6, u0 + colW - 0.6, v0 + rowH - 1)}"/>`;
      tiles += `<g transform="translate(${r2(cx)} ${r2(cy)})"><g id="dc-tile-${row}-${col}" data-ch="${ch}" data-alt="${alt}"><text class="iso-face-text dc-tile-text" text-anchor="middle" font-size="11.5" transform="translate(0 4.3)">${ch}</text></g></g>`;
    }
  }

  part(
    "board-face",
    `<g transform="${bf}" class="dc-face">
      <path class="dc-boardfield" d="${faceRect(FIELD.u0 - 3, FIELD.v0 - 3, FIELD.u1 + 3, FIELD.v1 + 3)}"/>
      <g>${tiles}</g>
      <path class="dc-frame" d="${faceRect(FIELD.u0 - 3, FIELD.v0 - 3, FIELD.u1 + 3, FIELD.v0 - 1.2)}"/>
      <path class="dc-frame" d="${faceRect(FIELD.u0 - 3, FIELD.v1 + 1.2, FIELD.u1 + 3, FIELD.v1 + 3)}"/>
      <path class="dc-frame" d="${faceRect(FIELD.u0 - 3, FIELD.v0 - 3, FIELD.u0 - 1.2, FIELD.v1 + 3)}"/>
      <path class="dc-frame" d="${faceRect(FIELD.u1 + 1.2, FIELD.v0 - 3, FIELD.u1 + 3, FIELD.v1 + 3)}"/>
      <path class="dc-groove" d="${faceRect(FIELD.u0 - 6, FIELD.v0 - 6, FIELD.u1 + 6, FIELD.v1 + 6)}"/>
      <path class="dc-groove" d="${faceRect(FIELD.u0 - 5, FIELD.v1 + 5, FIELD.u0 + 20, FIELD.v1 + 6.4)}"/>
      <circle class="dc-bolt" cx="${FIELD.u0 - 4.4}" cy="${FIELD.v0 - 4.4}" r="0.9"/>
      <circle class="dc-bolt" cx="${FIELD.u1 + 4.4}" cy="${FIELD.v0 - 4.4}" r="0.9"/>
      <circle class="dc-bolt" cx="${FIELD.u0 - 4.4}" cy="${FIELD.v1 + 4.4}" r="0.9"/>
      <circle class="dc-bolt" cx="${FIELD.u1 + 4.4}" cy="${FIELD.v1 + 4.4}" r="0.9"/>
    </g>`,
  );

  for (const x of [PED.x + 1, PED.x + PED.w - 9]) {
    part(`lug-${x}`, solid(k.slabOf({ x, y: -29, w: 8, d: 12, r: 1.5 }, 38, 12, P, 4, 0.6), "hi"));
    part(`lug-ring-${x}`, line(k.ring(x + 4, -23, 2.6, 50, P, 16), "lo") + topDots([[x + 4, -23]], 50, { size: 0.45, tone: "mid" }));
  }

  /* ── 3. junction box ─────────────────────────────────────────────────── */

  part("box", solid(k.slabOf(BOX, 0, BOX_H, P, 4, 0.8), "mid", { inner: line(k.sideSeam(BOX, 9, P, 4), "faint") }));
  part("box-lid", solid(k.slabOf(k.insetPlan(BOX, 2.5), BOX_H, 2.4, P, 4, 0.5), "mid"));
  part("box-bolts", topDots(k.corners(BOX, 5.5), BOX_H + 2.4, { size: 0.45, tone: "mid" }));
  part("box-tag", line(k.planOutline({ x: BOX.x + 6, y: BOX.y + 6, w: 18, d: 14, r: 1 }, BOX_H + 2.4, P, 4), "faint"));

  /* ── 4. key, lock, lamp ──────────────────────────────────────────────── */

  part("keydeck", solid(k.slabOf(KEYDECK, 0, DECK_H, P, 4, 0.8), "mid", { inner: line(k.sideSeam(KEYDECK, 8, P, 4), "faint") }));
  part("keydeck-top", line(k.planOutline(k.insetPlan(KEYDECK, 2.2), DECK_H, P), "faint"));
  part("deck-screws", topDots(k.corners(KEYDECK, 4), DECK_H, { size: 0.45, tone: "mid" }));

  part("lock-block", solid(k.slabOf({ x: -124, y: 30, w: 32, d: 18, r: 2 }, DECK_H, 13, P, 4, 0.7), "hi"));
  part("lock-collar", solid(k.cylinder(LOCK[0], LOCK[1], LOCK_R + 1.6, DECK_H + 13, 2.6, P, 40, 0.4), "hi"));
  part("lock-cylinder", solid(k.cylinder(LOCK[0], LOCK[1], LOCK_R, DECK_H + 15.6, 4.4, P, 40, 0.5), "hi"));
  part("lock-knurl", line(k.knurl(LOCK[0], LOCK[1], LOCK_R, DECK_H + 16.6, DECK_H + 20, 48, P, 0.4), "lo"));

  const shutterM = k.topMatrix([LOCK[0], LOCK[1]], DECK_H + 20.2, P);
  part(
    "shutter",
    `<g transform="${shutterM}"><g id="dc-shutter">
      <circle class="dc-shutter" r="6.4"/>
      <circle class="dc-ring" r="4.6"/>
      <path class="dc-slot" d="M-1.1 -4.2H1.1V1.2L-1.1 3.2Z"/>
      <path class="dc-groove" d="M-6.4 0H-4.2M4.2 0H6.4"/>
    </g></g>`,
  );

  const keyBase = DECK_H + 20.4;
  const keyArt = [
    solid(k.slabOf({ x: -110.4, y: 37.9, w: 4.8, d: 3.4, r: 0.5 }, keyBase, 9, P, 3), "hi", { lit: true, crease: "lo" }),
    solid(k.slabOf({ x: -111.4, y: 37.7, w: 2.4, d: 3.8, r: 0.6 }, keyBase + 2.4, 2.4, P, 3), "hi", { lit: true }),
    solid(k.slabOf({ x: -110.4, y: 37.9, w: 1.6, d: 3.4, r: 0.4 }, keyBase + 6.4, 2, P, 3), "hi", { lit: true }),
    solid(k.slabOf({ x: -116.2, y: 37.5, w: 12.2, d: 4.4, r: 4.4 }, keyBase + 9, 8.6, P, 10, 0.6), "hi", { lit: true, crease: "lo" }),
  ].join("");
  part("key", `<g id="dc-key">${keyArt}</g>`);

  part(
    "lamp",
    solid(k.cylinder(LAMP[0], LAMP[1], 3.4, DECK_H, 3, P, 24), "mid") +
      solid(k.cylinder(LAMP[0], LAMP[1], 2.3, DECK_H + 3, 13, P, 20), "mid", { crease: "none" }),
  );
  part("lamp-cap", solid(k.cylinder(LAMP[0], LAMP[1], 4.2, DECK_H + 16, 3.6, P, 24, 0.4), "hi"));
  const lampM = k.topMatrix([LAMP[0], LAMP[1]], DECK_H + 19.8, P);
  part(
    "lamp-glow",
    `<g transform="${lampM}"><g id="dc-glow" opacity="0">
      <circle r="24" fill="url(#dc-glow-far)"/>
      <circle r="12" fill="url(#dc-glow-near)"/>
    </g><circle id="dc-lamp" class="dc-lamp-dot" r="2.1"/></g>`,
  );

  /* ── 5. handset on its cradle ────────────────────────────────────────── */

  part("cradle", solid(k.slabOf(HAND, 0, 4, P, 4, 0.6), "mid"));
  part("cradle-top", line(k.planOutline(k.insetPlan(HAND, 2.5), 4, P), "faint"));
  for (const x of [HAND.x, HAND.x + HAND.w - 6]) {
    part(`ear-${x}`, solid(k.slabOf({ x, y: 4, w: 6, d: 18, r: 1.6 }, 4, 4, P, 4, 0.5), "mid"));
    part(`ear-top-${x}`, line(k.planOutline({ x: x + 1, y: 5, w: 4, d: 16, r: 1.2 }, 8, P, 4), "faint"));
  }
  part("handset-cup-a", solid(k.cylinder(-37, 12, 5.6, 5, 5.4, P, 28, 0.5), "hi"));
  part("handset-cup-b", solid(k.cylinder(-1, 12, 5.6, 5, 5.4, P, 28, 0.5), "hi"));
  part("handset-grip", solid(k.slabOf({ x: -33, y: 9.4, w: 32, d: 5.2, r: 2.4 }, 9.4, 4.2, P, 4, 0.6), "hi"));
  part("handset-seam", line(k.lineOnTop([-30, 12], [-4, 12], 13.6, P), "faint"));

  /* ── 6. cables ───────────────────────────────────────────────────────── */

  const cable = (from, to, via) => k.wireSvg(from, to, { via, tone: "lo", size: 0.9 });
  part("cable-dial", cable([-4, -34, 12], [30, -34, 14], [[12, -40, 7], [22, -39, 7]]));
  part("cable-fare", cable([0, -24, 11], [26, 9, 11], [[8, -10, 6], [16, 0, 6], [22, 6, 6]]));
  part("cable-hand", cable([2, 14, 9], [-12, -21, 11], [[9, 4, 6], [0, -10, 6], [-8, -16, 6]]));

  for (const [i, [x, y], z] of [
    [0, [14, -40], 6.6],
    [1, [11, -9], 6.6],
    [2, [-2, -11], 6.6],
  ]) {
    part(`clamp-${i}`, solid(k.slabOf({ x: x - 2.5, y: y - 1.8, w: 5, d: 3.6, r: 0.8 }, 0, z, P, 3, 0.4), "lo"));
    part(`clamp-screw-${i}`, topDots([[x, y]], z, { size: 0.35, tone: "mid" }));
  }

  /* ── 7. the dial ─────────────────────────────────────────────────────── */

  part("dial-flange", solid(k.cylinder(DIAL[0], DIAL[1], 36, 0, 4, P, 64, 0.5), "lo"));
  part("dial-housing", solid(k.cylinder(DIAL[0], DIAL[1], 30, 4, 20, P, 64, 0.8), "mid"));
  part("dial-seams", line(k.sideArc(DIAL[0], DIAL[1], 30, 10, P, 40) + k.sideArc(DIAL[0], DIAL[1], 30, 18, P, 40), "faint"));
  for (let i = 0; i < 3; i += 1) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    part(
      `dial-flange-bolt-${i}`,
      topDots([[DIAL[0] + Math.cos(a) * 33, DIAL[1] + Math.sin(a) * 33]], 4, { size: 0.5, tone: "mid" }),
    );
  }

  part("dial-body", solid(k.cylinder(DIAL[0], DIAL[1], DIAL_R, 24, 6, P, 72, 0.8), "hi"));
  part("dial-knurl", line(k.knurl(DIAL[0], DIAL[1], DIAL_R, 26.4, 30, 84, P, 0.35), "lo"));
  part("dial-bezel", line(k.ring(DIAL[0], DIAL[1], DIAL_R - 2.6, 30.02, P, 72), "lo"));
  part("dial-face-ring", line(k.ring(DIAL[0], DIAL[1], 26.5, 30.02, P, 72), "faint"));
  part("dial-inner-ring", line(k.ring(DIAL[0], DIAL[1], 15.5, 30.02, P, 64), "faint"));

  const dialTicks = k.radialTicks(DIAL[0], DIAL[1], 26.2, 60, 5, 30.05, [1.5, 3.4], P);
  part("dial-ticks-minor", line(dialTicks.minor, "lo"));
  part("dial-ticks-major", line(dialTicks.major, "mid"));

  for (const [dx, dy, label] of [
    [0, -21.5, "60"],
    [21.5, 0, "45"],
    [0, 21.5, "30"],
    [-21.5, 0, "15"],
  ]) {
    part(
      `dial-numeral-${label}`,
      k.faceTextSvg(k.topMatrix([DIAL[0] + dx, DIAL[1] + dy], 30.06, P), label, { size: 4.6, tone: "lo", anchor: "middle" }),
    );
  }

  part("dial-knob", solid(k.cylinder(DIAL[0], DIAL[1], 6.6, 30, 4, P, 40, 0.6), "hi"));
  part("dial-knob-knurl", line(k.knurl(DIAL[0], DIAL[1], 6.6, 31, 34, 30, P, 0.4), "lo"));

  const dialM = k.topMatrix([DIAL[0], DIAL[1]], 34.06, P);
  part(
    "dial-needle",
    `<g transform="${dialM}"><g id="dc-needle">
      <path class="dc-needle-tail" d="M0 0V5.2"/>
      <path class="dc-needle" d="M0 0V-23.4"/>
      <circle class="dc-needle-hub" r="2.5"/>
    </g></g>`,
  );

  /* ── 8. the fare drum ────────────────────────────────────────────────── */

  part(
    "fare",
    solid(k.slabOf(FARE, 0, FARE_H, P, 5, 1.2), "mid", {
      inner: line(k.sideSeam(FARE, 26, P, 5) + k.sideSeam(FARE, 38, P, 5), "faint"),
    }),
  );
  part("fare-lid", solid(k.slabOf({ x: FARE.x + 3, y: FARE.y + 3, w: FARE.w - 6, d: FARE.d - 6, r: 3 }, FARE_H, 2.6, P, 4, 0.6), "mid"));
  part("fare-lid-line", line(k.planOutline({ x: FARE.x + 7, y: FARE.y + 7, w: FARE.w - 14, d: FARE.d - 14, r: 2 }, FARE_H + 2.6, P, 4), "faint"));
  part("fare-bolts", topDots(k.corners(FARE, 7), FARE_H + 2.6, { size: 0.5, tone: "mid" }));

  const wf = FARE_FACE;
  const wb = wf - 9;
  const zTopWin = FARE_H - WIN.v0;
  const zBotWin = FARE_H - WIN.v1;

  part("fare-cavity", `<path class="dc-cavity" d="${quad([WIN.u0, wb, zTopWin], [WIN.u1, wb, zTopWin], [WIN.u1, wb, zBotWin], [WIN.u0, wb, zBotWin])}"/>`);
  part("fare-wall-top", `<path class="dc-wall-dark" d="${quad([WIN.u0, wf, zTopWin], [WIN.u1, wf, zTopWin], [WIN.u1, wb, zTopWin], [WIN.u0, wb, zTopWin])}"/>`);
  part("fare-wall-bot", `<path class="dc-wall-light" d="${quad([WIN.u0, wf, zBotWin], [WIN.u1, wf, zBotWin], [WIN.u1, wb, zBotWin], [WIN.u0, wb, zBotWin])}"/>`);
  part("fare-wall-left", `<path class="dc-wall-mid" d="${quad([WIN.u0, wf, zTopWin], [WIN.u0, wf, zBotWin], [WIN.u0, wb, zBotWin], [WIN.u0, wb, zTopWin])}"/>`);
  part("fare-wall-right", `<path class="dc-wall-mid" d="${quad([WIN.u1, wf, zTopWin], [WIN.u1, wf, zBotWin], [WIN.u1, wb, zBotWin], [WIN.u1, wb, zTopWin])}"/>`);

  const df = faceLeft(wb, FARE_H, P);
  let clips = "";
  let drums = "";
  for (let i = 0; i < 4; i += 1) {
    const u0 = SLOT_TOP + i * (SLOT_W + SLOT_GAP);
    const cx = u0 + SLOT_W / 2;
    clips += `<clipPath id="dc-slot-${i}"><rect x="${r2(u0)}" y="${WIN.v0 + 1.4}" width="${SLOT_W}" height="${WIN.v1 - WIN.v0 - 2.8}"/></clipPath>`;
    drums += `<path class="dc-drum" d="${faceRect(u0, WIN.v0 + 1, u0 + SLOT_W, WIN.v1 - 1)}"/>`;
    const strip = "0123456789012345678901234567890123456789"
      .split("")
      .map(
        (digit, index) =>
          `<text class="iso-face-text dc-drum-digit" transform="translate(${r2(cx)} ${r2(WIN.v0 + 18 + index * DIGIT_STEP)})" font-size="17" text-anchor="middle">${digit}</text>`,
      )
      .join("");
    drums += `<g clip-path="url(#dc-slot-${i})"><g id="dc-wheel-${i}">${strip}</g></g>`;
    drums += `<path class="dc-drum-edge" d="${faceRect(u0, WIN.v0 + 1, u0 + 1.6, WIN.v1 - 1)}${faceRect(u0 + SLOT_W - 1.6, WIN.v0 + 1, u0 + SLOT_W, WIN.v1 - 1)}"/>`;
  }
  drums += `<path class="dc-window-shade" d="${faceRect(WIN.u0, WIN.v0 + 1, WIN.u1, WIN.v0 + 2.4)}${faceRect(WIN.u0, WIN.v1 - 2.4, WIN.u1, WIN.v1 - 1)}"/>`;
  part("fare-drums", `<defs>${clips}</defs><g transform="${df}">${drums}</g>`);

  const fareFace = faceLeft(wf, FARE_H, P);
  part(
    "fare-mark",
    `<g transform="${fareFace}">
      ${k.faceTextSvg(`translate(36 22.4)`, "£", { size: 14, tone: "hi" })}
      <circle class="dc-point" cx="${r2(SLOT_TOP + 2 * SLOT_W + SLOT_GAP + 1.5)}" cy="22.4" r="1.05"/>
    </g>`,
  );
  part(
    "fare-rules",
    `<g transform="${fareFace}">
      ${[0, 1, 2].map((i) => `<path class="dc-rule" d="M${52 + i * 2} ${37.5 + i * 3}H${120 - i * 14}"/>`).join("")}
      <circle class="dc-bolt" cx="134" cy="42.5" r="0.9"/>
      <circle class="dc-bolt" cx="38" cy="42.5" r="0.9"/>
    </g>`,
  );

  /* the hasp: a lower jaw, the bolt, then the upper jaw over it */
  part("hasp-low", solid(k.slabOf({ x: 90, y: 64.8, w: 12, d: 5.2, r: 1 }, 38.4, 1.3, P, 3, 0.3), "hi"));
  part(
    "fare-bolt",
    `<g id="dc-bolt">${solid(k.slabOf({ x: 58, y: 66.2, w: 22, d: 3.2, r: 0.8 }, 40.4, 3, P, 3, 0.4), "hi")}${line(
      k.lineOnTop([63, 67.8], [75, 67.8], 43.4, P),
      "lo",
    )}</g>`,
  );
  part("hasp-high", solid(k.slabOf({ x: 90, y: 64.8, w: 12, d: 5.2, r: 1 }, 43.6, 1.4, P, 3, 0.3), "hi"));

  /* ratchet and pawl on the right cheek */
  const rx = FARE.x + FARE.w + 0.8;
  const rc = [38, 18];
  const teeth = [];
  for (let i = 0; i < 32; i += 1) {
    const a = (i / 32) * Math.PI * 2;
    const rr = i % 2 === 0 ? 9 : 6.6;
    teeth.push(`${i === 0 ? "M" : "L"}${r2(rc[0] + Math.cos(a) * rr)} ${r2(rc[1] + Math.sin(a) * rr)}`);
  }
  const origin = iso([rx, 0, FARE_H]);
  const uAxis = iso([rx, 1, FARE_H]);
  const vAxis = iso([rx, 0, FARE_H - 1]);
  const rxM = `matrix(${r2(uAxis[0] - origin[0])} ${r2(uAxis[1] - origin[1])} ${r2(vAxis[0] - origin[0])} ${r2(vAxis[1] - origin[1])} ${r2(origin[0])} ${r2(origin[1])})`;
  part(
    "ratchet",
    `<g transform="${rxM}">
      <path class="dc-ratchet" d="${teeth.join("")}Z"/>
      <circle class="dc-ring" cx="${rc[0]}" cy="${rc[1]}" r="4.4"/>
      <circle class="dc-ring" cx="${rc[0]}" cy="${rc[1]}" r="1.5"/>
      <path class="dc-groove" d="M${rc[0] - 9.6} ${rc[1]}H${rc[0] - 11.4}M${rc[0] + 9.6} ${rc[1]}H${rc[0] + 11.4}"/>
    </g>`,
  );
  part(
    "pawl",
    `<g transform="${rxM}"><g id="dc-pawl">
      <path class="dc-pawl-body" d="M${rc[0] + 5.6} ${rc[1] - 15.4}L${rc[0] + 9.2} ${rc[1] - 15.4}L${rc[0] + 7.4} ${rc[1] - 8.6}L${rc[0] + 5.2} ${rc[1] - 9.2}Z"/>
      <circle class="dc-ring" cx="${rc[0] + 7.4}" cy="${rc[1] - 15.4}" r="1.5"/>
    </g></g>`,
  );

  /* ── 9. assemble ─────────────────────────────────────────────────────── */

  const body = out.map((entry) => entry.svg).join("");
  const liftVec = k.axisVector(P, [0, 0, -KEYLIFT]);
  const boltVec = k.axisVector(P, [BOLT_TRAVEL, 0, 0]);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="iso iso-svg dc-svg" data-theme="dark" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="dc-title dc-desc"
  data-dc-lift="${r2(liftVec[1])}" data-dc-bolt="${r2(boltVec[0])} ${r2(boltVec[1])}" data-dc-wheel="${DIGIT_STEP}">
  <title id="dc-title">Dispatch console</title>
  <desc id="dc-desc">An isometric desk instrument: a split-flap departure board, a pickup dial counting the hour down, a fare drum bolted at eighty-four pounds, and the key that lifts when the quote is sealed.</desc>
  <style>${k.ISO_CSS}${CSS}</style>
  <defs>
    <radialGradient id="dc-glow-far">
      <stop offset="0" stop-color="#ec4899" stop-opacity="0.36"/>
      <stop offset="0.55" stop-color="#ec4899" stop-opacity="0.12"/>
      <stop offset="1" stop-color="#ec4899" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="dc-glow-near">
      <stop offset="0" stop-color="#ec4899" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#ec4899" stop-opacity="0"/>
    </radialGradient>
  </defs>
  ${body}
</svg>`;

  return { svg, projection: P, parts: out };
}

export const CSS = `
.dc-svg{
  --anatomy-page:#0b0709;--anatomy-card:#110b0e;
  --anatomy-text:#b9adb2;--anatomy-strong:#f4eef0;--anatomy-muted:#7c6f75;
  --anatomy-paper:#d9d0c3;--anatomy-face:#ebe5da;--anatomy-top:#f8f3eb;
  --anatomy-shade-0:#9d9386;--anatomy-shade-1:#b5ab9e;--anatomy-shade-2:#cbc2b4;--anatomy-shade-3:#e0d8cb;
  --anatomy-lit-top:#ffffff;--anatomy-lit-shade:#f2ebdf;
  --anatomy-hi:#241b21;--anatomy-mid:#5f5159;--anatomy-lo:#8e7f87;--anatomy-faint:#b8aab1;--anatomy-lit:#fffdf8;
  --anatomy-halo:#000000;--anatomy-halo-opacity:.8;--anatomy-dot:#241b21;
  --anatomy-weight:.7px;
  --dc-field:#0a0d0e;--dc-tile:#242b2e;--dc-tile-shade:#171d20;
  --dc-cavity:#040607;--dc-drum:#090c0d;--dc-drum-edge:#030505;
  --dc-wall-dark:#070a0b;--dc-wall-light:#2f3639;--dc-wall-mid:#161b1d;
}
.dc-svg .dc-face .dc-seam{fill:none;stroke:var(--anatomy-faint);stroke-width:var(--anatomy-weight)}
.dc-svg .dc-face .dc-recess{fill:var(--anatomy-shade-0);stroke:none}
.dc-svg .dc-face .dc-plate{fill:var(--anatomy-shade-3);stroke:var(--anatomy-lo);stroke-width:.5}
.dc-svg .dc-face .dc-groove{fill:none;stroke:var(--anatomy-faint);stroke-width:.5}
.dc-svg .dc-face .dc-bolt{fill:var(--anatomy-mid);stroke:none}
.dc-svg .dc-boardfield{fill:var(--dc-field);stroke:var(--anatomy-lo);stroke-width:.5}
.dc-svg .dc-tile{fill:var(--dc-tile);stroke:none}
.dc-svg .dc-tile-shade{fill:var(--dc-tile-shade);stroke:none}
.dc-svg .dc-tile-text{fill:#f2ece3;font-size:11.5px}
.dc-svg .dc-drum-digit{fill:#f2ece3;font-size:17px}
.dc-svg .dc-frame{fill:var(--anatomy-shade-3);stroke:var(--anatomy-faint);stroke-width:.4}
.dc-svg .dc-shutter{fill:var(--anatomy-shade-3);stroke:var(--anatomy-lo);stroke-width:.5}
.dc-svg .dc-ring{fill:none;stroke:var(--anatomy-lo);stroke-width:.55}
.dc-svg .dc-slot{fill:var(--anatomy-shade-0);stroke:none}
.dc-svg .dc-lamp-dot{fill:#ec4899;opacity:.22}
.dc-svg .dc-needle{fill:none;stroke:var(--dc-accent,#ec4899);stroke-width:1.5;stroke-linecap:round}
.dc-svg .dc-needle-tail{fill:none;stroke:var(--anatomy-mid);stroke-width:1.1;stroke-linecap:round}
.dc-svg .dc-needle-hub{fill:var(--anatomy-top);stroke:var(--anatomy-hi);stroke-width:.7}
.dc-svg .dc-cavity{fill:var(--dc-cavity);stroke:none}
.dc-svg .dc-wall-dark{fill:var(--dc-wall-dark);stroke:none}
.dc-svg .dc-wall-light{fill:var(--dc-wall-light);stroke:none}
.dc-svg .dc-wall-mid{fill:var(--dc-wall-mid);stroke:none}
.dc-svg .dc-drum{fill:var(--dc-drum);stroke:none}
.dc-svg .dc-drum-edge{fill:var(--dc-drum-edge);stroke:none}
.dc-svg .dc-window-shade{fill:var(--dc-drum-edge);stroke:none;opacity:.75}
.dc-svg .dc-point{fill:var(--anatomy-hi);stroke:none}
.dc-svg .dc-rule{fill:none;stroke:var(--anatomy-faint);stroke-width:.55;stroke-linecap:round}
.dc-svg .dc-ratchet{fill:var(--anatomy-shade-3);stroke:var(--anatomy-mid);stroke-width:.5}
.dc-svg .dc-pawl-body{fill:var(--anatomy-hi);stroke:var(--anatomy-hi);stroke-width:.4}
.dc-svg text{font-family:var(--anatomy-mono);letter-spacing:.02em}
`;

export { BOARD_TOP, DIAL_Z, PED_H, LOCK, KEYLIFT, BOLT_TRAVEL };
