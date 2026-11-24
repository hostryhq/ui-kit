import { createUniqueId, For, onSettled } from "solid-js";
import type { JSX } from "@solidjs/web";

export type TabItem = {
  id: string;
  /** Already-translated label. */
  label: string;
  "data-testid"?: string;
};

export type TabsProps = {
  label: string;
  tabs: TabItem[];
  selected: string;
  onSelect: (id: string) => void;
  /** Alt+1..9 selects the nth tab (admin keyboard map). Ignored while a text field has focus. */
  altShortcuts?: boolean;
  children?: JSX.Element;
};

export function Tabs(props: TabsProps): JSX.Element {
  const base = createUniqueId();
  const tabId = (id: string) => `${base}-tab-${id}`;
  const panelId = `${base}-panel`;
  let list!: HTMLDivElement;

  const select = (index: number, focus: boolean) => {
    const tab = props.tabs[index];
    if (!tab) return;
    props.onSelect(tab.id);
    if (focus) list.querySelector<HTMLElement>(`#${CSS.escape(tabId(tab.id))}`)?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const i = props.tabs.findIndex((t) => t.id === props.selected);
    const n = props.tabs.length;
    if (e.key === "ArrowRight") select((i + 1) % n, true);
    else if (e.key === "ArrowLeft") select((i - 1 + n) % n, true);
    else if (e.key === "Home") select(0, true);
    else if (e.key === "End") select(n - 1, true);
    else return;
    e.preventDefault();
  };

  onSettled(() => {
    if (!props.altShortcuts) return;
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1 || n > props.tabs.length) return;
      if (e.target instanceof Element && e.target.closest("input, textarea, select")) return;
      e.preventDefault();
      select(n - 1, false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <div class="hy-tabs">
      <div class="hy-tabs__list" role="tablist" aria-label={props.label} ref={list} onKeyDown={onKeyDown}>
        <For each={props.tabs}>
          {(tab) => (
            <button
              type="button"
              role="tab"
              id={tabId(tab.id)}
              class="hy-tabs__tab"
              aria-selected={props.selected === tab.id ? "true" : "false"}
              aria-controls={panelId}
              tabindex={props.selected === tab.id ? 0 : -1}
              data-testid={tab["data-testid"] ?? `tab-${tab.id}`}
              onClick={() => props.onSelect(tab.id)}
            >
              {tab.label}
            </button>
          )}
        </For>
      </div>
      <div role="tabpanel" id={panelId} aria-labelledby={tabId(props.selected)} class="hy-tabs__panel" tabindex="0">
        {props.children}
      </div>
    </div>
  );
}
