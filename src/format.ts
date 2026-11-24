/** Money is integer paise, never float. Formats as Indian-grouped rupees, e.g. 123456 -> "₹1,234.56". */
export function formatMoney(paise: number): string {
  if (!Number.isSafeInteger(paise)) throw new RangeError("paise must be a safe integer");
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise);
  const rupees = Math.trunc(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  return `${sign}₹${rupees.toLocaleString("en-IN")}.${frac}`;
}

/** Times are stored UTC (RFC 3339) and displayed IST (Asia/Kolkata). */
export function formatIst(utc: string | Date, withTime = true): string {
  const d = typeof utc === "string" ? new Date(utc) : utc;
  if (Number.isNaN(d.getTime())) throw new RangeError("invalid date");
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", hour12: false } : {}),
  }).format(d);
}

/**
 * Parse typed rupees ("1,234.5", "₹99") to integer paise without floats.
 * Western digits only, at most 2 decimals, at most 9 whole-rupee digits; anything else is undefined.
 */
export function parseRupeesToPaise(input: string): number | undefined {
  const s = input.replace(/[\s,₹]/g, "");
  const m = /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(s);
  if (!m) return undefined;
  const whole = m[1] ?? "0";
  const frac = (m[2] ?? "").padEnd(2, "0");
  return Number(whole) * 100 + Number(frac);
}

/** Basis points (1 bp = 0.01%) to a percent string without floats: 250 -> "2.5", 900 -> "9", 5 -> "0.05". */
export function formatBasisPoints(bp: number): string {
  if (!Number.isSafeInteger(bp) || bp < 0) throw new RangeError("basis points must be a non-negative safe integer");
  const whole = Math.trunc(bp / 100);
  const frac = String(bp % 100)
    .padStart(2, "0")
    .replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : String(whole);
}

const IST_OFFSET_MS = 330 * 60 * 1000;

/** UTC instant (RFC 3339) to the `YYYY-MM-DDTHH:mm` text of a datetime field, in IST. */
export function utcToIstInput(utc: string): string {
  const ms = new Date(utc).getTime();
  if (Number.isNaN(ms)) return "";
  return new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 16);
}

/** `YYYY-MM-DDTHH:mm` typed in IST to a UTC RFC 3339 string; undefined when malformed. IST has no DST. */
export function istInputToUtc(local: string): string | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) return undefined;
  const [y, mo, d, h, mi] = m.slice(1).map(Number) as [number, number, number, number, number];
  const ms = Date.UTC(y, mo - 1, d, h, mi) - IST_OFFSET_MS;
  const back = new Date(ms + IST_OFFSET_MS);
  if (back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return undefined;
  return new Date(ms).toISOString().replace(".000Z", "Z");
}
