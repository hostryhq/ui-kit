import { Show } from "solid-js";
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

/** Modal dialog. Escape and the close button call `onClose`. One dialog per routine action. */
export function Dialog(props: DialogProps): JSX.Element {
  const { t } = useI18n();
  return (
    <Show when={props.open}>
      <Portal>
        <div class="hy-dialog__overlay">
          <div
            class="hy-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={props.title}
            data-testid={props["data-testid"]}
            onKeyDown={(e: KeyboardEvent) => {
              if (e.key === "Escape") props.onClose();
            }}
          >
            <div class="hy-dialog__header">
              <h2>{props.title}</h2>
              <Button
                aria-label={t("ui.dialog.close")}
                data-testid="dialog-close"
                onClick={() => props.onClose()}
              >
                ×
              </Button>
            </div>
            {props.children}
          </div>
        </div>
      </Portal>
    </Show>
  );
}
