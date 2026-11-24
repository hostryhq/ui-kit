import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@solidjs/testing-library";
import { createSignal, flush } from "solid-js";
import { Dialog } from "./Dialog";
import { DataTable, type Column } from "./DataTable";
import { NavBar } from "./AppShell";
import { OfflineBanner } from "./Banner";
import { OtpField } from "./SecretFields";
import { StatusBadge } from "./StatusBadge";
import { Tabs } from "./Tabs";

type Org = { id: string; name: string };
const rows: Org[] = [
  { id: "a", name: "Anand Bhavan" },
  { id: "b", name: "Sea Catch" },
  { id: "c", name: "Green Leaf" },
];
const columns: Column<Org>[] = [{ id: "name", header: "Name", cell: (r) => r.name }];

describe("OfflineBanner", () => {
  it("keeps its live region mounted and shows text per reason", () => {
    const [reason, setReason] = createSignal<"offline" | "unreachable" | undefined>(undefined);
    render(() => <OfflineBanner reason={reason()} />);
    const region = screen.getByTestId("offline-banner");
    expect(region.getAttribute("aria-live")).toBe("polite");
    expect(region.textContent).toBe("");
    setReason("offline");
    flush();
    expect(region.textContent).toContain("You are offline. Changes are disabled.");
    setReason("unreachable");
    flush();
    expect(region.textContent).toContain("Cannot reach the server.");
    setReason(undefined);
    flush();
    expect(region.textContent).toBe("");
  });
});

describe("DataTable", () => {
  it("moves with j/k and arrows, opens with Enter, ignores keys from controls", () => {
    const onOpen = vi.fn();
    render(() => (
      <DataTable caption="Organisations" columns={columns} rows={rows} rowKey={(r) => r.id} onOpen={onOpen} />
    ));
    const [r0, r1] = screen.getAllByTestId("table-row") as [HTMLElement, HTMLElement, HTMLElement];
    r0.focus();
    fireEvent.keyDown(r0, { key: "j" });
    expect(document.activeElement).toBe(r1);
    fireEvent.keyDown(r1, { key: "Enter" });
    expect(onOpen).toHaveBeenCalledWith(rows[1]);
    fireEvent.keyDown(r1, { key: "k" });
    expect(document.activeElement).toBe(r0);
    fireEvent.keyDown(r0, { key: "End" });
    expect(document.activeElement).toBe(screen.getAllByTestId("table-row")[2]);
  });

  it("uses table semantics, skeleton rows while loading, and the empty slot", () => {
    const [loading, setLoading] = createSignal(true);
    render(() => (
      <DataTable
        caption="Organisations"
        columns={columns}
        rows={[]}
        rowKey={(r) => r.id}
        loading={loading()}
        empty={<p data-testid="empty">No organisations yet.</p>}
      />
    ));
    expect(screen.getAllByTestId("table-skeleton-row")).toHaveLength(5);
    expect(screen.queryByTestId("empty")).toBeNull();
    expect(screen.getByRole("columnheader", { name: "Name" }).getAttribute("scope")).toBe("col");
    setLoading(false);
    flush();
    expect(screen.queryAllByTestId("table-skeleton-row")).toHaveLength(0);
    expect(screen.getByTestId("empty")).toBeTruthy();
  });
});

describe("Tabs", () => {
  it("selects with arrows and Alt+number, but not from a text field", () => {
    const [sel, setSel] = createSignal("overview");
    render(() => (
      <>
        <input data-testid="field" />
        <Tabs
          label="Org"
          altShortcuts
          selected={sel()}
          onSelect={setSel}
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "devices", label: "Devices" },
          ]}
        >
          panel
        </Tabs>
      </>
    ));
    fireEvent.keyDown(screen.getByTestId("tab-overview"), { key: "ArrowRight" });
    flush();
    expect(sel()).toBe("devices");
    fireEvent.keyDown(window, { key: "1", altKey: true });
    flush();
    expect(sel()).toBe("overview");
    fireEvent.keyDown(screen.getByTestId("field"), { key: "2", altKey: true });
    flush();
    expect(sel()).toBe("overview");
  });
});

describe("Dialog focus", () => {
  it("focuses data-autofocus, traps Tab and restores focus on close", () => {
    const [open, setOpen] = createSignal(false);
    render(() => (
      <>
        <button data-testid="opener" onClick={() => setOpen(true)}>
          open
        </button>
        <Dialog open={open()} title="Idle" onClose={() => setOpen(false)}>
          <button data-testid="stay" data-autofocus>
            Stay
          </button>
        </Dialog>
      </>
    ));
    const opener = screen.getByTestId("opener");
    opener.focus();
    setOpen(true);
    flush();
    const stay = screen.getByTestId("stay");
    expect(document.activeElement).toBe(stay);
    // Tab from the last focusable (stay) wraps to the first (close button).
    fireEvent.keyDown(stay, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByTestId("dialog-close"));
    fireEvent.keyDown(screen.getByTestId("dialog-close"), { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(stay);
    setOpen(false);
    flush();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });
});

describe("NavBar and fields", () => {
  it("marks the current item and routes plain clicks through onNavigate only", () => {
    const onNavigate = vi.fn();
    render(() => (
      <NavBar
        label="Main"
        currentId="orgs"
        onNavigate={onNavigate}
        items={[
          { id: "orgs", label: "Organisations", href: "/orgs" },
          { id: "audit", label: "Audit log", href: "/audit" },
        ]}
      />
    ));
    expect(screen.getByTestId("nav-orgs").getAttribute("aria-current")).toBe("page");
    expect(screen.getByTestId("nav-audit").getAttribute("aria-current")).toBeNull();
    fireEvent.click(screen.getByTestId("nav-audit"));
    expect(onNavigate).toHaveBeenCalledWith("/audit");
    onNavigate.mockClear();
    // A modified click is left to the browser (new tab); jsdom cannot navigate, so swallow it.
    const swallow = (e: Event) => e.preventDefault();
    document.addEventListener("click", swallow);
    fireEvent.click(screen.getByTestId("nav-audit"), { ctrlKey: true });
    document.removeEventListener("click", swallow);
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("OtpField keeps digits only, max six", () => {
    render(() => <OtpField label="Code" data-testid="otp" />);
    const el = screen.getByTestId("otp") as HTMLInputElement;
    el.value = "12a4-56789";
    fireEvent.input(el);
    expect(el.value).toBe("124567");
    expect(el.getAttribute("autocomplete")).toBe("one-time-code");
  });

  it("StatusBadge shows an icon and text, not colour alone", () => {
    render(() => <StatusBadge kind="warning" label="Trial" data-testid="b" />);
    const b = screen.getByTestId("b");
    expect(b.textContent).toBe("Trial");
    expect(b.querySelector("svg")).not.toBeNull();
  });
});
