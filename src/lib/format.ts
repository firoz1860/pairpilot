/** Small, dependency-free formatting helpers for the UI. */

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function pct(unit: number): string {
  return `${Math.round(unit * 100)}%`;
}

export function titleCase(s: string): string {
  return s.replace(/(^|\s|_)\w/g, (m) => m.toUpperCase()).replace(/_/g, " ");
}
