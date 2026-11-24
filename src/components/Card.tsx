import { Show } from "solid-js";
import type { JSX } from "@solidjs/web";

export function Card(props: {
  /** Already-translated heading. */
  title?: string;
  children?: JSX.Element;
  "data-testid"?: string;
}): JSX.Element {
  return (
    <section class="hy-card" data-testid={props["data-testid"]}>
      <Show when={props.title}>
        <h2 class="hy-card__title">{props.title}</h2>
      </Show>
      {props.children}
    </section>
  );
}

/** Page heading row: the `h1` (focus target after route changes) and page-level actions. */
export function PageHeader(props: {
  title: string;
  actions?: JSX.Element;
  "data-testid"?: string;
}): JSX.Element {
  return (
    <div class="hy-page-header">
      <h1 tabindex="-1" data-testid={props["data-testid"] ?? "page-title"}>
        {props.title}
      </h1>
      <Show when={props.actions}>
        <div class="hy-page-header__actions">{props.actions}</div>
      </Show>
    </div>
  );
}
