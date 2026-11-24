import { omit } from "solid-js";
import type { JSX } from "@solidjs/web";

export type ButtonProps = Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "class"> & {
  variant?: "primary" | "secondary" | "danger";
  class?: string;
};

/** Touch target is >= 44 px via the `--hy-touch-target` token. Pass `data-testid` for UI tests. */
export function Button(props: ButtonProps): JSX.Element {
  const rest = omit(props, "variant", "class", "children", "type");
  return (
    <button
      {...rest}
      type={props.type ?? "button"}
      class={`hy-btn hy-btn--${props.variant ?? "secondary"}${props.class ? ` ${props.class}` : ""}`}
    >
      {props.children}
    </button>
  );
}
