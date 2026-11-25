import { createSignal, createUniqueId, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useI18n } from "../i18n";
import {
  formatBasisPoints,
  formatIst,
  formatMoney,
  istInputToUtc,
  parseRupeesToPaise,
  utcToIstInput,
} from "../format";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { Input } from "./Input";

type Common = {
  /** Already-translated label. */
  label: string;
  /** Already-translated error from the caller (server or form rule); shown instead of the built-in one. */
  error?: string;
  disabled?: boolean;
  readOnly?: boolean;
  "data-testid"?: string;
};

/**
 * Rupee amount field. The value in and out is integer paise (or undefined when empty or invalid);
 * text is parsed with string maths, never floats. Shows Indian grouping when not focused.
 */
export function MoneyField(
  props: Common & { valuePaise: number | undefined; onChange: (paise: number | undefined) => void },
): JSX.Element {
  const { t } = useI18n();
  const [text, setText] = createSignal<string | undefined>(undefined);
  const shown = () =>
    text() ?? (props.valuePaise === undefined ? "" : formatMoney(props.valuePaise).replace("₹", ""));
  const invalid = () => text() !== undefined && text() !== "" && parseRupeesToPaise(text() ?? "") === undefined;
  return (
    <Input
      label={props.label}
      inputmode="decimal"
      autocomplete="off"
      value={shown()}
      disabled={props.disabled}
      readonly={props.readOnly}
      placeholder="0.00"
      error={props.error ?? (invalid() ? t("ui.money.invalid") : undefined)}
      data-testid={props["data-testid"]}
      onFocus={() => setText(shown())}
      onInput={(e) => {
        setText(e.currentTarget.value);
        props.onChange(parseRupeesToPaise(e.currentTarget.value));
      }}
      onBlur={() => setText(undefined)}
    />
  );
}

/**
 * Tax rate field. Integer basis points in and out (250 = 2.5%); digits only, at most 10000 (100%).
 * The percent is shown live next to the input so the person sees what the integer means.
 */
export function BasisPointField(
  props: Common & { valueBp: number | undefined; onChange: (bp: number | undefined) => void },
): JSX.Element {
  const { t } = useI18n();
  const id = () => props["data-testid"];
  return (
    <div class="hy-bp">
      <Input
        label={props.label}
        inputmode="numeric"
        autocomplete="off"
        value={props.valueBp === undefined ? "" : String(props.valueBp)}
        disabled={props.disabled}
        readonly={props.readOnly}
        error={props.error}
        data-testid={id()}
        onInput={(e) => {
          const raw = e.currentTarget.value.trim();
          const ok = /^\d{1,5}$/.test(raw) && Number(raw) <= 10000;
          props.onChange(ok ? Number(raw) : undefined);
        }}
      />
      <span class="hy-bp__live hy-num" aria-live="polite" data-testid={id() ? `${id()}-percent` : undefined}>
        {props.valueBp === undefined ? "" : t("ui.bp.live", { percent: formatBasisPoints(props.valueBp) })}
      </span>
    </div>
  );
}

/** Date (IST business date) as `YYYY-MM-DD`. The browser date picker is used; the value is passed through unchanged. */
export function DateField(
  props: Common & { value: string; onChange: (isoDate: string) => void; min?: string; max?: string },
): JSX.Element {
  return (
    <Input
      label={props.label}
      type="date"
      value={props.value}
      min={props.min}
      max={props.max}
      disabled={props.disabled}
      readonly={props.readOnly}
      error={props.error}
      data-testid={props["data-testid"]}
      onInput={(e) => props.onChange(e.currentTarget.value)}
    />
  );
}

/**
 * Date and time typed in IST. `valueUtc` is an RFC 3339 UTC instant (or empty); `onChange` gives
 * UTC. Seeing "IST" next to the label avoids guessing the zone.
 */
export function DateTimeField(
  props: Common & { valueUtc: string; onChange: (utc: string | undefined) => void },
): JSX.Element {
  const { t } = useI18n();
  return (
    <Input
      label={`${props.label} (${t("ui.datetime.ist")})`}
      type="datetime-local"
      value={props.valueUtc ? utcToIstInput(props.valueUtc) : ""}
      disabled={props.disabled}
      readonly={props.readOnly}
      error={props.error}
      data-testid={props["data-testid"]}
      onInput={(e) => props.onChange(istInputToUtc(e.currentTarget.value))}
    />
  );
}

/**
 * Invoice reference: editable once, then read-only with a lock and "Set by {user} on {date}".
 * Once `value` is set the input is gone; the caller persists through `onSet` (one confirmed save).
 */
export function InvoiceRefField(props: {
  label: string;
  value: string | undefined;
  /** Who set it, shown as given. */
  setBy?: string;
  /** RFC 3339 UTC; shown in IST. */
  setAtUtc?: string;
  error?: string;
  onSet: (value: string) => void;
  "data-testid"?: string;
}): JSX.Element {
  const { t } = useI18n();
  const id = () => props["data-testid"] ?? "invoice-ref";
  const [draft, setDraft] = createSignal("");
  const labelId = createUniqueId();
  return (
    <Show
      when={props.value}
      fallback={
        <div class="hy-invoice-ref">
          <Input
            label={props.label}
            value={draft()}
            error={props.error}
            autocomplete="off"
            data-testid={id()}
            onInput={(e) => setDraft(e.currentTarget.value)}
          />
          <p class="hy-invoice-ref__once">{t("ui.invoice_ref.once")}</p>
          <Button
            variant="primary"
            disabled={draft().trim() === ""}
            data-testid={`${id()}-set`}
            onClick={() => props.onSet(draft().trim())}
          >
            {t("ui.invoice_ref.set")}
          </Button>
        </div>
      }
    >
      <div class="hy-invoice-ref hy-invoice-ref--locked" data-testid={`${id()}-locked`}>
        <span id={labelId} class="hy-invoice-ref__label">
          <Icon name="lock" />
          {props.label}
        </span>
        <output aria-labelledby={labelId} class="hy-num" data-testid={`${id()}-value`}>
          {props.value}
        </output>
        <Show when={props.setBy && props.setAtUtc}>
          <span class="hy-invoice-ref__meta">
            {t("ui.invoice_ref.set_by", { user: props.setBy ?? "", date: formatIst(props.setAtUtc ?? "", false) })}
          </span>
        </Show>
      </div>
    </Show>
  );
}
