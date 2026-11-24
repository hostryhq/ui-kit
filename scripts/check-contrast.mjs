// CI contrast check: `pnpm contrast`.
// Prints every measured ratio and exits 1 if any pair is below its WCAG 2.2 AA threshold.
import { readFileSync } from "node:fs";
import { checkContrast } from "./contrast-lib.mjs";

const root = new URL("../", import.meta.url);
const tokens = JSON.parse(readFileSync(new URL("tokens/tokens.json", root), "utf8"));
const { pairs } = JSON.parse(readFileSync(new URL("tokens/contrast-pairs.json", root), "utf8"));

const results = checkContrast(tokens, pairs);
const failures = results.filter((r) => !r.pass);

const out = (line) => process.stdout.write(`${line}\n`);
for (const r of results) {
  const flag = r.pass ? "ok  " : "FAIL";
  out(
    `${flag} ${r.theme.padEnd(13)} ${r.kind.padEnd(4)} ${r.fg} ${r.fgHex} on ${r.bg} ${r.bgHex}: ${r.ratio.toFixed(2)}:1 (min ${r.min})`,
  );
}
out(`\n${results.length} pairs checked, ${failures.length} below threshold`);
process.exit(failures.length ? 1 : 0);
