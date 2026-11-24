import { onSettled, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { Portal } from "@solidjs/web";
import { useI18n } from "../i18n";
import { Button } from "./Button";

export type DialogProps = {
  open: boolean;
  /** Already-translated title. */
  title: string;
  onClose: () => void;
  children?: JSX.Element;
  "data-testid"?: string;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function DialogBody(props: DialogProps): JSX.Element {
  const { t } = useI18n();
  const previous = document.activeElement as HTMLElement | null;
  let el!: HTMLDivElement;
  const focusables = () => Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));

  // Move focus in on open (an element marked data-autofocus wins), give it back on close.
  onSettled(() => {
    (el.querySelector<HTMLElement>("[data-autofocus]") ?? focusables()[0] ?? el).focus();
    return () => previous?.focus?.();
  });

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      props.onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const items = focusables();
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div class="hy-dialog__overlay">
      <div
        ref={el}
        class="hy-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={props.title}
        tabindex="-1"
        data-testid={props["data-testid"]}
        onKeyDown={onKeyDown}
      >
        <div class="hy-dialog__header">
          <h2>{props.title}</h2>
          <Button aria-label={t("ui.dialog.close")} data-testid="dialog-close" onClick={() => props.onClose()}>
            ×
          </Button>
        </div>
        {props.children}
      </div>
    </div>
  );
}

/**
 * Modal dialog. Traps focus, restores it on close; Escape and the close button call `onClose`.
 * One dialog per routine action (client-app-standard).
 */
export function Dialog(props: DialogProps): JSX.Element {
  return (
    <Show when={props.open}>
      <Portal>
        <DialogBody {...props} />
      </Portal>
    </Show>
  );
}
