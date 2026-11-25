import { createSignal, For } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useI18n } from "../i18n";
import { Button } from "./Button";

export type ToastKind = "info" | "error";
export type ToastItem = { id: number; message: string; kind: ToastKind };

/** Toast queue. Create one per app (or use the shared `toasts`) and mount a `<ToastRegion>`. */
export function createToastQueue(autoDismissMs = 4000) {
  const [items, setItems] = createSignal<ToastItem[]>([]);
  let next = 1;

  const dismiss = (id: number) => setItems((list) => list.filter((i) => i.id !== id));

  /** `message` is already translated. Pass `autoDismissMs = 0` to disable auto dismiss. */
  const show = (message: string, kind: ToastKind = "info"): number => {
    const id = next++;
    setItems((list) => [...list, { id, message, kind }]);
    if (autoDismissMs > 0) setTimeout(() => dismiss(id), autoDismissMs);
    return id;
  };

  return { items, show, dismiss };
}

export type ToastQueue = ReturnType<typeof createToastQueue>;

export const toasts: ToastQueue = createToastQueue();

export function ToastRegion(props: { queue?: ToastQueue }): JSX.Element {
  const { t } = useI18n();
  const queue = () => props.queue ?? toasts;
  return (
    <div class="hy-toast-region" role="status" aria-live="polite" aria-label={t("ui.toast.region")}>
      <For each={queue().items()}>
        {(item) => (
          <div class={`hy-toast hy-toast--${item.kind}`} data-testid="toast">
            <span>{item.message}</span>
            <Button aria-label={t("ui.toast.dismiss")} data-testid="toast-dismiss" onClick={() => queue().dismiss(item.id)}>
              ×
            </Button>
          </div>
        )}
      </For>
    </div>
  );
}
