import { For, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useI18n } from "../i18n";

export const MAIN_ID = "hy-main";

/**
 * Page frame: skip link, header (NavBar), a banner slot (offline, support session) and the main region.
 * Banners sit directly under the header so they are on every screen.
 */
export function AppShell(props: {
  header?: JSX.Element;
  banners?: JSX.Element;
  children?: JSX.Element;
}): JSX.Element {
  const { t } = useI18n();
  return (
    <div class="hy-shell">
      <a class="hy-skip" href={`#${MAIN_ID}`} data-testid="skip-link">
        {t("ui.shell.skip")}
      </a>
      <Show when={props.header}>
        <header class="hy-shell__header">{props.header}</header>
      </Show>
      <div class="hy-shell__banners">{props.banners}</div>
      <main id={MAIN_ID} class="hy-shell__main" tabindex="-1" data-testid="main">
        {props.children}
      </main>
    </div>
  );
}

export type NavItem = {
  id: string;
  /** Already-translated label. */
  label: string;
  href: string;
  "data-testid"?: string;
};

export type NavBarProps = {
  /** Accessible name of the navigation landmark (translated). */
  label: string;
  items: NavItem[];
  currentId?: string | undefined;
  /** Brand block (logo + name) shown first. */
  brand?: JSX.Element;
  /** Right-hand side: user menu, sign out. */
  end?: JSX.Element;
  /** Client-side navigation hook. A plain left click calls it instead of a full page load. */
  onNavigate?: (href: string) => void;
};

export function NavBar(props: NavBarProps): JSX.Element {
  const onClick = (e: MouseEvent, href: string) => {
    if (!props.onNavigate || e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    props.onNavigate(href);
  };
  return (
    <div class="hy-nav">
      <Show when={props.brand}>
        <div class="hy-nav__brand">{props.brand}</div>
      </Show>
      <nav aria-label={props.label} class="hy-nav__items">
        <For each={props.items}>
          {(item) => (
            <a
              class="hy-nav__link"
              href={item.href}
              aria-current={props.currentId === item.id ? "page" : undefined}
              data-testid={item["data-testid"] ?? `nav-${item.id}`}
              onClick={(e: MouseEvent) => onClick(e, item.href)}
            >
              {item.label}
            </a>
          )}
        </For>
      </nav>
      <div class="hy-nav__end">{props.end}</div>
    </div>
  );
}
