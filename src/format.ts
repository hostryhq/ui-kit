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
