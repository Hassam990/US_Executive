/**
 * The dispatch console's model.
 *
 * One machine, one cycle: the pickup dial is set, the quote drum rolls to a
 * fixed fare and is bolted, the key lifts as the seal is released. Every
 * number the figure shows comes from here, so the drawing, the live layer and
 * the printed caption cannot disagree.
 *
 * Minutes run 0..60 round the dial (60 at the top, 0 back at the top).
 * The fare never changes: £84.00 is the quote the drum is bolted at.
 */

export const LOOP_MS = 26000;

export const DIAL_MIN = 0;
export const DIAL_MAX = 60;

/** The quote, in pence. Fixed: the drum rolls to it, then the bolt drops. */
export const QUOTE = 8400;
export const QUOTE_DIGITS = [8, 4, 0, 0];

/** Flight-board status row: what the board says before / after the flight lands. */
export const STATUS = ["ON TIME", "LANDED"];

/** The pickup window the console settles on (minutes to pickup). */
export const SET_MINUTE = 7;

export const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));

export const easeInOut = (t) => {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
export const easeIn = (t) => Math.pow(clamp(t, 0, 1), 3);

/** 0 → 1 across [from, to], eased. */
export function span(t, from, to, ease = easeInOut) {
  if (to === from) return t >= to ? 1 : 0;
  return ease((t - from) / (to - from));
}

/**
 * The dial's needle: 60 minutes at 12 o'clock, 45 at 3, 30 at 6, 15 at 9 —
 * so the count-down runs clockwise the long way round, 60 → 7.
 */
export function needleDegrees(minute) {
  return ((DIAL_MAX - clamp(minute, DIAL_MIN, DIAL_MAX)) / DIAL_MAX) * 360;
}

/** The three-digit readout that sits under the dial. */
export function minuteLabel(minute) {
  return String(Math.round(clamp(minute, DIAL_MIN, DIAL_MAX))).padStart(2, "0");
}

/** £84.00 → "£84.00" (used by the page readout, not by the drawing). */
export function quoteLabel(pence = QUOTE) {
  const pounds = Math.floor(pence / 100);
  const rest = String(pence % 100).padStart(2, "0");
  return `£${pounds}.${rest}`;
}

/** A screen-space matrix for a turn about the vertical axis (plan rotation). */
export function planTurnMatrix(degrees, azimuth = 45, elevation = 30) {
  const a = (azimuth * Math.PI) / 180;
  const e = (elevation * Math.PI) / 180;
  const theta = (degrees * Math.PI) / 180;
  const A = [
    [Math.sin(a), -Math.cos(a)],
    [Math.cos(a) * Math.sin(e), Math.sin(a) * Math.sin(e)],
  ];
  const R = [
    [Math.cos(theta), -Math.sin(theta)],
    [Math.sin(theta), Math.cos(theta)],
  ];
  const mul = (m, n) => [
    [m[0][0] * n[0][0] + m[0][1] * n[1][0], m[0][0] * n[0][1] + m[0][1] * n[1][1]],
    [m[1][0] * n[0][0] + m[1][1] * n[1][0], m[1][0] * n[0][1] + m[1][1] * n[1][1]],
  ];
  const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  const inv = [
    [A[1][1] / det, -A[0][1] / det],
    [-A[1][0] / det, A[0][0] / det],
  ];
  const M = mul(mul(A, R), inv);
  return [M[0][0], M[0][1], M[1][0], M[1][1]];
}

/**
 * The cycle, as target values. The live layer eases towards these; nothing in
 * the drawing is rebuilt per frame except what physically changes.
 *
 * 0.0–1.0   at rest: dial open at 60, bolt out, key seated, lamp off
 * 1.0–6.4   set: the needle sweeps 60 → 7, the drum rolls to 84.00
 * 2.4       the board's status row flips to LANDED
 * 6.4–7.1   the bolt drops, the key lifts, the lamp comes on
 * 7.1–19.0  locked: the needle creeps, everything else holds
 * 19.0–21.5 release: bolt out, key seated, lamp off, needle returns to 60
 * 20.5      the board flips back to ON TIME
 * 21.5–26.0 at rest again
 */
export function stateAt(ms) {
  const t = ((ms % LOOP_MS) + LOOP_MS) % LOOP_MS;

  let minute;
  if (t < 1000) minute = DIAL_MAX;
  else if (t < 6400) minute = DIAL_MAX + (SET_MINUTE - DIAL_MAX) * easeInOut((t - 1000) / 5400);
  else if (t < 19000) minute = SET_MINUTE - 0.9 * span(t, 7000, 19000, easeInOut);
  else if (t < 21500) minute = SET_MINUTE - 0.9 + (DIAL_MAX - SET_MINUTE + 0.9) * easeInOut((t - 19000) / 2500);
  else minute = DIAL_MAX;

  const bolt = t < 6400 ? 0 : t < 7000 ? span(t, 6400, 6800, easeOut) : t < 19000 ? 1 : t < 19400 ? 1 - span(t, 19000, 19400, easeOut) : 0;
  const key = t < 6520 ? 0 : t < 7300 ? span(t, 6520, 7300, easeOut) : t < 19150 ? 1 : t < 19900 ? 1 - span(t, 19150, 19900, easeOut) : 0;
  const lamp = t < 6550 ? 0 : t < 7250 ? span(t, 6550, 7250, easeOut) : t < 19100 ? 1 : t < 19900 ? 1 - span(t, 19100, 19900, easeOut) : 0;

  const status = t < 2400 || t >= 20500 ? 0 : 1;
  const flipAt = t >= 2400 && t < 3100 ? t - 2400 : t >= 20500 && t < 21200 ? t - 20500 : -1;

  // The drum rolls once, as the quote is set, then stays.
  const drum = t < 1000 ? 0 : t < 6400 ? span(t, 1000, 6200, easeOut) : 1;

  return { t, minute, bolt, key, lamp, status, flipAt, drum };
}
