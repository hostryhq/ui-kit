import { createSignal, For, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useI18n } from "../i18n";
import { formatMoney } from "../format";
import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";
import { Input } from "./Input";
import { DateField, MoneyField } from "./fields";
import { SegmentedControl } from "./controls";

export type Denomination = { id: string; label: string; valuePaise: number };

/**
 * Shift cash count by denomination. The expected amount is deliberately not a prop: a blind count
 * never shows it to the cashier. Counts are whole numbers; the counted total is the sum shown back.
 */
export function BlindCountForm(props: {
  denominations: Denomination[];
  counts: Readonly<Record<string, number>>;
  onChange: (counts: Record<string, number>) => void;
  onSubmit: () => void;
  disabled?: boolean;
}): JSX.Element {
  const { t } = useI18n();
  const total = () => props.denominations.reduce((sum, d) => sum + (props.counts[d.id] ?? 0) * d.valuePaise, 0);
  return (
    <form
      class="hy-blind-count"
      data-testid="blind-count"
      onSubmit={(e) => {
        e.preventDefault();
        props.onSubmit();
      }}
    >
      <p class="hy-blind-count__note">{t("ui.blind_count.note")}</p>
      <For each={props.denominations}>
        {(d) => (
          <div class="hy-blind-count__row">
            <Input
              label={d.label}
              inputmode="numeric"
              autocomplete="off"
              value={props.counts[d.id] === undefined ? "" : String(props.counts[d.id])}
              disabled={props.disabled}
              data-testid={`blind-count-${d.id}`}
              onInput={(e) => {
                const raw = e.currentTarget.value.trim();
                const next = { ...props.counts };
                if (raw === "") delete next[d.id];
                else if (/^\d{1,6}$/.test(raw)) next[d.id] = Number(raw);
                else return;
                props.onChange(next);
              }}
            />
            <span class="hy-num hy-blind-count__line">{formatMoney((props.counts[d.id] ?? 0) * d.valuePaise)}</span>
          </div>
        )}
      </For>
      <div class="hy-blind-count__total">
        <span>{t("ui.blind_count.counted")}</span>
        <output class="hy-num" data-testid="blind-count-total">
          {formatMoney(total())}
        </output>
      </div>
      <Button type="submit" variant="primary" disabled={props.disabled} data-testid="blind-count-submit">
        {t("ui.blind_count.submit")}
      </Button>
    </form>
  );
}

export type ChecklistStatus = "done" | "blocking" | "warning" | "info";

const CHECK_ICONS: Record<ChecklistStatus, IconName> = {
  done: "check-circle",
  blocking: "x-circle",
  warning: "alert-triangle",
  info: "info",
};

export type ChecklistItem = {
  id: string;
  label: string;
  status: ChecklistStatus;
  /** Already-translated reason or next step. */
  detail?: string;
  /** Link-like action for a failing row. */
  onFix?: () => void;
  fixLabel?: string;
};

/** Checks (day close, setup, rule-set validation). Icon + status text + reason per row. */
export function ChecklistPanel(props: { label: string; items: ChecklistItem[] }): JSX.Element {
  const { t } = useI18n();
  return (
    <ul class="hy-checklist" aria-label={props.label} data-testid="checklist">
      <For each={props.items}>
        {(i) => (
          <li class={`hy-checklist__item hy-checklist__item--${i.status}`} data-status={i.status} data-testid={`check-${i.id}`}>
            <Icon name={CHECK_ICONS[i.status]} />
            <span class="hy-checklist__body">
              <span class="hy-checklist__label">{i.label}</span>
              <span class="hy-visually-hidden">{t(`ui.checklist.${i.status}`)}</span>
              <Show when={i.detail}>
                <span class="hy-checklist__detail">{i.detail}</span>
              </Show>
            </span>
            <Show when={i.onFix}>
              <Button data-testid={`check-${i.id}-fix`} onClick={() => i.onFix?.()}>
                {i.fixLabel ?? t("ui.checklist.fix")}
              </Button>
            </Show>
          </li>
        )}
      </For>
    </ul>
  );
}

/** Headline figure for owner home and lists. `value` is already formatted (use `formatMoney`). */
export function StatTile(props: { label: string; value: string; hint?: string; "data-testid"?: string }): JSX.Element {
  return (
    <div class="hy-stat" data-testid={props["data-testid"] ?? "stat-tile"}>
      <span class="hy-stat__label">{props.label}</span>
      <span class="hy-stat__value hy-num">{props.value}</span>
      <Show when={props.hint}>
        <span class="hy-stat__hint">{props.hint}</span>
      </Show>
    </div>
  );
}

/** Plain-language exception with its resolve actions in a slot. */
export function ExceptionRow(props: {
  id: string;
  message: string;
  kind?: "warning" | "danger";
  actions?: JSX.Element;
}): JSX.Element {
  const kind = () => props.kind ?? "warning";
  return (
    <li class={`hy-exception hy-exception--${kind()}`} data-testid={`exception-${props.id}`}>
      <Icon name={kind() === "danger" ? "x-circle" : "alert-triangle"} />
      <span class="hy-exception__message">{props.message}</span>
      <Show when={props.actions}>
        <span class="hy-exception__actions">{props.actions}</span>
      </Show>
    </li>
  );
}

/** Settings list container; rows are `LockedRow` or your own `li`s. */
export function SettingsList(props: { label: string; children?: JSX.Element }): JSX.Element {
  return (
    <ul class="hy-settings" aria-label={props.label} data-testid="settings-list">
      {props.children}
    </ul>
  );
}

/**
 * A setting the signed-in person cannot change (`strong_only` rows). Shows the value, a lock and the
 * reason as visible text; the reason is also the accessible description.
 */
export function LockedRow(props: {
  id: string;
  label: string;
  value: string;
  /** Already-translated reason ("Only the owner can change this"). */
  reason: string;
}): JSX.Element {
  const { t } = useI18n();
  const reasonId = `locked-reason-${props.id}`;
  return (
    <li class="hy-locked-row" aria-disabled="true" aria-describedby={reasonId} data-testid={`locked-${props.id}`}>
      <span class="hy-locked-row__label">
        <Icon name="lock" />
        {props.label}
        <span class="hy-visually-hidden">{t("ui.locked.label")}</span>
      </span>
      <span class="hy-locked-row__value">{props.value}</span>
      <span id={reasonId} class="hy-locked-row__reason" data-testid={`locked-${props.id}-reason`}>
        {props.reason}
      </span>
    </li>
  );
}

/** "Step 2 of 5" with a progress bar (setup assistant). */
export function ProgressStepper(props: { step: number; total: number; label: string }): JSX.Element {
  const { t } = useI18n();
  return (
    <div class="hy-progress" data-testid="progress-stepper">
      <span class="hy-num">{t("ui.progress.step", { step: props.step, total: props.total })}</span>
      <progress max={props.total} value={props.step} aria-label={props.label} />
    </div>
  );
}

/** A ticket that arrived after the blackout (late sync). Shows the age and one action. */
export function LateTicketRow(props: {
  id: string;
  /** Already-translated heading ("T4 / #112"). */
  title: string;
  summary?: string;
  ageText: string;
  actionLabel: string;
  onAction: () => void;
}): JSX.Element {
  const { t } = useI18n();
  return (
    <li class="hy-late-ticket" data-testid={`late-ticket-${props.id}`}>
      <span class="hy-badge hy-badge--warning">
        <Icon name="clock" />
        {t("ui.late.badge")}
      </span>
      <span class="hy-row__main">
        {props.title}
        <Show when={props.summary}>
          <span class="hy-row__sub">{props.summary}</span>
        </Show>
      </span>
      <span class="hy-num">{props.ageText}</span>
      <Button data-testid={`late-ticket-${props.id}-action`} onClick={() => props.onAction()}>
        {props.actionLabel}
      </Button>
    </li>
  );
}

export type ManualBill = {
  bookRef: string;
  billNo: string;
  /** IST business date, YYYY-MM-DD. */
  date: string;
  amountPaise: number;
  tender: string;
};

/**
 * Paper bill-book entry for a bill written by hand during a blackout. The form only collects and
 * checks that fields are filled; the app validates and records the bill.
 */
export function ManualBillForm(props: {
  tenders: { id: string; label: string }[];
  initialDate: string;
  onSubmit: (bill: ManualBill) => void;
}): JSX.Element {
  const { t } = useI18n();
  const [bookRef, setBookRef] = createSignal("");
  const [billNo, setBillNo] = createSignal("");
  const [date, setDate] = createSignal(props.initialDate);
  const [amount, setAmount] = createSignal<number | undefined>(undefined);
  const [tender, setTender] = createSignal<string | undefined>(props.tenders[0]?.id);
  const [submitted, setSubmitted] = createSignal(false);
  const req = (v: string) => (submitted() && v.trim() === "" ? t("ui.field.required") : undefined);
  const amountMissing = () => submitted() && (amount() === undefined || amount() === 0);

  return (
    <form
      class="hy-manual-bill"
      data-testid="manual-bill"
      novalidate
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
        const a = amount();
        const tn = tender();
        if (!bookRef().trim() || !billNo().trim() || !date() || !a || !tn) return;
        props.onSubmit({ bookRef: bookRef().trim(), billNo: billNo().trim(), date: date(), amountPaise: a, tender: tn });
      }}
    >
      <Input
        label={t("ui.manual_bill.book")}
        value={bookRef()}
        error={req(bookRef())}
        data-testid="manual-bill-book"
        onInput={(e) => setBookRef(e.currentTarget.value)}
      />
      <Input
        label={t("ui.manual_bill.number")}
        value={billNo()}
        error={req(billNo())}
        data-testid="manual-bill-number"
        onInput={(e) => setBillNo(e.currentTarget.value)}
      />
      <DateField label={t("ui.manual_bill.date")} value={date()} onChange={setDate} data-testid="manual-bill-date" />
      <MoneyField
        label={t("ui.manual_bill.amount")}
        valuePaise={amount()}
        onChange={setAmount}
        error={amountMissing() ? t("ui.field.required") : undefined}
        data-testid="manual-bill-amount"
      />
      <SegmentedControl
        label={t("ui.manual_bill.tender")}
        options={props.tenders.map((x) => ({ ...x, "data-testid": `manual-bill-tender-${x.id}` }))}
        selected={tender()}
        onSelect={setTender}
        data-testid="manual-bill-tenders"
      />
      <Button type="submit" variant="primary" data-testid="manual-bill-submit">
        {t("ui.manual_bill.submit")}
      </Button>
    </form>
  );
}
