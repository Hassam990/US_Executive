import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./iso-kit.mjs";
import { buildArt, W, H } from "./art.mjs";
import {
  LOOP_MS,
  DIAL_MAX,
  SET_MINUTE,
  QUOTE_DIGITS,
  stateAt,
  needleDegrees,
  span,
  easeInOut,
  easeOut,
  clamp,
} from "../../src/components/anatomy/model.js";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..");
const outDir = join(here, "out");
mkdirSync(outDir, { recursive: true });

const { svg } = buildArt();

/* ── the live layer, generated from the same model the drawing uses ─────── */

const liveBody = `
const LOOP_MS = ${LOOP_MS};
const DIAL_MIN = 0;
const DIAL_MAX = ${DIAL_MAX};
const SET_MINUTE = ${SET_MINUTE};
const QUOTE_DIGITS = ${JSON.stringify(QUOTE_DIGITS)};

const clamp = ${clamp.toString()};
const easeInOut = ${easeInOut.toString()};
const easeOut = ${easeOut.toString()};
const span = ${span.toString()};
const stateAt = ${stateAt.toString()};
const needleDegrees = ${needleDegrees.toString()};

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
`.trim();

/* ── the card ───────────────────────────────────────────────────────────── */

const body = k.plateHtml({
  fig: "FIG. 01 · DISPATCH",
  title: "US EXECUTIVE",
  hint: "ONE CYCLE · 26 S",
  readout: "DIAL 60 · £--.-- · OPEN",
  caption: "Set the pickup. Seal the quote. Release the car.",
  body: svg,
});

const page = k.pageHtml({
  title: "US Executive — dispatch console",
  theme: "dark",
  body,
  script: `${liveBody}\nstartDispatchConsole(document.querySelector(".dc-svg"));`,
  width: 880,
});

const svgDoc = svg.replace(
  `<svg xmlns="http://www.w3.org/2000/svg"`,
  `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg"`,
);

writeFileSync(join(outDir, "dispatch-console.html"), page);
writeFileSync(join(outDir, "figure.svg"), svgDoc);
writeFileSync(join(repo, "src", "components", "anatomy", "dispatch-figure.svg"), svgDoc);
writeFileSync(join(repo, "src", "components", "anatomy", "dispatch-live.js"), `${liveBody}\n\nexport { startDispatchConsole };\n`);
writeFileSync(
  join(repo, "src", "components", "anatomy", "dispatch-live.d.ts"),
  `export declare function startDispatchConsole(root: Element | null): () => void;\n`,
);

console.log(`wrote dispatch-console.html (${page.length} bytes, ${W}×${H})`);
console.log(`wrote figure.svg + src/components/anatomy/{dispatch-figure.svg,dispatch-live.js}`);
