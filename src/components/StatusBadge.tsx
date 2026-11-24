import { Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { Icon, type IconName } from "./Icon";

export type BadgeKind = "success" | "warning" | "danger" | "info" | "neutral";

const ICONS: Record<Exclude<BadgeKind, "neutral">, IconName> = {
  success: "check-circle",
  warning: "alert-triangle",
  danger: "x-circle",
  info: "info",
};

/** Status chip: icon + already-translated label + colour (state is never colour alone). */
export function StatusBadge(props: {
  kind: BadgeKind;
  label: string;
  "data-testid"?: string;
}): JSX.Element {
  return (
    <span class={`hy-badge hy-badge--${props.kind}`} data-testid={props["data-testid"]}>
      <Show when={props.kind !== "neutral"}>
        <Icon name={props.kind === "neutral" ? "info" : ICONS[props.kind]} />
      </Show>
      {props.label}
    </span>
  );
}
