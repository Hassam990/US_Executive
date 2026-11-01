const LOOP_MS = 26000;
const DIAL_MIN = 0;
const DIAL_MAX = 60;
const SET_MINUTE = 7;
const QUOTE_DIGITS = [8,4,0,0];

const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));
const easeInOut = (t) => {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const span = function span(t, from, to, ease = easeInOut) {
  if (to === from) return t >= to ? 1 : 0;
  return ease((t - from) / (to - from));
};
const stateAt = function stateAt(ms) {
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
};
const needleDegrees = function needleDegrees(minute) {
  return ((DIAL_MAX - clamp(minute, DIAL_MIN, DIAL_MAX)) / DIAL_MAX) * 360;
};

/**
 * Wire the drawing to the model. Returns a cleanup function.
 * The drawing is static; only the nine things that move are touched.
 */
function startDispatchConsole(root) {
  if (!root) return () => {};

  const lift = Number(root.dataset.dcLift);
  const [boltX, boltY] = String(root.dataset.dcBolt || "0 0").split(" ").map(Number);
  const step = Number(root.dataset.dcWheel) || 16;

  const needle = root.querySelector("#dc-needle");
  const key = root.querySelector("#dc-key");
  const bolt = root.querySelector("#dc-bolt");
  const shutter = root.querySelector("#dc-shutter");
  const glow = root.querySelector("#dc-glow");
  const lamp = root.querySelector("#dc-lamp");
  const wheels = [0, 1, 2, 3].map((i) => root.querySelector("#dc-wheel-" + i));
  const tiles = Array.from(root.querySelectorAll("[data-ch]"));
  const host = root.closest("[data-dc-host]") || root.closest(".iso-plate");
  const readout = host ? host.querySelector("[data-readout]") : null;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;
  let started = performance.now();
  let elapsed = 0;

  function apply(ms) {
    const s = stateAt(ms);

    if (needle) needle.setAttribute("transform", "rotate(" + needleDegrees(s.minute).toFixed(2) + ")");
    if (key) key.setAttribute("transform", "translate(0 " + (lift * s.key).toFixed(2) + ")");
    if (bolt) bolt.setAttribute("transform", "translate(" + (boltX * s.bolt).toFixed(2) + " " + (boltY * s.bolt).toFixed(2) + ")");
    if (shutter) shutter.setAttribute("transform", "rotate(" + (-26 * s.key).toFixed(2) + ")");
    if (glow) glow.setAttribute("opacity", s.lamp.toFixed(3));
    if (lamp) lamp.style.opacity = (0.22 + 0.78 * s.lamp).toFixed(3);

    for (let i = 0; i < wheels.length; i += 1) {
      if (wheels[i]) {
        wheels[i].setAttribute("transform", "translate(0 " + (-QUOTE_DIGITS[i] * step * s.drum).toFixed(2) + ")");
      }
    }

    const p = s.flipAt >= 0 ? Math.min(1, s.flipAt / 700) : -1;
    const squash = p >= 0 ? Math.max(0.02, Math.abs(Math.cos(Math.PI * p))) : 1;

    for (const tile of tiles) {
      const nowChar = s.status ? tile.dataset.alt : tile.dataset.ch;
      const wasChar = s.status ? tile.dataset.ch : tile.dataset.alt;
      const char = p >= 0 && p < 0.5 ? wasChar : nowChar;
      const text = tile.firstElementChild;
      if (text && text.textContent !== char) text.textContent = char;
      if (p >= 0) tile.setAttribute("transform", "scale(1 " + squash.toFixed(3) + ")");
      else tile.removeAttribute("transform");
    }

    if (readout) {
      const minutes = String(Math.round(s.minute)).padStart(2, "0");
      const fare = s.drum < 0.02 ? "£--.--" : "£84.00";
      const mode =
        s.bolt > 0.5 ? "SEALED" : s.drum > 0.02 && s.drum < 0.995 ? "SETTING" : s.t >= 19000 && s.t < 21500 ? "RELEASED" : "OPEN";
      readout.textContent = "DIAL " + minutes + " · " + fare + " · " + mode;
    }
  }

  function tick(now) {
    elapsed = now - started;
    apply(elapsed);
    frame = window.requestAnimationFrame(tick);
  }

  function play() {
    window.cancelAnimationFrame(frame);
    started = performance.now() - (elapsed % LOOP_MS);
    frame = window.requestAnimationFrame(tick);
  }

  function pause() {
    window.cancelAnimationFrame(frame);
  }

  function onVisibility() {
    if (document.hidden) pause();
    else if (!reduced.matches) play();
  }

  function onMotion() {
    if (reduced.matches) {
      pause();
      apply(9000);
    } else {
      elapsed = 0;
      play();
    }
  }

  if (reduced.matches) apply(9000);
  else play();

  document.addEventListener("visibilitychange", onVisibility);
  if (reduced.addEventListener) reduced.addEventListener("change", onMotion);

  return () => {
    pause();
    document.removeEventListener("visibilitychange", onVisibility);
    if (reduced.removeEventListener) reduced.removeEventListener("change", onMotion);
  };
}

export { startDispatchConsole };
