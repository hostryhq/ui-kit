import { createContext, createSignal, useContext } from "solid-js";
import { en } from "./en";

/** Locales: English now; Tamil and Malayalam are pending founder confirmation. */
export type Locale = "en" | "ta" | "ml";
export type Messages = Readonly<Record<string, string>>;
export type Params = Readonly<Record<string, string | number>>;

export type Translator = {
  /** Translate a key. Missing key falls back to English, then to the key itself. */
  t: (key: string, params?: Params) => string;
  locale: () => Locale;
  setLocale: (locale: Locale) => void;
};

/** Replace `{name}` placeholders. Unknown placeholders are left as written. */
export function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in params ? String(params[name]) : whole,
  );
}

/**
 * Create a translator over per-locale catalogues. Apps pass their own catalogues
 * (merged over the ui-kit one) so the same helper serves ui-kit and app strings.
 * The active locale is a signal, so `t()` calls in JSX re-render on switch.
 */
export function createTranslator(
  catalogues: Partial<Record<Locale, Messages>>,
  initial: Locale = "en",
): Translator {
  const [locale, setLocale] = createSignal<Locale>(initial);
  const t = (key: string, params?: Params): string => {
    const template = catalogues[locale()]?.[key] ?? catalogues.en?.[key] ?? key;
    return interpolate(template, params);
  };
  return { t, locale, setLocale };
}

/** Translator over the built-in ui-kit catalogue only (default when no provider is mounted). */
const defaultTranslator = createTranslator({ en });

const I18nContext = createContext<Translator>(defaultTranslator);

export const I18nProvider = I18nContext;

export function useI18n(): Translator {
  return useContext(I18nContext);
}

export { en };
