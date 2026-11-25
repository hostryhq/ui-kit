import { For, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useI18n } from "../i18n";
import { formatMoney } from "../format";
import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";
import { SegmentedControl, type SegmentOption } from "./controls";
import { Banner } from "./Banner";

export type TableState = "free" | "occupied" | "billed" | "ready" | "attention";

/** Icon per state (tokens.json color.table.state). State is icon + text + colour, never colour alone. */
const TABLE_ICONS: Record<TableState, IconName> = {
  free: "circle",
  occupied: "users",
  billed: "receipt",
  ready: "check-circle",
  attention: "alert-triangle",
};

/** One table on the floor plan. The state is derived by the app; this only displays it. */
export function TableTile(props: {
  /** Table name as printed on the floor ("T4"). */
  name: string;
  state: TableState;
  /** Optional second line, already translated or formatted ("3 guests", "12 min"). */
  meta?: string;
  /** Optional running total in paise. */
  totalPaise?: number;
  selected?: boolean;
  onSelect?: () => void;
  "data-testid"?: string;
}): JSX.Element {
  const { t } = useI18n();
  return (
    <button
      type="button"
      class={`hy-table-tile hy-table-tile--${props.state}`}
      aria-pressed={props.selected ? "true" : "false"}
      data-state={props.state}
      data-testid={props["data-testid"] ?? `floor-table-${props.name}`}
      onClick={() => props.onSelect?.()}
    >
      <span class="hy-table-tile__name">{props.name}</span>
      <span class="hy-table-tile__state">
        <Icon name={TABLE_ICONS[props.state]} />
        {t(`ui.table.state.${props.state}`)}
      </span>
      <Show when={props.meta}>
        <span class="hy-table-tile__meta hy-num">{props.meta}</span>
      </Show>
      <Show when={props.totalPaise !== undefined}>
        <span class="hy-table-tile__meta hy-num">{formatMoney(props.totalPaise ?? 0)}</span>
      </Show>
    </button>
  );
}

/** Grid of `TableTile`s. Arrow keys move focus between tiles (Left/Right by one, Up/Down by a row). */
export function FloorGrid(props: {
  label: string;
  /** Tiles per row on the current screen; the layout and the Up/Down jump both use it. */
  columns?: number;
  children?: JSX.Element;
  "data-testid"?: string;
}): JSX.Element {
  let el!: HTMLDivElement;
  const cols = () => props.columns ?? 4;
  const onKeyDown = (e: KeyboardEvent) => {
    const tiles = Array.from(el.querySelectorAll<HTMLElement>(".hy-table-tile"));
    const i = tiles.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    const step =
      e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : e.key === "ArrowDown" ? cols() : e.key === "ArrowUp" ? -cols() : 0;
    if (!step) return;
    e.preventDefault();
    tiles[Math.max(0, Math.min(tiles.length - 1, i + step))]?.focus();
  };
  return (
    <div
      ref={el}
      role="group"
      aria-label={props.label}
      class="hy-floor-grid"
      style={{ "grid-template-columns": `repeat(${cols()}, minmax(0, 1fr))` }}
      data-testid={props["data-testid"] ?? "floor-grid"}
      onKeyDown={onKeyDown}
    >
      {props.children}
    </div>
  );
}

export type BillTab = { id: string; label: string; totalPaise: number };

/** Bills of one seating with their totals. */
export function BillTabs(props: {
  label: string;
  bills: BillTab[];
  selected: string | undefined;
  onSelect: (id: string) => void;
  "data-testid"?: string;
}): JSX.Element {
  const options = (): SegmentOption[] =>
    props.bills.map((b) => ({ id: b.id, label: `${b.label} ${formatMoney(b.totalPaise)}`, "data-testid": `bill-tab-${b.id}` }));
  return (
    <SegmentedControl
      label={props.label}
      options={options()}
      selected={props.selected}
      onSelect={props.onSelect}
      wrap
      data-testid={props["data-testid"] ?? "bill-tabs"}
    />
  );
}

export type SyncStatusState = "synced" | "pending" | "offline" | "conflict";

const SYNC_ICONS: Record<SyncStatusState, IconName> = {
  synced: "check-circle",
  pending: "arrow-circle",
  offline: "cloud-off",
  conflict: "alert-triangle",
};

/**
 * Sync chip shown on every screen that matters: icon + text + colour (sync tokens), plus the
 * count of operations still waiting to leave this device. Always a polite live region.
 */
export function SyncStatus(props: {
  state: SyncStatusState;
  /** Operations not yet confirmed by the hub/cloud. */
  pendingCount?: number;
  "data-testid"?: string;
}): JSX.Element {
  const { t } = useI18n();
  return (
    <span
      class={`hy-sync hy-sync--${props.state}`}
      role="status"
      aria-live="polite"
      data-state={props.state}
      data-testid={props["data-testid"] ?? "sync-status"}
    >
      <Icon name={SYNC_ICONS[props.state]} />
      {t(`sync.state.${props.state}`)}
      <Show when={(props.pendingCount ?? 0) > 0}>
        <span class="hy-sync__count hy-num" data-testid="sync-pending-count">
          {t("ui.sync.pending_count", { count: props.pendingCount ?? 0 })}
        </span>
      </Show>
    </span>
  );
}

export type ModeItem = { id: string; label: string; icon?: IconName };

/** Mode switcher (Tables, Counter, Kitchen, Owner). The caller passes only modes the user may enter. */
export function ModeBar(props: {
  label: string;
  modes: ModeItem[];
  selected: string;
  onSelect: (id: string) => void;
  "data-testid"?: string;
}): JSX.Element {
  return (
    <nav class="hy-modebar" aria-label={props.label} data-testid={props["data-testid"] ?? "modebar"}>
      <For each={props.modes}>
        {(m) => (
          <button
            type="button"
            class="hy-modebar__item"
            aria-current={props.selected === m.id ? "page" : undefined}
            data-testid={`mode-${m.id}`}
            onClick={() => props.onSelect(m.id)}
          >
            <Show when={m.icon}>{(icon) => <Icon name={icon()} />}</Show>
            {m.label}
          </button>
        )}
      </For>
    </nav>
  );
}

/** Failed-print banner with a count and Retry. Print failure never loses the order; the job stays queued. */
export function PrinterStatus(props: {
  failedCount: number;
  onRetry: () => void;
  "data-testid"?: string;
}): JSX.Element {
  const { t } = useI18n();
  return (
    <div aria-live="polite" data-testid={props["data-testid"] ?? "printer-status"}>
      <Show when={props.failedCount > 0}>
        <Banner
          kind="danger"
          actions={
            <Button data-testid="printer-retry" onClick={() => props.onRetry()}>
              {t("ui.printer.retry")}
            </Button>
          }
        >
          {t("ui.printer.failed", { count: props.failedCount })}
        </Banner>
      </Show>
    </div>
  );
}

export type PrintJobStatus = "queued" | "printing" | "failed" | "done";

export function PrintJobRow(props: {
  /** Already-translated job title ("Kitchen ticket T4"). */
  title: string;
  status: PrintJobStatus;
  onRetry?: () => void;
  "data-testid"?: string;
}): JSX.Element {
  const { t } = useI18n();
  return (
    <div class="hy-row" data-status={props.status} data-testid={props["data-testid"] ?? "print-job"}>
      <Icon name="printer" />
      <span class="hy-row__main">{props.title}</span>
      <span class={`hy-row__status hy-row__status--${props.status}`}>{t(`ui.print.status.${props.status}`)}</span>
      <Show when={props.status === "failed" && props.onRetry}>
        <Button data-testid="print-job-retry" onClick={() => props.onRetry?.()}>
          {t("ui.printer.retry")}
        </Button>
      </Show>
    </div>
  );
}

/** Counter or Takeaway. */
export function OrderTypeToggle(props: {
  label: string;
  options: SegmentOption[];
  selected: string;
  onSelect: (id: string) => void;
}): JSX.Element {
  return (
    <SegmentedControl
      label={props.label}
      options={props.options}
      selected={props.selected}
      onSelect={props.onSelect}
      data-testid="order-type"
    />
  );
}

/** Opens the list of held orders; shows the count. */
export function HeldOrdersButton(props: { count: number; onClick: () => void }): JSX.Element {
  const { t } = useI18n();
  return (
    <Button data-testid="held-orders" onClick={() => props.onClick()}>
      {t("ui.held.label")}
      <span class="hy-badge hy-badge--neutral hy-num" data-testid="held-orders-count">
        {props.count}
      </span>
    </Button>
  );
}
