import { createSignal, For, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useI18n } from "../i18n";

export type Column<T> = {
  id: string;
  /** Already-translated header text. Headers may wrap; never truncate. */
  header: string;
  cell: (row: T) => JSX.Element;
  /** Right-aligned tabular numerals (money, counts). */
  numeric?: boolean;
};

export type DataTableProps<T> = {
  /** Visually hidden caption naming the table for screen readers. */
  caption: string;
  columns: Column<T>[];
  rows: readonly T[];
  rowKey: (row: T) => string;
  /** Enter, click or double activation on a row. */
  onOpen?: (row: T) => void;
  /** Show skeleton rows instead of data. */
  loading?: boolean;
  /** Shown when there are no rows and not loading (an `EmptyState`). */
  empty?: JSX.Element;
  skeletonRows?: number;
  "data-testid"?: string;
};

/**
 * Real table semantics with a roving tabindex: one row is in the tab order; Down/Up or j/k move,
 * Home/End jump, Enter opens. Keys are ignored while focus is in a field or on a control inside a row.
 */
export function DataTable<T>(props: DataTableProps<T>): JSX.Element {
  const { t } = useI18n();
  const [active, setActive] = createSignal(0);
  let body!: HTMLTableSectionElement;

  const focusRow = (index: number) => {
    const n = props.rows.length;
    if (n === 0) return;
    const i = Math.max(0, Math.min(n - 1, index));
    setActive(i);
    body.querySelector<HTMLElement>(`[data-row-index="${i}"]`)?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("input, textarea, select, button, a")) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const row = target.closest<HTMLElement>("[data-row-index]");
    const current = row ? Number(row.dataset.rowIndex) : active();
    switch (e.key) {
      case "ArrowDown":
      case "j":
        e.preventDefault();
        focusRow(current + 1);
        break;
      case "ArrowUp":
      case "k":
        e.preventDefault();
        focusRow(current - 1);
        break;
      case "Home":
        e.preventDefault();
        focusRow(0);
        break;
      case "End":
        e.preventDefault();
        focusRow(props.rows.length - 1);
        break;
      case "Enter": {
        const r = props.rows[current];
        if (r !== undefined && row) {
          e.preventDefault();
          props.onOpen?.(r);
        }
        break;
      }
    }
  };

  return (
    <div class="hy-table-wrap">
      <table class="hy-table" data-testid={props["data-testid"]} aria-busy={props.loading ? "true" : undefined}>
        <caption class="hy-visually-hidden">{props.caption}</caption>
        <thead>
          <tr>
            <For each={props.columns}>
              {(col) => (
                <th scope="col" class={col.numeric ? "hy-table__num" : undefined}>
                  {col.header}
                </th>
              )}
            </For>
          </tr>
        </thead>
        <tbody ref={body} onKeyDown={onKeyDown}>
          <Show
            when={!props.loading}
            fallback={
              <For each={Array.from({ length: props.skeletonRows ?? 5 }, (_, i) => i)}>
                {(i) => (
                  <tr class="hy-table__skeleton" data-testid="table-skeleton-row" data-skeleton={i}>
                    <For each={props.columns}>
                      {() => (
                        <td>
                          <span class="hy-skeleton" aria-hidden="true" />
                        </td>
                      )}
                    </For>
                  </tr>
                )}
              </For>
            }
          >
            <For each={props.rows}>
              {(row, i) => (
                <tr
                  class="hy-table__row"
                  data-testid="table-row"
                  data-row-key={props.rowKey(row)}
                  data-row-index={i()}
                  tabindex={i() === active() ? 0 : -1}
                  aria-current={i() === active() ? "true" : undefined}
                  onFocus={() => setActive(i())}
                  onClick={() => {
                    setActive(i());
                    props.onOpen?.(row);
                  }}
                >
                  <For each={props.columns}>
                    {(col) => <td class={col.numeric ? "hy-table__num" : undefined}>{col.cell(row)}</td>}
                  </For>
                </tr>
              )}
            </For>
          </Show>
        </tbody>
      </table>
      <Show when={props.loading}>
        <span class="hy-visually-hidden" role="status">
          {t("ui.table.loading")}
        </span>
      </Show>
      <Show when={!props.loading && props.rows.length === 0}>{props.empty}</Show>
    </div>
  );
}
