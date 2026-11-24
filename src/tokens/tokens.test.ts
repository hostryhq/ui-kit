// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildAll } from "../../scripts/build-tokens.mjs";
import { checkContrast, contrastRatio } from "../../scripts/contrast-lib.mjs";
import { createThemeController, applyTheme } from "../theme/theme";
import { themeNames, tokens } from "./tokens";

const source = JSON.parse(readFileSync("tokens/tokens.json", "utf8")) as typeof tokens;
const { pairs } = JSON.parse(readFileSync("tokens/contrast-pairs.json", "utf8")) as {
  pairs: Parameters<typeof checkContrast>[1];
};

describe("generated tokens", () => {
  it("tokens.css and tokens.ts are up to date with tokens/tokens.json (run pnpm tokens)", () => {
    for (const [path, content] of Object.entries(buildAll())) {
      expect(readFileSync(path, "utf8"), path).toBe(content);
    }
  });

  it("every theme defines the same semantic colour keys as light", () => {
    const keys = (t: string) =>
      Object.keys(source.color.themes[t as "light"])
        .filter((k) => !k.startsWith("_"))
        .sort();
    for (const theme of themeNames) expect(keys(theme), theme).toEqual(keys("light"));
  });

  it("keeps the 44 px touch minimum", () => {
    expect(tokens.size.touchMin).toBe(44);
    expect(readFileSync("src/tokens/tokens.css", "utf8")).toMatch(/--hy-size-touch-min:\s*44px/);
  });
});

describe("WCAG AA contrast (CI gate)", () => {
  it("contrast maths matches known values", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#777777", "#FFFFFF")).toBeCloseTo(4.48, 2);
  });

  it("every text and UI pair in every theme meets its threshold", () => {
    const results = checkContrast(source, pairs);
    expect(results.length).toBeGreaterThan(100);
    const failures = results
      .filter((r) => !r.pass)
      .map((r) => `${r.theme} ${r.fg} on ${r.bg}: ${r.ratio.toFixed(2)} < ${r.min}`);
    expect(failures).toEqual([]);
  });

  it("detects a violation when a token is degraded", () => {
    const bad = structuredClone(source) as unknown as { color: { themes: { light: { text: string } } } };
    bad.color.themes.light.text = "#C0C0C0";
    expect(checkContrast(bad, pairs).some((r) => !r.pass && r.theme === "light")).toBe(true);
  });

  it("highContrast text is held to 7:1", () => {
    const hc = checkContrast(source, pairs).filter((r) => r.theme === "highContrast" && r.kind === "text");
    expect(hc.length).toBeGreaterThan(0);
    expect(hc.every((r) => r.min === 7 && r.ratio >= 7)).toBe(true);
  });
});

describe("theme switching", () => {
  const fakeRoot = () => {
    const attrs = new Map<string, string>();
    return {
      attrs,
      setAttribute: (k: string, v: string) => void attrs.set(k, v),
      removeAttribute: (k: string) => void attrs.delete(k),
    };
  };

  it("sets data-theme, and removes it for system so dark follows the OS", () => {
    const root = fakeRoot();
    applyTheme("highContrast", root);
    expect(root.attrs.get("data-theme")).toBe("highContrast");
    applyTheme("system", root);
    expect(root.attrs.has("data-theme")).toBe(false);
  });

  it("controller applies density and persists only a valid theme choice", () => {
    const root = fakeRoot();
    const store = new Map<string, string>([["hy-theme", "not-a-theme"]]);
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
    const c = createThemeController({ root, storage, initialDensity: "desktop" });
    expect(root.attrs.has("data-theme")).toBe(false);
    expect(root.attrs.get("data-density")).toBe("desktop");
    c.setTheme("kds");
    expect(root.attrs.get("data-theme")).toBe("kds");
    expect(store.get("hy-theme")).toBe("kds");
    c.setReduceMotion(true);
    expect(root.attrs.get("data-reduce-motion")).toBe("true");
  });
});
