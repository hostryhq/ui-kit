export type Pair = { fg: string; bg: string; kind: "text" | "ui" };
export type ContrastResult = {
  theme: string;
  fg: string;
  bg: string;
  kind: "text" | "ui";
  fgHex: string;
  bgHex: string;
  ratio: number;
  min: number;
  pass: boolean;
};
export function luminance(hex: string): number;
export function contrastRatio(a: string, b: string): number;
export function brandKey(theme: string): string;
export function requiredRatio(kind: "text" | "ui", theme: string): number;
export function resolveRef(tokens: unknown, theme: string, ref: string): string;
export function checkContrast(tokens: unknown, pairs: Pair[]): ContrastResult[];
