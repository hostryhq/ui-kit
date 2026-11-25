import { For, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useI18n } from "../i18n";
import { formatMoney } from "../format";
import { Icon } from "./Icon";
import { CheckRow, SegmentedControl, Stepper, type SegmentOption } from "./controls";

/** Category strip for order entry. */
export function CategoryTabs(props: {
  label: string;
  categories: { id: string; label: string }[];
  selected: string | undefined;
  onSelect: (id: string) => void;
}): JSX.Element {
  return (
    <SegmentedControl
      label={props.label}
      options={props.categories.map((c) => ({ id: c.id, label: c.label, "data-testid": `category-${c.id}` }))}
      selected={props.selected}
      onSelect={props.onSelect}
      data-testid="category-tabs"
    />
  );
}

export type VegMark = "veg" | "nonveg" | "egg";

/** Item button: one tap adds. Shows the veg mark (shape + text, not colour alone) and the item code. */
export function ItemTile(props: {
  name: string;
  pricePaise: number;
  code?: string;
  veg?: VegMark;
  unavailable?: boolean;
  onAdd: () => void;
  "data-testid"?: string;
}): JSX.Element {
  const { t } = useI18n();
  return (
    <button
      type="button"
      class="hy-item-tile"
      disabled={props.unavailable}
      data-testid={props["data-testid"] ?? `item-${props.code ?? props.name}`}
      onClick={() => props.onAdd()}
    >
      <span class="hy-item-tile__name">
        <Show when={props.veg}>
          {(v) => (
            <span class={`hy-veg hy-veg--${v()}`} role="img" aria-label={t(`ui.veg.${v()}`)}>
              <span class="hy-veg__dot" aria-hidden="true" />
            </span>
          )}
        </Show>
        {props.name}
      </span>
      <span class="hy-item-tile__meta hy-num">
        <Show when={props.code}>
          <span class="hy-item-tile__code">{props.code}</span>
        </Show>
        {formatMoney(props.pricePaise)}
      </span>
      <Show when={props.unavailable}>
        <span class="hy-item-tile__meta">{t("ui.item.unavailable")}</span>
      </Show>
    </button>
  );
}

/** Responsive grid of `ItemTile`s. */
export function QuickItemGrid(props: { label: string; children?: JSX.Element }): JSX.Element {
  return (
    <div class="hy-item-grid" role="group" aria-label={props.label} data-testid="quick-items">
      {props.children}
    </div>
  );
}

export type ModifierOption = { id: string; label: string; pricePaise?: number };

/**
 * Modifier group. One choice (`max` of 1) renders radios, otherwise checkboxes capped at `max`.
 * Shows "Required" and a plain message when fewer than `min` are chosen.
 */
export function ModifierGroup(props: {
  name: string;
  options: ModifierOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  min?: number;
  max?: number;
  "data-testid"?: string;
}): JSX.Element {
  const { t } = useI18n();
  const min = () => props.min ?? 0;
  const max = () => props.max ?? props.options.length;
  const single = () => max() === 1;
  const short = () => props.selected.length < min();
  const toggle = (id: string, on: boolean) => {
    if (single()) props.onChange(on ? [id] : []);
    else props.onChange(on ? [...props.selected, id] : props.selected.filter((x) => x !== id));
  };
  return (
    <fieldset class="hy-modifier" data-testid={props["data-testid"] ?? `modifier-${props.name}`}>
      <legend>
        {props.name}
        <Show when={min() > 0}>
          <span class="hy-badge hy-badge--neutral">{t("ui.modifier.required")}</span>
        </Show>
      </legend>
      <For each={props.options}>
        {(o) => {
          const checked = () => props.selected.includes(o.id);
          const full = () => !single() && !checked() && props.selected.length >= max();
          return (
            <label class="hy-checkrow">
              <input
                type={single() ? "radio" : "checkbox"}
                name={single() ? `mod-${props.name}` : undefined}
                checked={checked()}
                disabled={full()}
                data-testid={`modifier-option-${o.id}`}
                onChange={(e) => toggle(o.id, e.currentTarget.checked)}
              />
              <span class="hy-checkrow__label">{o.label}</span>
              <Show when={o.pricePaise}>
                <span class="hy-checkrow__hint hy-num">+{formatMoney(o.pricePaise ?? 0)}</span>
              </Show>
            </label>
          );
        }}
      </For>
      <Show when={short()}>
        <span class="hy-field__error" role="alert" data-testid="modifier-short">
          {t("ui.modifier.choose_min", { min: min() })}
        </span>
      </Show>
    </fieldset>
  );
}

export type SentLevel = "local" | "hub" | "cloud" | "hand";

const SENT_ICON = { local: "clock", hub: "arrow-circle", cloud: "check-circle", hand: "users" } as const;

/** Where an order line has reached: this device, the LAN hub, the cloud, or given by hand. Icon + text. */
export function SentIndicator(props: { level: SentLevel; "data-testid"?: string }): JSX.Element {
  const { t } = useI18n();
  return (
    <span class={`hy-sent hy-sent--${props.level}`} data-testid={props["data-testid"] ?? "sent-indicator"}>
      <Icon name={SENT_ICON[props.level]} />
      {t(`ui.sent.${props.level}`)}
    </span>
  );
}

export type OrderLineData = {
  id: string;
  name: string;
  qty: number;
  /** Line total in paise, computed by the app. */
  totalPaise: number;
  state: "draft" | "sent" | "cancelled";
  sent?: SentLevel;
  modifiers?: string[];
  note?: string;
};

/** One order line. Draft lines have a quantity stepper and a remove button; sent lines are read-only. */
export function OrderLine(props: {
  line: OrderLineData;
  onQtyChange?: (qty: number) => void;
  onRemove?: () => void;
}): JSX.Element {
  const { t } = useI18n();
  const l = () => props.line;
  return (
    <li class={`hy-order-line hy-order-line--${l().state}`} data-state={l().state} data-testid={`order-line-${l().id}`}>
      <div class="hy-order-line__main">
        <span class="hy-order-line__name">
          <Show when={l().state === "cancelled"}>
            <span class="hy-badge hy-badge--danger">{t("ui.order.cancelled")}</span>
          </Show>
          {l().name}
        </span>
        <Show when={l().modifiers?.length}>
          <span class="hy-order-line__mods">{l().modifiers?.join(", ")}</span>
        </Show>
        <Show when={l().note}>
          <span class="hy-order-line__mods">{l().note}</span>
        </Show>
        <Show when={l().state === "sent" && l().sent}>{(s) => <SentIndicator level={s()} />}</Show>
      </div>
      <Show
        when={l().state === "draft" && props.onQtyChange}
        fallback={
          <span class="hy-num" data-testid={`order-line-${l().id}-qty`}>
            ×{l().qty}
          </span>
        }
      >
        <Stepper
          label={l().name}
          value={l().qty}
          min={0}
          data-testid={`order-line-${l().id}-stepper`}
          onChange={(q) => (q === 0 ? props.onRemove?.() : props.onQtyChange?.(q))}
        />
      </Show>
      <span class="hy-num hy-order-line__total">{formatMoney(l().totalPaise)}</span>
    </li>
  );
}

/** Order lines with the total. Totals are computed by the app's domain code and displayed here. */
export function OrderPanel(props: {
  label: string;
  lines: OrderLineData[];
  totalPaise: number;
  /** Shown when there are no lines. */
  empty?: JSX.Element;
  onQtyChange?: (id: string, qty: number) => void;
  onRemove?: (id: string) => void;
  /** Slot for the primary actions (Send, Pay). */
  actions?: JSX.Element;
}): JSX.Element {
  const { t } = useI18n();
  return (
    <section class="hy-order-panel" aria-label={props.label} data-testid="order-panel">
      <Show when={props.lines.length > 0} fallback={props.empty}>
        <ul class="hy-order-lines">
          <For each={props.lines}>
            {(line) => (
              <OrderLine
                line={line}
                onQtyChange={props.onQtyChange ? (q) => props.onQtyChange?.(line.id, q) : undefined}
                onRemove={props.onRemove ? () => props.onRemove?.(line.id) : undefined}
              />
            )}
          </For>
        </ul>
      </Show>
      <div class="hy-order-panel__total">
        <span>{t("ui.order.total")}</span>
        <span class="hy-num hy-order-panel__amount" data-testid="order-total">
          {formatMoney(props.totalPaise)}
        </span>
      </div>
      <Show when={props.actions}>
        <div class="hy-order-panel__actions">{props.actions}</div>
      </Show>
    </section>
  );
}

/** Required reason picker for void, discount, refund. Reasons are outlet-defined. */
export function ReasonChips(props: {
  label: string;
  reasons: { id: string; label: string }[];
  selected: string | undefined;
  onSelect: (id: string) => void;
}): JSX.Element {
  const options = (): SegmentOption[] =>
    props.reasons.map((r) => ({ id: r.id, label: r.label, "data-testid": `reason-${r.id}` }));
  return (
    <SegmentedControl
      label={props.label}
      options={options()}
      selected={props.selected}
      onSelect={props.onSelect}
      wrap
      data-testid="reason-chips"
    />
  );
}

export type SelectableLine = { id: string; label: string; qty: number };

/** Pick lines and a partial quantity of each (split, move, credit). `selection` maps line id to chosen qty. */
export function LineSelectList(props: {
  label: string;
  lines: SelectableLine[];
  selection: Readonly<Record<string, number>>;
  onChange: (selection: Record<string, number>) => void;
}): JSX.Element {
  const set = (id: string, qty: number) => {
    const next = { ...props.selection };
    if (qty <= 0) delete next[id];
    else next[id] = qty;
    props.onChange(next);
  };
  return (
    <ul class="hy-line-select" aria-label={props.label} data-testid="line-select">
      <For each={props.lines}>
        {(line) => {
          const chosen = () => props.selection[line.id] ?? 0;
          return (
            <li class="hy-line-select__row">
              <CheckRow
                label={line.label}
                hint={`×${line.qty}`}
                checked={chosen() > 0}
                data-testid={`line-select-${line.id}`}
                onChange={(on) => set(line.id, on ? line.qty : 0)}
              />
              <Show when={chosen() > 0 && line.qty > 1}>
                <Stepper
                  label={line.label}
                  value={chosen()}
                  min={1}
                  max={line.qty}
                  data-testid={`line-select-${line.id}-qty`}
                  onChange={(q) => set(line.id, q)}
                />
              </Show>
            </li>
          );
        }}
      </For>
    </ul>
  );
}
