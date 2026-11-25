import { createSignal, For, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useI18n } from "../i18n";
import { formatMoney } from "../format";
import { Dialog } from "./Dialog";
import { Icon } from "./Icon";

/** PINs are 4 to 6 digits (managers use 6). */
const MIN_PIN = 4;
const MAX_PIN = 6;
const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/**
 * Digit keypad (64 px keys). Hardware digits, Backspace and Enter are accepted while focus is inside it.
 * Holds no value: it reports key presses and the parent decides what they mean.
 */
export function Numpad(props: {
  onDigit: (digit: string) => void;
  onDelete: () => void;
  onSubmit?: () => void;
  /** Optional key left of zero (for example "00" for cash entry). */
  extraKey?: { label: string; onPress: () => void };
  disabled?: boolean;
  "data-testid"?: string;
}): JSX.Element {
  const { t } = useI18n();
  const id = () => props["data-testid"] ?? "numpad";
  const onKeyDown = (e: KeyboardEvent) => {
    if (props.disabled || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[0-9]$/.test(e.key)) props.onDigit(e.key);
    else if (e.key === "Backspace") props.onDelete();
    else if (e.key === "Enter" && props.onSubmit) props.onSubmit();
    else return;
    e.preventDefault();
  };
  const key = (label: string, testid: string, press: () => void, aria?: string) => (
    <button
      type="button"
      class="hy-numpad__key"
      disabled={props.disabled}
      aria-label={aria}
      data-testid={`${id()}-${testid}`}
      onClick={press}
    >
      {label}
    </button>
  );
  return (
    <div class="hy-numpad" role="group" aria-label={t("ui.numpad.label")} data-testid={id()} onKeyDown={onKeyDown}>
      <For each={DIGITS}>{(d) => key(d, d, () => props.onDigit(d))}</For>
      {props.extraKey ? key(props.extraKey.label, "extra", props.extraKey.onPress) : <span />}
      {key("0", "0", () => props.onDigit("0"))}
      <button
        type="button"
        class="hy-numpad__key"
        disabled={props.disabled}
        aria-label={t("ui.numpad.delete")}
        data-testid={`${id()}-delete`}
        onClick={() => props.onDelete()}
      >
        <Icon name="backspace" />
      </button>
    </div>
  );
}

/**
 * PIN entry. The digits live only in a closure variable: the DOM shows count dots, never the PIN
 * (no input value, no text). `length` is 4 to 6 (default 4). `onComplete` fires once when `length` digits are in, or
 * on Enter or the OK key with at least 4 digits, then the entry clears.
 */
export function PinPad(props: {
  length?: number;
  onComplete: (pin: string) => void;
  /** Already-translated error ("Wrong PIN"). Shown as an alert; entry stays cleared. */
  error?: string;
  disabled?: boolean;
  "data-testid"?: string;
}): JSX.Element {
  const { t } = useI18n();
  const length = () => Math.min(MAX_PIN, Math.max(MIN_PIN, Math.trunc(props.length ?? MIN_PIN)));
  let digits = "";
  const [count, setCount] = createSignal(0);
  const id = () => props["data-testid"] ?? "pin";

  const finish = () => {
    const pin = digits;
    digits = "";
    setCount(0);
    props.onComplete(pin);
  };
  const push = (d: string) => {
    if (props.disabled || digits.length >= length()) return;
    digits += d;
    if (digits.length === length()) finish();
    else setCount(digits.length);
  };
  /** Enter or OK: submit a PIN shorter than `length` once it has at least 4 digits. */
  const submit = () => {
    if (props.disabled || digits.length < MIN_PIN) return;
    finish();
  };
  const remove = () => {
    digits = digits.slice(0, -1);
    setCount(digits.length);
  };

  return (
    <div class="hy-pin" data-testid={id()}>
      <div
        class="hy-pin__dots"
        role="status"
        aria-label={t("ui.pin.progress", { count: count(), total: length() })}
        data-testid={`${id()}-dots`}
        data-filled={count()}
      >
        <For each={Array.from({ length: length() }, (_, i) => i)}>
          {(i) => <span class={`hy-pin__dot${i < count() ? " hy-pin__dot--filled" : ""}`} aria-hidden="true" />}
        </For>
      </div>
      <Show when={props.error}>
        <p class="hy-field__error" role="alert" data-testid={`${id()}-error`}>
          {props.error}
        </p>
      </Show>
      <Numpad
        onDigit={push}
        onDelete={remove}
        onSubmit={submit}
        extraKey={{ label: t("ui.pin.ok"), onPress: submit }}
        disabled={props.disabled}
        data-testid={`${id()}-numpad`}
      />
    </div>
  );
}

/** Staff tile for choosing who is signing in or approving. */
export function UserTile(props: {
  name: string;
  /** Already-translated role label. */
  role?: string;
  selected?: boolean;
  onSelect: () => void;
  "data-testid"?: string;
}): JSX.Element {
  return (
    <button
      type="button"
      class="hy-user-tile"
      aria-pressed={props.selected ? "true" : "false"}
      data-testid={props["data-testid"] ?? `user-${props.name}`}
      onClick={() => props.onSelect()}
    >
      <span class="hy-user-tile__name">{props.name}</span>
      <Show when={props.role}>
        <span class="hy-user-tile__role">{props.role}</span>
      </Show>
    </button>
  );
}

/**
 * Whole-rupee amount entry on a keypad (cash tendered, opening float). Value is integer paise;
 * "00" adds two zeros. Digits cap at 7 so the value stays far below the safe-integer limit.
 */
export function AmountField(props: {
  /** Already-translated label. */
  label: string;
  valuePaise: number;
  onChange: (paise: number) => void;
  onSubmit?: () => void;
  "data-testid"?: string;
}): JSX.Element {
  const id = () => props["data-testid"] ?? "amount";
  const rupees = () => Math.trunc(props.valuePaise / 100);
  const set = (next: number) => {
    if (next <= 9_999_999) props.onChange(next * 100);
  };
  return (
    <div class="hy-amount" data-testid={id()}>
      <span class="hy-amount__label">{props.label}</span>
      <output class="hy-amount__value hy-num" aria-live="polite" data-testid={`${id()}-value`}>
        {formatMoney(props.valuePaise)}
      </output>
      <Numpad
        onDigit={(d) => set(rupees() * 10 + Number(d))}
        onDelete={() => set(Math.trunc(rupees() / 10))}
        onSubmit={props.onSubmit}
        extraKey={{ label: "00", onPress: () => set(rupees() * 100) }}
        data-testid={`${id()}-numpad`}
      />
    </div>
  );
}

export type Approver = { id: string; name: string; role?: string };

/**
 * One dialog for manager approval (pick a name, then PIN) and own-PIN proof (`approvers` omitted).
 * The PIN is passed to `onSubmit` and never kept. Validity text states how long the approval lasts.
 */
export function ApprovalDialog(props: {
  open: boolean;
  /** Already-translated title ("Approve discount"). */
  title: string;
  /** Already-translated reason or action summary shown above the keypad. */
  summary?: string;
  approvers?: Approver[];
  validityMinutes?: number;
  error?: string;
  onSubmit: (result: { approverId: string | undefined; pin: string }) => void;
  onClose: () => void;
  "data-testid"?: string;
}): JSX.Element {
  const { t } = useI18n();
  const [approver, setApprover] = createSignal<string | undefined>(undefined);
  const needsApprover = () => (props.approvers?.length ?? 0) > 0;
  const [missing, setMissing] = createSignal(false);

  return (
    <Dialog open={props.open} title={props.title} onClose={props.onClose} data-testid={props["data-testid"] ?? "approval"}>
      <Show when={props.summary}>
        <p data-testid="approval-summary">{props.summary}</p>
      </Show>
      <Show when={needsApprover()}>
        <div class="hy-approval__users" role="group" aria-label={t("ui.approval.who")}>
          <For each={props.approvers}>
            {(a) => (
              <UserTile
                name={a.name}
                role={a.role}
                selected={approver() === a.id}
                data-testid={`approval-user-${a.id}`}
                onSelect={() => {
                  setApprover(a.id);
                  setMissing(false);
                }}
              />
            )}
          </For>
        </div>
        <Show when={missing()}>
          <p class="hy-field__error" role="alert" data-testid="approval-pick-user">
            {t("ui.approval.pick_user")}
          </p>
        </Show>
      </Show>
      <PinPad
        error={props.error}
        data-testid="approval-pin"
        onComplete={(pin) => {
          if (needsApprover() && !approver()) {
            setMissing(true);
            return;
          }
          props.onSubmit({ approverId: approver(), pin });
        }}
      />
      <p class="hy-approval__validity" data-testid="approval-validity">
        {t("ui.approval.validity", { minutes: props.validityMinutes ?? 2 })}
      </p>
    </Dialog>
  );
}
