import type { JSX } from "@solidjs/web";

export type IconName =
  | "check-circle"
  | "arrow-circle"
  | "cloud-off"
  | "alert-triangle"
  | "x-circle"
  | "info"
  | "eye";

/** Inline stroke paths on a 24 px grid. Icons are decorative: the label text always carries the meaning. */
const PATHS: Record<IconName, string[]> = {
  "check-circle": ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M8 12l3 3 5-6"],
  "arrow-circle": ["M21 12a9 9 0 1 1-3-6.7", "M21 4v5h-5"],
  "cloud-off": ["M3 3l18 18", "M9.5 5.6A6 6 0 0 1 18 10a4 4 0 0 1 2 7.3", "M17 17H7a4 4 0 0 1-.9-7.9"],
  "alert-triangle": ["M12 3l10 18H2z", "M12 10v5", "M12 18h.01"],
  "x-circle": ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M9 9l6 6", "M15 9l-6 6"],
  info: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 11v5", "M12 8h.01"],
  eye: ["M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"],
};

export function Icon(props: { name: IconName; class?: string }): JSX.Element {
  return (
    <svg
      class={`hy-icon${props.class ? ` ${props.class}` : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {PATHS[props.name].map((d) => (
        <path d={d} />
      ))}
    </svg>
  );
}
