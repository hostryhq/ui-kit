import { createSignal } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useI18n } from "../i18n";
import { Button } from "./Button";
import { Input, type InputProps } from "./Input";

export type PasswordFieldProps = Omit<InputProps, "type">;

/**
 * Password input with a show/hide toggle. The value lives only in the input; it is never written to
 * the URL, storage or logs. `autocomplete` defaults to current-password; pass new-password on setup.
 */
export function PasswordField(props: PasswordFieldProps): JSX.Element {
  const { t } = useI18n();
  const [shown, setShown] = createSignal(false);
  return (
    <div class="hy-password">
      <Input
        autocomplete="current-password"
        {...props}
        type={shown() ? "text" : "password"}
        autocapitalize="off"
        spellcheck={false}
      />
      <Button
        aria-pressed={shown() ? "true" : "false"}
        data-testid={props["data-testid"] ? `${props["data-testid"]}-toggle` : "password-toggle"}
        onClick={() => setShown(!shown())}
      >
        {shown() ? t("ui.password.hide") : t("ui.password.show")}
      </Button>
    </div>
  );
}

/** Six-digit one-time code: numeric keypad on touch, strips non-digits, browsers may autofill it. */
export function OtpField(props: Omit<InputProps, "type" | "inputmode" | "maxlength">): JSX.Element {
  return (
    <Input
      autocomplete="one-time-code"
      {...props}
      type="text"
      inputmode="numeric"
      maxlength={6}
      pattern="[0-9]{6}"
      onInput={(e) => {
        const el = e.currentTarget as HTMLInputElement;
        const digits = el.value.replace(/\D/g, "").slice(0, 6);
        if (digits !== el.value) el.value = digits;
        (props.onInput as ((ev: typeof e) => void) | undefined)?.(e);
      }}
    />
  );
}
