import { describe, expect, it } from "vitest";
import { formatBasisPoints, istInputToUtc, parseRupeesToPaise, utcToIstInput } from "./format";

describe("parseRupeesToPaise (integer paise, no floats)", () => {
  it.each([
    ["250", 25000],
    ["1,234.5", 123450],
    ["₹99", 9900],
    ["0.07", 7],
    ["19.99", 1999],
    ["1.10", 110],
  ])("%s -> %i", (input, paise) => expect(parseRupeesToPaise(input)).toBe(paise));

  it.each(["", "abc", "12.345", "-5", "1e3", "१२३", "1.", ".5", "1234567890"])("rejects %j", (input) =>
    expect(parseRupeesToPaise(input)).toBeUndefined(),
  );
});

describe("formatBasisPoints", () => {
  it("renders percent without float error", () => {
    expect(formatBasisPoints(250)).toBe("2.5");
    expect(formatBasisPoints(900)).toBe("9");
    expect(formatBasisPoints(5)).toBe("0.05");
    expect(formatBasisPoints(10000)).toBe("100");
    expect(() => formatBasisPoints(-1)).toThrow(RangeError);
    expect(() => formatBasisPoints(1.5)).toThrow(RangeError);
  });
});

describe("IST datetime field conversion", () => {
  it("round-trips between UTC and IST text (UTC+5:30, no DST)", () => {
    expect(utcToIstInput("2026-11-24T18:30:00Z")).toBe("2026-11-25T00:00");
    expect(istInputToUtc("2026-11-25T00:00")).toBe("2026-11-24T18:30:00Z");
    expect(istInputToUtc(utcToIstInput("2026-03-01T05:15:00Z"))).toBe("2026-03-01T05:15:00Z");
  });
  it("rejects malformed and impossible dates", () => {
    expect(istInputToUtc("2026-02-30T10:00")).toBeUndefined();
    expect(istInputToUtc("24/11/2026 10:00")).toBeUndefined();
    expect(utcToIstInput("nope")).toBe("");
  });
});
