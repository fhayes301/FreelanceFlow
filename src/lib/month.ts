export function toMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function parseMonthKey(key: string): { year: number; month: number } {
  const [y, m] = key.split("-").map(Number);
  return { year: y, month: m };
}

export function monthStart(key: string): Date {
  const { year, month } = parseMonthKey(key);
  return new Date(year, month - 1, 1);
}

export function monthEnd(key: string): Date {
  const { year, month } = parseMonthKey(key);
  return new Date(year, month, 0, 23, 59, 59, 999);
}

export function prevMonthKey(key: string): string {
  const { year, month } = parseMonthKey(key);
  const d = new Date(year, month - 2, 1);
  return toMonthKey(d);
}

export function nextMonthKey(key: string): string {
  const { year, month } = parseMonthKey(key);
  const d = new Date(year, month, 1);
  return toMonthKey(d);
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
}

export function formatMonthKeyMMYYYY(key: string): string {
  const { year, month } = parseMonthKey(key);
  return `${String(month).padStart(2, "0")}/${year}`;
}

export function clampDay(year: number, month: number, day: number): number {
  const last = new Date(year, month, 0).getDate();
  return Math.min(day, last);
}

export function diffDays(a: Date, b: Date): number {
  const ms = a.setHours(0, 0, 0, 0) - b.setHours(0, 0, 0, 0);
  return Math.round(ms / (1000 * 60 * 60 * 24));
}
