import { createSignal } from "solid-js";
import { themeNames, type DensityName, type ThemeName } from "../tokens/tokens";

/** "system" removes `data-theme`, so dark follows the OS (`prefers-color-scheme`) and light is the default. */
export type ThemePreference = ThemeName | "system";

type Root = Pick<HTMLElement, "setAttribute" | "removeAttribute">;
type Store = Pick<Storage, "getItem" | "setItem">;

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === "string" && (themeNames as readonly string[]).includes(value);
}

export function applyTheme(pref: ThemePreference, root: Root = document.documentElement): void {
  if (pref === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", pref);
}

export function applyDensity(density: DensityName, root: Root = document.documentElement): void {
  root.setAttribute("data-density", density);
}

export function applyReduceMotion(on: boolean, root: Root = document.documentElement): void {
  if (on) root.setAttribute("data-reduce-motion", "true");
  else root.removeAttribute("data-reduce-motion");
}

/** `lang` drives the Tamil/Malayalam line-height rules in tokens.css. */
export function applyLang(locale: string, root: Root = document.documentElement): void {
  root.setAttribute("lang", locale);
}

export type ThemeController = {
  theme: () => ThemePreference;
  setTheme: (pref: ThemePreference) => void;
  density: () => DensityName;
  setDensity: (d: DensityName) => void;
  reduceMotion: () => boolean;
  setReduceMotion: (on: boolean) => void;
};

export type ThemeControllerOptions = {
  root?: Root;
  /** Optional persistence of the theme choice only (never user data). Pass `localStorage` where appropriate. */
  storage?: Store;
  storageKey?: string;
  initialDensity?: DensityName;
};

/** Signals plus DOM application. The DOM is updated immediately; signal reads update after `flush()`. */
export function createThemeController(options: ThemeControllerOptions = {}): ThemeController {
  const key = options.storageKey ?? "hy-theme";
  const saved = options.storage?.getItem(key);
  const initial: ThemePreference = saved === "system" || isThemeName(saved) ? saved : "system";
  const [theme, setThemeSignal] = createSignal<ThemePreference>(initial);
  const [density, setDensitySignal] = createSignal<DensityName>(options.initialDensity ?? "touch");
  const [reduceMotion, setReduceSignal] = createSignal(false);
  applyTheme(initial, options.root);
  applyDensity(density(), options.root);
  return {
    theme,
    setTheme: (pref) => {
      setThemeSignal(pref);
      applyTheme(pref, options.root);
      options.storage?.setItem(key, pref);
    },
    density,
    setDensity: (d) => {
      setDensitySignal(d);
      applyDensity(d, options.root);
    },
    reduceMotion,
    setReduceMotion: (on) => {
      setReduceSignal(on);
      applyReduceMotion(on, options.root);
    },
  };
}
