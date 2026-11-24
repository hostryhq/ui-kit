import { createUniqueId, For, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useI18n } from "../i18n";
import { Button } from "./Button";
import { Icon } from "./Icon";

export type SegmentOption = {
  id: string;
  /** Already-translated label. */
  label: string;
  disabled?: boolean;
  "data-testid"?: string;
};

/**
 * One-of-many picker (order type, tender, station, reason chips). A radiogroup with a roving tabindex:
 * arrows move and select, Home/End jump. Disabled options are skipped.
 */
export function SegmentedControl(props: {
  label: string;
  options: SegmentOption[];
  selected: string | undefined;
  onSelect: (id: string) => void;
  /** Wrap chips onto several lines instead of one row. */
  wrap?: boolean;
  "data-testid"?: string;
}): JSX.Element {
  let group!: HTMLDivElement;
  const enabled = () => props.options.filter((o) => !o.disabled);

  const move = (to: number) => {
    const list = enabled();
    const next = list[(to + list.length) % list.length];
    if (!next) return;
    props.onSelect(next.id);
    group.querySelector<HTMLElement>(`[data-option-id="${CSS.escape(next.id)}"]`)?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const list = enabled();
    const i = list.findIndex((o) => o.id === props.selected);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") move(i + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") move(i - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(list.length - 1);
    else return;
    e.preventDefault();
  };

  // The selected option is the tab stop; with no selection the first enabled option is.
  const tabStop = () => (props.selected && enabled().some((o) => o.id === props.selected) ? props.selected : enabled()[0]?.id);

  return (
    <div
      ref={group}
      role="radiogroup"
      aria-label={props.label}
      class={`hy-segmented${props.wrap ? " hy-segmented--wrap" : ""}`}
      data-testid={props["data-testid"]}
      onKeyDown={onKeyDown}
    >
      <For each={props.options}>
        {(o) => (
          <button
            type="button"
            role="radio"
            class="hy-segmented__option"
            aria-checked={props.selected === o.id ? "true" : "false"}
            tabindex={tabStop() === o.id ? 0 : -1}
            disabled={o.disabled}
            data-option-id={o.id}
            data-testid={o["data-testid"] ?? `${props["data-testid"] ?? "segment"}-${o.id}`}
            onClick={() => props.onSelect(o.id)}
          >
            {o.label}
          </button>
        )}
      </For>
    </div>
  );
}

/** Integer quantity stepper. Touch size buttons; typing is not needed. Calls `onChange` only inside min..max. */
export function Stepper(props: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Already-translated name of what is counted, for screen readers ("Masala dosa"). */
  label: string;
  "data-testid"?: string;
}): JSX.Element {
  const { t } = useI18n();
  const min = () => props.min ?? 0;
  const id = () => props["data-testid"] ?? "stepper";
  return (
    <div class="hy-stepper" role="group" aria-label={props.label}>
      <Button
        aria-label={t("ui.stepper.decrease", { name: props.label })}
        data-testid={`${id()}-minus`}
        disabled={props.value <= min()}
        onClick={() => props.onChange(props.value - 1)}
      >
        <Icon name="minus" />
      </Button>
      <output class="hy-stepper__value hy-num" data-testid={`${id()}-value`} aria-live="polite">
        {props.value}
      </output>
      <Button
        aria-label={t("ui.stepper.increase", { name: props.label })}
        data-testid={`${id()}-plus`}
        disabled={props.max !== undefined && props.value >= props.max}
        onClick={() => props.onChange(props.value + 1)}
      >
        <Icon name="plus" />
      </Button>
    </div>
  );
}

/** Checkbox row with a 44 px target. */
export function CheckRow(props: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  hint?: string;
  "data-testid"?: string;
}): JSX.Element {
  const id = createUniqueId();
  return (
    <label class="hy-checkrow" for={id}>
      <input
        id={id}
        type="checkbox"
        checked={props.checked}
        disabled={props.disabled}
        data-testid={props["data-testid"]}
        onChange={(e) => props.onChange(e.currentTarget.checked)}
      />
      <span class="hy-checkrow__label">{props.label}</span>
      <Show when={props.hint}>
        <span class="hy-checkrow__hint hy-num">{props.hint}</span>
      </Show>
    </label>
  );
}
