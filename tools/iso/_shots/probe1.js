(() => {
  const out = { viewport: [innerWidth, innerHeight], hits: [], stack: [] };
  const pts = [[720, 200], [730, 700], [760, 450], [1100, 400], [1420, 100], [600, 450]];
  for (const [x, y] of pts) {
    const els = document.elementsFromPoint(x, y).slice(0, 5).map((e) => {
      const r = e.getBoundingClientRect();
      const cs = getComputedStyle(e);
      return e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + "." + String(e.className || "").toString().slice(0, 80) +
        " [" + [r.left, r.top, r.width, r.height].map((n) => Math.round(n)).join(",") + "] bg=" + cs.backgroundColor + " bgimg=" + cs.backgroundImage.slice(0, 60);
    });
    out.hits.push({ at: [x, y], els });
  }
  // widest/tallest elements that are white
  let el = document.elementFromPoint(720, 200);
  while (el && el !== document.documentElement) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    out.stack.push(el.tagName.toLowerCase() + "." + String(el.className || "").toString().slice(0, 70) + " [" + [r.left, r.top, r.width, r.height].map((n) => Math.round(n)).join(",") + "] bg=" + cs.backgroundColor);
    el = el.parentElement;
  }
  return out;
})()
