import { For, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useI18n } from "../i18n";
import { formatMoney } from "../format";
import { Button } from "./Button";
import { SegmentedControl } from "./controls";
import { StatusBadge } from "./StatusBadge";

export type BreakdownRow = {
  id: string;
  /** Already-translated label ("CGST 2.5%"). */
  label: string;
  amountPaise: number;
};

/**
 * Amount lines ending in a total (ex-GST amount, CGST + SGST or IGST, total). Every figure is
 * computed by a service or the app's domain code and shown as given; nothing is recalculated here.
 */
export function AmountBreakdown(props: {
  label: string;
  rows: BreakdownRow[];
  totalPaise: number;
  /** Already-translated total label; defaults to "Total". */
  totalLabel?: string;
  "data-testid"?: string;
}): JSX.Element {
  const { t } = useI18n();
  return (
    <dl class="hy-breakdown" aria-label={props.label} data-testid={props["data-testid"] ?? "amount-breakdown"}>
      <For each={props.rows}>
        {(r) => (
          <div class="hy-breakdown__row" data-testid={`breakdown-${r.id}`}>
            <dt>{r.label}</dt>
            <dd class="hy-num">{formatMoney(r.amountPaise)}</dd>
          </div>
        )}
      </For>
      <div class="hy-breakdown__row hy-breakdown__row--total" data-testid="breakdown-total">
        <dt>{props.totalLabel ?? t("ui.order.total")}</dt>
        <dd class="hy-num">{formatMoney(props.totalPaise)}</dd>
      </div>
    </dl>
  );
}

/** Settlement method picker (Cash, UPI, Card, ...). */
export function TenderTabs(props: {
  label: string;
  tenders: { id: string; label: string; disabled?: boolean }[];
  selected: string | undefined;
  onSelect: (id: string) => void;
}): JSX.Element {
  return (
    <SegmentedControl
      label={props.label}
      options={props.tenders.map((x) => ({ ...x, "data-testid": `tender-${x.id}` }))}
      selected={props.selected}
      onSelect={props.onSelect}
      data-testid="tender-tabs"
    />
  );
}

/** One-tap amounts (exact due, round-ups, notes). Amounts are integer paise supplied by the app. */
export function QuickAmountChips(props: { amountsPaise: number[]; onPick: (paise: number) => void }): JSX.Element {
  const { t } = useI18n();
  return (
    <div class="hy-chips" role="group" aria-label={t("ui.quick_amounts.label")} data-testid="quick-amounts">
      <For each={props.amountsPaise}>
        {(a) => (
          <button type="button" class="hy-chip hy-num" data-testid={`quick-amount-${a}`} onClick={() => props.onPick(a)}>
            {formatMoney(a)}
          </button>
        )}
      </For>
    </div>
  );
}

/** A tender already taken on a bill. */
export function PaymentRow(props: {
  id: string;
  /** Already-translated method label. */
  method: string;
  amountPaise: number;
  /** Reference (last 4 digits, UPI ref). Shown as text. */
  reference?: string;
  onRemove?: () => void;
}): JSX.Element {
  const { t } = useI18n();
  return (
    <div class="hy-row" data-testid={`payment-${props.id}`}>
      <span class="hy-row__main">
        {props.method}
        <Show when={props.reference}>
          <span class="hy-row__sub hy-num">{props.reference}</span>
        </Show>
      </span>
      <span class="hy-num">{formatMoney(props.amountPaise)}</span>
      <Show when={props.onRemove}>
        <Button data-testid={`payment-${props.id}-remove`} onClick={() => props.onRemove?.()}>
          {t("ui.payment.remove")}
        </Button>
      </Show>
    </div>
  );
}

export type Share = { id: string; label: string; amountPaise: number; paid: boolean };

/** Equal shares of a bill; each share is settled on its own. Share amounts come from domain code. */
export function ShareList(props: { label: string; shares: Share[]; onPay: (id: string) => void }): JSX.Element {
  const { t } = useI18n();
  return (
    <ul class="hy-share-list" aria-label={props.label} data-testid="share-list">
      <For each={props.shares}>
        {(s) => (
          <li class="hy-row" data-testid={`share-${s.id}`}>
            <span class="hy-row__main">{s.label}</span>
            <span class="hy-num">{formatMoney(s.amountPaise)}</span>
            <Show
              when={!s.paid}
              fallback={<StatusBadge kind="success" label={t("ui.share.paid")} />}
            >
              <Button variant="primary" data-testid={`share-${s.id}-pay`} onClick={() => props.onPay(s.id)}>
                {t("ui.share.pay")}
              </Button>
            </Show>
          </li>
        )}
      </For>
    </ul>
  );
}

/** Check review before settlement: breakdown plus what is still due. */
export function CheckSummary(props: {
  label: string;
  rows: BreakdownRow[];
  totalPaise: number;
  paidPaise: number;
  duePaise: number;
}): JSX.Element {
  const { t } = useI18n();
  return (
    <section class="hy-check-summary" aria-label={props.label} data-testid="check-summary">
      <AmountBreakdown label={props.label} rows={props.rows} totalPaise={props.totalPaise} />
      <dl class="hy-breakdown">
        <div class="hy-breakdown__row">
          <dt>{t("ui.check.paid")}</dt>
          <dd class="hy-num" data-testid="check-paid">
            {formatMoney(props.paidPaise)}
          </dd>
        </div>
        <div class="hy-breakdown__row hy-breakdown__row--total">
          <dt>{t("ui.check.due")}</dt>
          <dd class="hy-num" data-testid="check-due">
            {formatMoney(props.duePaise)}
          </dd>
        </div>
      </dl>
    </section>
  );
}

/** Pre-bill shown to the guest before payment: lines, breakdown, and a clear "not a tax invoice" note. */
export function PreBillPreview(props: {
  label: string;
  lines: { id: string; name: string; qty: number; totalPaise: number }[];
  rows: BreakdownRow[];
  totalPaise: number;
}): JSX.Element {
  const { t } = useI18n();
  return (
    <section class="hy-prebill" aria-label={props.label} data-testid="prebill">
      <p class="hy-prebill__note">{t("ui.prebill.note")}</p>
      <ul class="hy-order-lines">
        <For each={props.lines}>
          {(l) => (
            <li class="hy-row">
              <span class="hy-row__main">{l.name}</span>
              <span class="hy-num">×{l.qty}</span>
              <span class="hy-num">{formatMoney(l.totalPaise)}</span>
            </li>
          )}
        </For>
      </ul>
      <AmountBreakdown label={props.label} rows={props.rows} totalPaise={props.totalPaise} />
    </section>
  );
}

export type BillRequest = { id: string; table: string; ageText: string };

/** Tables that asked for the bill. */
export function BillRequestList(props: {
  label: string;
  requests: BillRequest[];
  onOpen: (id: string) => void;
  empty?: JSX.Element;
}): JSX.Element {
  return (
    <Show when={props.requests.length > 0} fallback={props.empty}>
      <ul class="hy-bill-requests" aria-label={props.label} data-testid="bill-requests">
        <For each={props.requests}>
          {(r) => (
            <li>
              <button type="button" class="hy-row hy-row--button" data-testid={`bill-request-${r.id}`} onClick={() => props.onOpen(r.id)}>
                <span class="hy-row__main">{r.table}</span>
                <span class="hy-num">{r.ageText}</span>
              </button>
            </li>
          )}
        </For>
      </ul>
    </Show>
  );
}
