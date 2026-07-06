// Format helpers
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", opts || { day: "numeric", month: "short", year: "numeric" });
}

export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = (d.getTime() - Date.now()) / 1000;
  const absDiff = Math.abs(diff);

  if (absDiff < 60) return "just now";
  if (absDiff < 3600) return `${Math.floor(absDiff / 60)}m ${diff > 0 ? "ago" : "from now"}`;
  if (absDiff < 86400) return `${Math.floor(absDiff / 3600)}h ${diff > 0 ? "ago" : "from now"}`;
  if (absDiff < 604800) return `${Math.floor(absDiff / 86400)}d ${diff > 0 ? "ago" : "from now"}`;
  return formatDate(d);
}

export function isToday(date: string | Date): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
}

export function isFuture(date: string | Date): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.getTime() > Date.now();
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const TIME_SLOTS = [
  "08:00 - 09:00",
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
  "16:00 - 17:00",
];
