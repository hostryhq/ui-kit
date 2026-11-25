import { Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useI18n } from "../i18n";
import { SegmentedControl } from "./controls";
import { Icon } from "./Icon";

export type KdsAge = "fresh" | "waiting" | "late";

export type KdsThresholds = {
  /** Up to and including this many minutes a ticket is fresh. Per-outlet setting; default 5. */
  freshMaxMinutes: number;
  /** Up to and including this many minutes it is waiting; beyond is late. Default 10. */
  waitingMaxMinutes: number;
};

export const defaultKdsThresholds: KdsThresholds = { freshMaxMinutes: 5, waitingMaxMinutes: 10 };

/** Age band of a ticket. Pure presentation helper (thresholds come from outlet settings). */
export function kdsAge(minutes: number, th: KdsThresholds = defaultKdsThresholds): KdsAge {
  if (minutes <= th.freshMaxMinutes) return "fresh";
  if (minutes <= th.waitingMaxMinutes) return "waiting";
  return "late";
}

/** Order age as large text (40 px on the kds theme) with an icon; colour follows the band but never carries it alone. */
export function KdsAgeBadge(props: {
  minutes: number;
  thresholds?: KdsThresholds;
  "data-testid"?: string;
}): JSX.Element {
  const { t } = useI18n();
  const age = () => kdsAge(props.minutes, props.thresholds);
  return (
    <span class={`hy-kds-age hy-kds-age--${age()}`} data-age={age()} data-testid={props["data-testid"] ?? "kds-age"}>
      <Icon name={age() === "late" ? "alert-triangle" : "clock"} />
      <span class="hy-num">{t("ui.kds.age", { minutes: props.minutes })}</span>
      <span class="hy-visually-hidden">{t(`ui.kds.band.${age()}`)}</span>
    </span>
  );
}

/** Bump button: 72 px high so it is hit with one tap with a wet or gloved hand. */
export function BumpButton(props: {
  /** Already-translated label ("Ready"). */
  label: string;
  onBump: () => void;
  disabled?: boolean;
  "data-testid"?: string;
}): JSX.Element {
  return (
    <button
      type="button"
      class="hy-bump"
      disabled={props.disabled}
      data-testid={props["data-testid"] ?? "kds-bump"}
      onClick={() => props.onBump()}
    >
      {props.label}
    </button>
  );
}

/** One kitchen item: quantity, name, modifiers, optional done toggle. */
export function KdsItemRow(props: {
  id: string;
  qty: number;
  name: string;
  modifiers?: string[];
  note?: string;
  done?: boolean;
  onToggleDone?: () => void;
}): JSX.Element {
  const { t } = useI18n();
  const body = () => (
    <>
      <span class="hy-kds-item__qty hy-num">{props.qty}×</span>
      <span class="hy-kds-item__text">
        <span class="hy-kds-item__name">{props.name}</span>
        <Show when={props.modifiers?.length}>
          <span class="hy-kds-item__mods">{props.modifiers?.join(", ")}</span>
        </Show>
        <Show when={props.note}>
          <span class="hy-kds-item__mods">{props.note}</span>
        </Show>
      </span>
      <Show when={props.done}>
        <span class="hy-kds-item__done">
          <Icon name="check" />
          {t("ui.kds.done")}
        </span>
      </Show>
    </>
  );
  return (
    <li class={`hy-kds-item${props.done ? " hy-kds-item--done" : ""}`} data-testid={`kds-item-${props.id}`}>
      <Show when={props.onToggleDone} fallback={body()}>
        <button
          type="button"
          class="hy-kds-item__button"
          aria-pressed={props.done ? "true" : "false"}
          onClick={() => props.onToggleDone?.()}
        >
          {body()}
        </button>
      </Show>
    </li>
  );
}

/**
 * Kitchen ticket. The border is the non-colour age cue: none (fresh), dashed (waiting), thick solid (late),
 * from the `kds.ticket.border.*` tokens, plus the age text. One tap on the bump button clears it.
 */
export function KdsTicket(props: {
  id: string;
  /** Already-translated heading ("T4 / Dine-in #112"). */
  title: string;
  minutes: number;
  thresholds?: KdsThresholds;
  /** Already-translated bump label. */
  bumpLabel: string;
  onBump: () => void;
  /** Kitchen items; use `KdsItemRow`. */
  children?: JSX.Element;
}): JSX.Element {
  const age = () => kdsAge(props.minutes, props.thresholds);
  return (
    <article class={`hy-kds-ticket hy-kds-ticket--${age()}`} data-age={age()} data-testid={`kds-ticket-${props.id}`}>
      <header class="hy-kds-ticket__header">
        <h3 class="hy-kds-ticket__title">{props.title}</h3>
        <KdsAgeBadge minutes={props.minutes} thresholds={props.thresholds} />
      </header>
      <ul class="hy-kds-ticket__items">{props.children}</ul>
      <BumpButton label={props.bumpLabel} onBump={props.onBump} data-testid={`kds-bump-${props.id}`} />
    </article>
  );
}

/** Station filter (All, Grill, Fry, Bar). */
export function StationSelect(props: {
  label: string;
  stations: { id: string; label: string }[];
  selected: string | undefined;
  onSelect: (id: string) => void;
}): JSX.Element {
  return (
    <SegmentedControl
      label={props.label}
      options={props.stations.map((s) => ({ id: s.id, label: s.label, "data-testid": `station-${s.id}` }))}
      selected={props.selected}
      onSelect={props.onSelect}
      data-testid="station-select"
    />
  );
}

/** Convenience wrapper laying tickets out in the KDS board grid. */
export function KdsBoard(props: { label: string; children?: JSX.Element; empty?: JSX.Element; count: number }): JSX.Element {
  return (
    <section class="hy-kds-board" aria-label={props.label} data-testid="kds-board">
      <Show when={props.count > 0} fallback={props.empty}>
        <div class="hy-kds-board__grid">{props.children}</div>
      </Show>
    </section>
  );
}
