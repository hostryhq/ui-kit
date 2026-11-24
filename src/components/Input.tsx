import { createUniqueId, omit, Show } from "solid-js";
import type { JSX } from "@solidjs/web";

export type InputProps = Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "class"> & {
  /** Already-translated label text (callers pass `t("...")`). */
  label: string;
  /** Already-translated error text; marks the input invalid when set. */
  error?: string;
};

export function Input(props: InputProps): JSX.Element {
  const id = createUniqueId();
  const rest = omit(props, "label", "error", "id");
  return (
    <div class="hy-field">
      <label for={props.id ?? id}>{props.label}</label>
      <input
        {...rest}
        id={props.id ?? id}
        class="hy-input"
        aria-invalid={props.error ? "true" : undefined}
        aria-describedby={props.error ? `${props.id ?? id}-error` : undefined}
      />
      <Show when={props.error}>
        <span id={`${props.id ?? id}-error`} class="hy-field__error" role="alert">
          {props.error}
        </span>
      </Show>
    </div>
  );
}
