// WCAG 2.2 contrast helpers and the token pair checker. Pure functions, no I/O.

function channel(hex, i) {
  const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) throw new Error(`not a #RRGGBB colour: ${hex}`);
  return 0.2126 * channel(hex, 0) + 0.7152 * channel(hex, 1) + 0.0722 * channel(hex, 2);
}

export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** kds has no brand block of its own and uses the dark brand colours. */
export function brandKey(theme) {
  return theme === "kds" ? "dark" : theme;
}

export function resolveRef(tokens, theme, ref) {
  const colors = tokens.color.themes[theme];
  if (ref.startsWith("brand.")) return tokens.brand[ref.slice(6)][brandKey(theme)];
  if (ref.startsWith("sync.")) {
    const [, state, part] = ref.split(".");
    const entry = tokens.color.sync[state];
    return part === "fg" ? entry.fg[theme] : colors[entry.bg];
  }
  const value = colors[ref];
  if (typeof value !== "string") throw new Error(`unknown token ref "${ref}" in theme ${theme}`);
  return value;
}

export function requiredRatio(kind, theme) {
  if (kind === "ui") return 3;
  return theme === "highContrast" ? 7 : 4.5;
}

/** One result per (theme, pair). `pass` is false below the required ratio. */
export function checkContrast(tokens, pairs) {
  const results = [];
  for (const theme of Object.keys(tokens.color.themes)) {
    for (const p of pairs) {
      const fg = resolveRef(tokens, theme, p.fg);
      const bg = resolveRef(tokens, theme, p.bg);
      const ratio = contrastRatio(fg, bg);
      const min = requiredRatio(p.kind, theme);
      results.push({
        theme,
        fg: p.fg,
        bg: p.bg,
        kind: p.kind,
        fgHex: fg,
        bgHex: bg,
        ratio,
        min,
        pass: ratio >= min,
      });
    }
  }
  return results;
}
