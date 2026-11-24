import { describe, expect, it } from "vitest";
import { formatIst, formatMoney } from "./format";

describe("formatMoney (integer paise)", () => {
  it.each([
    [0, "₹0.00"],
    [5, "₹0.05"],
    [123456, "₹1,234.56"],
    [12345678, "₹1,23,456.78"],
    [-250, "-₹2.50"],
  ])("%i -> %s", (paise, out) => expect(formatMoney(paise)).toBe(out));

  it("rejects floats", () => {
    expect(() => formatMoney(10.5)).toThrow(RangeError);
  });
});

describe("formatIst", () => {
  it("shows UTC instants in IST (+05:30)", () => {
    expect(formatIst("2026-11-24T18:45:00Z")).toContain("00:15");
    expect(formatIst("2026-11-24T18:45:00Z")).toContain("25");
  });
});
