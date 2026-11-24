import { Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useI18n } from "../i18n";
import { Icon, type IconName } from "./Icon";

export type AlertKind = "info" | "success" | "warning" | "danger";

const ICONS: Record<AlertKind, IconName> = {
  info: "info",
  success: "check-circle",
  warning: "alert-triangle",
  danger: "x-circle",
};

export type BannerProps = {
  kind?: AlertKind;
  /** Boxed block inside page content instead of a full-width strip. */
  inline?: boolean;
  /** Optional action buttons shown at the end. */
  actions?: JSX.Element;
  children?: JSX.Element;
  "data-testid"?: string;
};

/**
 * Icon + text + colour, never colour alone. Errors use role="alert" (assertive), the rest
 * role="status" (polite), so screen readers announce them without moving focus.
 */
export function Banner(props: BannerProps): JSX.Element {
  const kind = () => props.kind ?? "info";
  return (
    <div
      class={`hy-banner hy-banner--${kind()}${props.inline ? " hy-banner--inline" : ""}`}
      role={kind() === "danger" ? "alert" : "status"}
      data-testid={props["data-testid"]}
    >
      <Icon name={ICONS[kind()]} />
      <div class="hy-banner__body">{props.children}</div>
      <Show when={props.actions}>
        <div class="hy-banner__actions">{props.actions}</div>
      </Show>
    </div>
  );
}

/** A boxed `Banner` for use next to the content it describes (screen states, form summaries). */
export function InlineAlert(props: Omit<BannerProps, "inline">): JSX.Element {
  return (
    <Banner
      inline
      kind={props.kind}
      actions={props.actions}
      data-testid={props["data-testid"]}
    >
      {props.children}
    </Banner>
  );
}

export type OfflineReason = "offline" | "unreachable";

/**
 * Persistent connectivity banner. The live region is always mounted so a change is announced;
 * `reason` unset means online and nothing is shown. "unreachable" = browser online but the server is not.
 */
export function OfflineBanner(props: {
  reason?: OfflineReason | undefined;
  "data-testid"?: string;
}): JSX.Element {
  const { t } = useI18n();
  return (
    <div role="status" aria-live="polite" data-testid={props["data-testid"] ?? "offline-banner"}>
      <Show when={props.reason}>
        {(reason) => (
          <div class="hy-banner hy-banner--warning">
            <Icon name="cloud-off" />
            <div class="hy-banner__body">{t(`ui.offline.${reason()}`)}</div>
          </div>
        )}
      </Show>
    </div>
  );
}
