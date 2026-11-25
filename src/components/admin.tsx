import { createSignal, createUniqueId, For, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useI18n } from "../i18n";
import { formatBasisPoints } from "../format";
import { Button } from "./Button";
import { Icon } from "./Icon";

export type WizardStepStatus = "done" | "current" | "next" | "locked" | "skipped";

export type WizardStep = {
  id: string;
  label: string;
  status: WizardStepStatus;
  /** Already-translated reason a locked step cannot be opened ("For the owner"). */
  lockedReason?: string;
};

/**
 * Step list whose status comes from the services, not page state. Done steps are buttons that go back,
 * the current step is marked, locked steps say why. Status is text as well as an icon.
 */
export function WizardStepper(props: {
  label: string;
  steps: WizardStep[];
  onOpen: (id: string) => void;
}): JSX.Element {
  const { t } = useI18n();
  return (
    <ol class="hy-wizard" aria-label={props.label} data-testid="wizard-stepper">
      <For each={props.steps}>
        {(s, i) => (
          <li
            class={`hy-wizard__step hy-wizard__step--${s.status}`}
            aria-current={s.status === "current" ? "step" : undefined}
            data-status={s.status}
            data-testid={`wizard-step-${s.id}`}
          >
            <span class="hy-wizard__index hy-num">{i() + 1}</span>
            <Show
              when={s.status === "done"}
              fallback={<span class="hy-wizard__label">{s.label}</span>}
            >
              <button type="button" class="hy-wizard__link" data-testid={`wizard-open-${s.id}`} onClick={() => props.onOpen(s.id)}>
                {s.label}
              </button>
            </Show>
            <span class="hy-wizard__status">
              <Show when={s.status === "done"}>
                <Icon name="check-circle" />
              </Show>
              <Show when={s.status === "locked"}>
                <Icon name="lock" />
              </Show>
              {t(`ui.wizard.${s.status}`)}
            </span>
            <Show when={s.status === "locked" && s.lockedReason}>
              <span class="hy-wizard__reason" data-testid={`wizard-reason-${s.id}`}>
                {s.lockedReason}
              </span>
            </Show>
          </li>
        )}
      </For>
    </ol>
  );
}

export type DiffRow = { id: string; label: string; before: string; after: string };

/** Version in force versus the new version. Changed rows are marked with text, not only colour. */
export function DiffList(props: { label: string; rows: DiffRow[] }): JSX.Element {
  const { t } = useI18n();
  return (
    <dl class="hy-diff" aria-label={props.label} data-testid="diff-list">
      <For each={props.rows}>
        {(r) => {
          const changed = () => r.before !== r.after;
          return (
            <div class={`hy-diff__row${changed() ? " hy-diff__row--changed" : ""}`} data-changed={changed() ? "true" : "false"} data-testid={`diff-${r.id}`}>
              <dt>{r.label}</dt>
              <dd>
                <Show when={changed()} fallback={<span>{r.after}</span>}>
                  <span class="hy-diff__before">
                    <span class="hy-visually-hidden">{t("ui.diff.was")} </span>
                    {r.before}
                  </span>
                  <span aria-hidden="true"> → </span>
                  <span class="hy-diff__after">
                    <span class="hy-visually-hidden">{t("ui.diff.now")} </span>
                    {r.after}
                  </span>
                  <span class="hy-badge hy-badge--warning">{t("ui.diff.changed")}</span>
                </Show>
              </dd>
            </div>
          );
        }}
      </For>
    </dl>
  );
}

export type RuleGridAxis = { id: string; label: string };

export const ruleKey = (rowId: string, colId: string): string => `${rowId}:${colId}`;

/**
 * Editable table of basis-point values (tax rule mapping). Cells take integer basis points. Arrow keys
 * move between cells, Enter moves down. Row and column are announced through the cell label. When `previous`
 * is given a changed cell shows "changed from N". Read-only when `readOnly` (controls absent, not disabled).
 */
export function RuleGrid(props: {
  label: string;
  rows: RuleGridAxis[];
  columns: RuleGridAxis[];
  values: Readonly<Record<string, number | undefined>>;
  previous?: Readonly<Record<string, number | undefined>>;
  readOnly?: boolean;
  onChange: (rowId: string, colId: string, bp: number | undefined) => void;
  "data-testid"?: string;
}): JSX.Element {
  const { t } = useI18n();
  let table!: HTMLTableElement;
  const help = `rule-grid-help-${createUniqueId()}`;

  const focusCell = (r: number, c: number) => {
    table.querySelector<HTMLElement>(`[data-r="${r}"][data-c="${c}"]`)?.focus();
  };
  const onKeyDown = (e: KeyboardEvent) => {
    const el = e.target as HTMLElement;
    if (!el.matches("input[data-r]")) return;
    const r = Number(el.dataset.r);
    const c = Number(el.dataset.c);
    if (e.key === "ArrowDown" || e.key === "Enter") focusCell(r + 1, c);
    else if (e.key === "ArrowUp") focusCell(r - 1, c);
    else if (e.key === "ArrowRight" && (el as HTMLInputElement).selectionStart === (el as HTMLInputElement).value.length) focusCell(r, c + 1);
    else if (e.key === "ArrowLeft" && (el as HTMLInputElement).selectionStart === 0) focusCell(r, c - 1);
    else return;
    e.preventDefault();
  };

  return (
    <div class="hy-rule-grid" data-testid={props["data-testid"] ?? "rule-grid"}>
      <p id={help} class="hy-rule-grid__help">
        {t("ui.rulegrid.help")}
      </p>
      <table ref={table} class="hy-table" aria-describedby={help} onKeyDown={onKeyDown}>
        <caption class="hy-visually-hidden">{props.label}</caption>
        <thead>
          <tr>
            <th scope="col">
              <span class="hy-visually-hidden">{t("ui.rulegrid.row")}</span>
            </th>
            <For each={props.columns}>{(c) => <th scope="col">{c.label}</th>}</For>
          </tr>
        </thead>
        <tbody>
          <For each={props.rows}>
            {(row, ri) => (
              <tr>
                <th scope="row">{row.label}</th>
                <For each={props.columns}>
                  {(col, ci) => {
                    const key = ruleKey(row.id, col.id);
                    const value = () => props.values[key];
                    const was = () => props.previous?.[key];
                    const changed = () => props.previous !== undefined && was() !== value();
                    return (
                      <td class="hy-rule-grid__cell">
                        <Show
                          when={!props.readOnly}
                          fallback={<span class="hy-num">{value() === undefined ? "" : value()}</span>}
                        >
                          <input
                            class="hy-input hy-num"
                            inputmode="numeric"
                            autocomplete="off"
                            data-r={ri()}
                            data-c={ci()}
                            data-testid={`rule-${row.id}-${col.id}`}
                            aria-label={t("ui.rulegrid.cell", { row: row.label, column: col.label })}
                            value={value() === undefined ? "" : String(value())}
                            onInput={(e) => {
                              const raw = e.currentTarget.value.trim();
                              props.onChange(row.id, col.id, /^\d{1,5}$/.test(raw) && Number(raw) <= 10000 ? Number(raw) : undefined);
                            }}
                          />
                        </Show>
                        <Show when={value() !== undefined}>
                          <span class="hy-rule-grid__percent hy-num">{formatBasisPoints(value() ?? 0)}%</span>
                        </Show>
                        <Show when={changed()}>
                          <span class="hy-rule-grid__changed" data-testid={`rule-${row.id}-${col.id}-changed`}>
                            {t("ui.rulegrid.changed_from", { was: was() === undefined ? "-" : (was() ?? 0) })}
                          </span>
                        </Show>
                      </td>
                    );
                  }}
                </For>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  );
}

/**
 * Shows a secret once. It exists in the DOM only until "I wrote it down" is tapped; then the
 * node is removed and `onDone` fires. It is never put in storage, the URL or the console, and there
 * is no copy button (the secret would linger in the clipboard).
 */
export function OneTimeReveal(props: {
  /** Already-translated label for the secret ("Recovery code"). */
  label: string;
  secret: string;
  onDone: () => void;
  "data-testid"?: string;
}): JSX.Element {
  const { t } = useI18n();
  const [done, setDone] = createSignal(false);
  const id = () => props["data-testid"] ?? "reveal";
  return (
    <div class="hy-reveal" data-testid={id()}>
      <div aria-live="assertive">
        <Show when={!done()} fallback={<p data-testid={`${id()}-cleared`}>{t("ui.reveal.cleared")}</p>}>
          <p class="hy-reveal__label">{props.label}</p>
          <code class="hy-reveal__secret hy-num" data-testid={`${id()}-secret`}>
            {props.secret}
          </code>
          <p class="hy-reveal__warn">{t("ui.reveal.once")}</p>
        </Show>
      </div>
      <Show when={!done()}>
        <Button
          variant="primary"
          data-testid={`${id()}-ack`}
          onClick={() => {
            setDone(true);
            props.onDone();
          }}
        >
          {t("ui.reveal.ack")}
        </Button>
      </Show>
    </div>
  );
}

/** Side review panel (approvals). Not modal: the page behind stays usable. */
export function Panel(props: {
  title: string;
  open: boolean;
  onClose: () => void;
  children?: JSX.Element;
  "data-testid"?: string;
}): JSX.Element {
  const { t } = useI18n();
  return (
    <Show when={props.open}>
      <aside class="hy-panel" aria-label={props.title} data-testid={props["data-testid"] ?? "panel"}>
        <div class="hy-panel__header">
          <h2>{props.title}</h2>
          <Button aria-label={t("ui.dialog.close")} data-testid="panel-close" onClick={() => props.onClose()}>
            ×
          </Button>
        </div>
        {props.children}
      </aside>
    </Show>
  );
}

export type NavGroup = {
  id: string;
  label: string;
  items: { id: string; label: string; href: string }[];
};

/** Grouped navigation for the admin sidebar. */
export function NavMenu(props: { label: string; groups: NavGroup[]; current?: string }): JSX.Element {
  return (
    <nav class="hy-navmenu" aria-label={props.label} data-testid="nav-menu">
      <For each={props.groups}>
        {(g) => (
          <section aria-labelledby={`nav-group-${g.id}`}>
            <h2 id={`nav-group-${g.id}`} class="hy-navmenu__group">
              {g.label}
            </h2>
            <ul>
              <For each={g.items}>
                {(i) => (
                  <li>
                    <a class="hy-nav__link" href={i.href} aria-current={props.current === i.id ? "page" : undefined} data-testid={`nav-${i.id}`}>
                      {i.label}
                    </a>
                  </li>
                )}
              </For>
            </ul>
          </section>
        )}
      </For>
    </nav>
  );
}

/** CSV or file import target: a drop zone that is also a normal file button (keyboard and touch). */
export function FileDrop(props: {
  label: string;
  accept?: string;
  onFile: (file: File) => void;
  "data-testid"?: string;
}): JSX.Element {
  const { t } = useI18n();
  let input!: HTMLInputElement;
  const [over, setOver] = createSignal(false);
  return (
    <div
      class={`hy-filedrop${over() ? " hy-filedrop--over" : ""}`}
      data-testid={props["data-testid"] ?? "file-drop"}
      onDragOver={(e: DragEvent) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e: DragEvent) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer?.files[0];
        if (f) props.onFile(f);
      }}
    >
      <p>{t("ui.filedrop.hint")}</p>
      <input
        ref={input}
        type="file"
        class="hy-visually-hidden"
        accept={props.accept}
        tabindex="-1"
        data-testid="file-drop-input"
        onChange={(e) => {
          const f = e.currentTarget.files?.[0];
          if (f) props.onFile(f);
        }}
      />
      <Button data-testid="file-drop-choose" onClick={() => input.click()}>
        {props.label}
      </Button>
    </div>
  );
}
