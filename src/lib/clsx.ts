// Tiny classnames helper — no dependency needed for this project's needs.
type ClassValue = string | number | false | null | undefined;

export function clsx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
