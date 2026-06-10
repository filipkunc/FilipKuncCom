// Reads the site's theme colors (--bg/--fg CSS variables from Layout.astro)
// so the GL demos render in the active palette. Falls back to black-on-white
// for the standalone test pages, which define no variables.

function parseHex(s, fallback) {
  const m = s.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return fallback;
  let h = m[1];
  if (h.length === 3) h = h.replace(/./g, (c) => c + c);
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
    1,
  ];
}

export function themeColors() {
  const cs = getComputedStyle(document.documentElement);
  const bgVar = cs.getPropertyValue('--bg');
  const fgVar = cs.getPropertyValue('--fg');
  const bg = parseHex(bgVar, [1, 1, 1, 1]);
  const fg = parseHex(fgVar, [0, 0, 0, 1]);
  return {
    bg,
    fg,
    css: {
      bg: bgVar.trim() || '#ffffff',
      fg: fgVar.trim() || '#000000',
    },
  };
}

/** Fires on the site's theme toggle and on OS scheme changes. */
export function onThemeChange(cb) {
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', cb);
}
