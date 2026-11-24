import { Show } from "solid-js";
import type { JSX } from "@solidjs/web";

/** Reason plus, if permitted, the next action (children). Texts are already translated. */
export function EmptyState(props: {
  title: string;
  description?: string;
  children?: JSX.Element;
  "data-testid"?: string;
}): JSX.Element {
  return (
    <div class="hy-empty" data-testid={props["data-testid"]}>
      <p class="hy-empty__title">{props.title}</p>
      <Show when={props.description}>
        <p class="hy-empty__description">{props.description}</p>
      </Show>
      <Show when={props.children}>
        <div class="hy-empty__action">{props.children}</div>
      </Show>
    </div>
  );
}
