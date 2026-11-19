/** True when any element matching the selectors is at least partly on screen. */
export function anyInView(selectors) {
  const h = window.innerHeight || document.documentElement.clientHeight;
  return selectors.some(sel => [...document.querySelectorAll(sel)].some(el => {
    const r = el.getBoundingClientRect();
    return r.height > 0 && r.top < h - 40 && r.bottom > 80;
  }));
}
