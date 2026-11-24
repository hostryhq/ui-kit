import { describe, expect, it } from "vitest";
import { createTranslator, interpolate } from "./index";

describe("i18n", () => {
  it("interpolates params and leaves unknown placeholders", () => {
    expect(interpolate("Hi {name}, {n} left {x}", { name: "A", n: 3 })).toBe("Hi A, 3 left {x}");
  });

  it("falls back to English, then to the key", () => {
    const tr = createTranslator({ en: { a: "A-en", b: "B-en" }, ta: { a: "A-ta" } }, "ta");
    expect(tr.t("a")).toBe("A-ta");
    expect(tr.t("b")).toBe("B-en");
    expect(tr.t("missing.key")).toBe("missing.key");
  });
});
