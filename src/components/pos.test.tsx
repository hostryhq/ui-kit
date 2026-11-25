import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@solidjs/testing-library";
import { createSignal, flush } from "solid-js";
import { SegmentedControl } from "./controls";
import { FloorGrid, SyncStatus, TableTile } from "./floor";
import { AmountField, ApprovalDialog, PinPad } from "./pin";
import { LineSelectList, ModifierGroup, OrderLine, OrderPanel } from "./order";
import { AmountBreakdown } from "./payment";
import { KdsTicket, KdsItemRow, kdsAge } from "./kds";
import { BlindCountForm, LockedRow, ManualBillForm } from "./shift";
import { BasisPointField, InvoiceRefField, MoneyField } from "./fields";
import { DiffList, OneTimeReveal, RuleGrid, WizardStepper } from "./admin";

const press = (digits: string, scope = "pin-numpad") => {
  for (const d of digits) {
    fireEvent.click(screen.getByTestId(`${scope}-${d}`));
    flush();
  }
};
const type = (el: HTMLElement, value: string) => {
  (el as HTMLInputElement).value = value;
  fireEvent.input(el);
};

describe("tokens for the Phase 2 gaps", () => {
  const css = readFileSync("src/tokens/tokens.css", "utf8");
  it("defines table.state.* and kds.ticket.border.* from existing colours", () => {
    for (const s of ["free", "occupied", "billed", "ready", "attention"]) {
      expect(css).toContain(`--hy-table-${s}-bg:`);
      expect(css).toContain(`--hy-table-${s}-fg:`);
    }
    expect(css).toMatch(/--hy-kds-border-fresh-style:\s*none/);
    expect(css).toMatch(/--hy-kds-border-waiting-style:\s*dashed/);
    expect(css).toMatch(/--hy-kds-border-late-style:\s*solid/);
  });
});

describe("SegmentedControl", () => {
  it("moves selection with arrows, skips disabled options and keeps one tab stop", () => {
    const [sel, setSel] = createSignal<string | undefined>("cash");
    render(() => (
      <SegmentedControl
        label="Tender"
        selected={sel()}
        onSelect={setSel}
        data-testid="t"
        options={[
          { id: "cash", label: "Cash" },
          { id: "card", label: "Card", disabled: true },
          { id: "upi", label: "UPI" },
        ]}
      />
    ));
    fireEvent.keyDown(screen.getByTestId("t-cash"), { key: "ArrowRight" });
    flush();
    expect(sel()).toBe("upi");
    expect(screen.getByTestId("t-upi").getAttribute("tabindex")).toBe("0");
    expect(screen.getByTestId("t-cash").getAttribute("tabindex")).toBe("-1");
    expect(screen.getByTestId("t-upi").getAttribute("aria-checked")).toBe("true");
  });
});

describe("floor", () => {
  it("TableTile shows state as text and icon and reports selection", () => {
    const onSelect = vi.fn();
    render(() => <TableTile name="T4" state="billed" selected onSelect={onSelect} />);
    const tile = screen.getByTestId("floor-table-T4");
    expect(tile.textContent).toContain("Billed");
    expect(tile.querySelector("svg")).not.toBeNull();
    expect(tile.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(tile);
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("FloorGrid moves focus by one and by a row with arrow keys", () => {
    render(() => (
      <FloorGrid label="Floor" columns={2}>
        <TableTile name="A" state="free" />
        <TableTile name="B" state="free" />
        <TableTile name="C" state="free" />
      </FloorGrid>
    ));
    const a = screen.getByTestId("floor-table-A");
    a.focus();
    fireEvent.keyDown(a, { key: "ArrowRight" });
    expect(document.activeElement).toBe(screen.getByTestId("floor-table-B"));
    fireEvent.keyDown(screen.getByTestId("floor-table-B"), { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getByTestId("floor-table-C"));
  });

  it("SyncStatus always has text and shows the pending count only when above zero", () => {
    const [n, setN] = createSignal(0);
    render(() => <SyncStatus state="pending" pendingCount={n()} />);
    const chip = screen.getByTestId("sync-status");
    expect(chip.textContent).toContain("Waiting to sync");
    expect(screen.queryByTestId("sync-pending-count")).toBeNull();
    setN(3);
    flush();
    expect(screen.getByTestId("sync-pending-count").textContent).toBe("3 waiting");
  });
});

describe("PIN entry", () => {
  it("never puts the PIN in the DOM, completes once at full length and clears", () => {
    const onComplete = vi.fn();
    const { container } = render(() => <PinPad onComplete={onComplete} />);
    press("12");
    flush();
    expect(screen.getByTestId("pin-dots").getAttribute("data-filled")).toBe("2");
    expect(screen.getByTestId("pin-dots").textContent).toBe("");
    expect(screen.getByTestId("pin-dots").getAttribute("aria-label")).toBe("2 of 4 digits");
    expect(container.querySelector("input")).toBeNull();
    press("34");
    flush();
    expect(onComplete).toHaveBeenCalledExactlyOnceWith("1234");
    expect(screen.getByTestId("pin-dots").getAttribute("data-filled")).toBe("0");
  });

  it("accepts hardware digits and Backspace", () => {
    const onComplete = vi.fn();
    render(() => <PinPad length={4} onComplete={onComplete} />);
    const pad = screen.getByTestId("pin-numpad");
    for (const key of ["9", "9", "Backspace", "8", "7", "6"]) fireEvent.keyDown(pad, { key });
    flush();
    expect(onComplete).toHaveBeenCalledWith("9876");
  });

  it("ignores input while disabled", () => {
    const onComplete = vi.fn();
    render(() => <PinPad length={1} disabled onComplete={onComplete} />);
    fireEvent.keyDown(screen.getByTestId("pin-numpad"), { key: "5" });
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("AmountField builds whole rupees as integer paise, with 00 and delete", () => {
    const [paise, setPaise] = createSignal(0);
    render(() => <AmountField label="Cash" valuePaise={paise()} onChange={setPaise} />);
    for (const d of ["2", "5"]) {
      fireEvent.click(screen.getByTestId(`amount-numpad-${d}`));
      flush();
    }
    expect(paise()).toBe(2500);
    fireEvent.click(screen.getByTestId("amount-numpad-extra"));
    flush();
    expect(paise()).toBe(250000);
    fireEvent.click(screen.getByTestId("amount-numpad-delete"));
    flush();
    expect(paise()).toBe(25000);
    expect(screen.getByTestId("amount-value").textContent).toBe("₹250.00");
  });
});

describe("ApprovalDialog", () => {
  it("requires choosing an approver before a PIN counts, then submits both", () => {
    const onSubmit = vi.fn();
    render(() => (
      <ApprovalDialog
        open
        title="Approve discount"
        approvers={[{ id: "m1", name: "Meena" }]}
        onSubmit={onSubmit}
        onClose={() => {}}
      />
    ));
    press("1111", "approval-pin-numpad");
    flush();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId("approval-pick-user")).toBeTruthy();
    fireEvent.click(screen.getByTestId("approval-user-m1"));
    flush();
    press("2222", "approval-pin-numpad");
    flush();
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({ approverId: "m1", pin: "2222" });
    expect(screen.getByTestId("approval-validity").textContent).toContain("2 minutes");
  });

  it("own-PIN proof has no approver list", () => {
    const onSubmit = vi.fn();
    render(() => <ApprovalDialog open title="Confirm" onSubmit={onSubmit} onClose={() => {}} />);
    press("4321", "approval-pin-numpad");
    flush();
    expect(onSubmit).toHaveBeenCalledWith({ approverId: undefined, pin: "4321" });
  });
});

describe("order entry", () => {
  it("ModifierGroup shows the minimum message and caps choices at max", () => {
    const [sel, setSel] = createSignal<string[]>([]);
    render(() => (
      <ModifierGroup
        name="Toppings"
        min={1}
        max={2}
        selected={sel()}
        onChange={setSel}
        options={[
          { id: "a", label: "Cheese", pricePaise: 2000 },
          { id: "b", label: "Egg" },
          { id: "c", label: "Onion" },
        ]}
      />
    ));
    expect(screen.getByTestId("modifier-short").textContent).toBe("Choose at least 1");
    fireEvent.click(screen.getByTestId("modifier-option-a"));
    flush();
    fireEvent.click(screen.getByTestId("modifier-option-b"));
    flush();
    expect(sel()).toEqual(["a", "b"]);
    expect(screen.queryByTestId("modifier-short")).toBeNull();
    expect((screen.getByTestId("modifier-option-c") as HTMLInputElement).disabled).toBe(true);
    expect(screen.getByText("+₹20.00")).toBeTruthy();
  });

  it("a draft line steps down to zero as a remove; a sent line is read-only with its level", () => {
    const onRemove = vi.fn();
    const onQty = vi.fn();
    render(() => (
      <ul>
        <OrderLine
          line={{ id: "d", name: "Dosa", qty: 1, totalPaise: 9000, state: "draft" }}
          onQtyChange={onQty}
          onRemove={onRemove}
        />
        <OrderLine line={{ id: "s", name: "Tea", qty: 2, totalPaise: 4000, state: "sent", sent: "hub" }} />
      </ul>
    ));
    fireEvent.click(screen.getByTestId("order-line-d-stepper-plus"));
    expect(onQty).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByTestId("order-line-d-stepper-minus"));
    expect(onRemove).toHaveBeenCalledOnce();
    const sent = screen.getByTestId("order-line-s");
    expect(sent.querySelector("button")).toBeNull();
    expect(sent.textContent).toContain("At hub");
  });

  it("OrderPanel displays the total it is given", () => {
    render(() => <OrderPanel label="Order" lines={[]} totalPaise={12345600} empty={<p>No items</p>} />);
    expect(screen.getByTestId("order-total").textContent).toBe("₹1,23,456.00");
  });

  it("LineSelectList picks a partial quantity and drops a line at zero", () => {
    const [sel, setSel] = createSignal<Record<string, number>>({});
    render(() => (
      <LineSelectList label="Split" lines={[{ id: "x", label: "Idli", qty: 3 }]} selection={sel()} onChange={setSel} />
    ));
    fireEvent.click(screen.getByTestId("line-select-x"));
    flush();
    expect(sel()).toEqual({ x: 3 });
    fireEvent.click(screen.getByTestId("line-select-x-qty-minus"));
    flush();
    expect(sel()).toEqual({ x: 2 });
    fireEvent.click(screen.getByTestId("line-select-x"));
    flush();
    expect(sel()).toEqual({});
  });
});

describe("settlement", () => {
  it("AmountBreakdown shows given figures and a total, recalculating nothing", () => {
    render(() => (
      <AmountBreakdown
        label="Charge"
        rows={[
          { id: "ex", label: "Amount", amountPaise: 100000 },
          { id: "cgst", label: "CGST 9%", amountPaise: 9001 },
        ]}
        totalPaise={118000}
      />
    ));
    expect(screen.getByTestId("breakdown-cgst").textContent).toContain("₹90.01");
    expect(screen.getByTestId("breakdown-total").textContent).toContain("₹1,180.00");
  });
});

describe("KDS", () => {
  it("age bands follow thresholds (fresh <=5, waiting <=10, late beyond)", () => {
    expect(kdsAge(5)).toBe("fresh");
    expect(kdsAge(6)).toBe("waiting");
    expect(kdsAge(10)).toBe("waiting");
    expect(kdsAge(11)).toBe("late");
    expect(kdsAge(3, { freshMaxMinutes: 2, waitingMaxMinutes: 4 })).toBe("waiting");
  });

  it("KdsTicket prints the age as text, marks the band and bumps with one tap", () => {
    const onBump = vi.fn();
    render(() => (
      <KdsTicket id="7" title="T4" minutes={12} bumpLabel="Ready" onBump={onBump}>
        <KdsItemRow id="i1" qty={2} name="Dosa" modifiers={["No onion"]} />
      </KdsTicket>
    ));
    const ticket = screen.getByTestId("kds-ticket-7");
    expect(ticket.getAttribute("data-age")).toBe("late");
    expect(screen.getByTestId("kds-age").textContent).toContain("12 min");
    fireEvent.click(screen.getByTestId("kds-bump-7"));
    expect(onBump).toHaveBeenCalledOnce();
  });
});

describe("shift and settings", () => {
  it("BlindCountForm sums counts times denomination and takes no expected amount", () => {
    const [counts, setCounts] = createSignal<Record<string, number>>({});
    const onSubmit = vi.fn();
    render(() => (
      <BlindCountForm
        denominations={[
          { id: "d500", label: "₹500", valuePaise: 50000 },
          { id: "d10", label: "₹10", valuePaise: 1000 },
        ]}
        counts={counts()}
        onChange={setCounts}
        onSubmit={onSubmit}
      />
    ));
    type(screen.getByTestId("blind-count-d500"), "3");
    type(screen.getByTestId("blind-count-d10"), "7x");
    flush();
    expect(counts()).toEqual({ d500: 3 });
    type(screen.getByTestId("blind-count-d10"), "7");
    flush();
    expect(screen.getByTestId("blind-count-total").textContent).toBe("₹1,570.00");
    expect(screen.getByTestId("blind-count").textContent).not.toMatch(/expected/i);
    fireEvent.submit(screen.getByTestId("blind-count"));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("LockedRow shows the reason as visible text and as the accessible description", () => {
    render(() => <LockedRow id="tax" label="Tax mode" value="Inclusive" reason="Only the owner can change this" />);
    const row = screen.getByTestId("locked-tax");
    expect(row.getAttribute("aria-disabled")).toBe("true");
    const reason = screen.getByTestId("locked-tax-reason");
    expect(row.getAttribute("aria-describedby")).toBe(reason.id);
    expect(reason.textContent).toBe("Only the owner can change this");
  });

  it("ManualBillForm refuses an empty submit and emits integer paise when complete", () => {
    const onSubmit = vi.fn();
    render(() => (
      <ManualBillForm tenders={[{ id: "cash", label: "Cash" }]} initialDate="2026-11-24" onSubmit={onSubmit} />
    ));
    fireEvent.submit(screen.getByTestId("manual-bill"));
    flush();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getAllByRole("alert").length).toBeGreaterThanOrEqual(3);
    type(screen.getByTestId("manual-bill-book"), "B-7");
    type(screen.getByTestId("manual-bill-number"), "0412");
    type(screen.getByTestId("manual-bill-amount"), "1,250.5");
    flush();
    fireEvent.submit(screen.getByTestId("manual-bill"));
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      bookRef: "B-7",
      billNo: "0412",
      date: "2026-11-24",
      amountPaise: 125050,
      tender: "cash",
    });
  });
});

describe("admin fields", () => {
  it("MoneyField turns typed rupees into integer paise and flags junk without emitting a float", () => {
    const [v, setV] = createSignal<number | undefined>(undefined);
    render(() => <MoneyField label="Amount" valuePaise={v()} onChange={setV} data-testid="m" />);
    const el = screen.getByTestId("m");
    fireEvent.focus(el);
    type(el, "1,234.5");
    flush();
    expect(v()).toBe(123450);
    type(el, "12.345");
    flush();
    expect(v()).toBeUndefined();
    expect(screen.getByRole("alert").textContent).toContain("Enter an amount");
    fireEvent.blur(el);
    type(el, "");
  });

  it("BasisPointField reads integer basis points and shows the percent live", () => {
    const [v, setV] = createSignal<number | undefined>(250);
    render(() => <BasisPointField label="Rate" valueBp={v()} onChange={setV} data-testid="bp" />);
    expect(screen.getByTestId("bp-percent").textContent).toBe("= 2.5%");
    type(screen.getByTestId("bp"), "900");
    flush();
    expect(v()).toBe(900);
    expect(screen.getByTestId("bp-percent").textContent).toBe("= 9%");
    type(screen.getByTestId("bp"), "10001");
    flush();
    expect(v()).toBeUndefined();
    type(screen.getByTestId("bp"), "2.5");
    flush();
    expect(v()).toBeUndefined();
  });

  it("InvoiceRefField can be set once, then shows read-only with who and when", () => {
    const [ref, setRef] = createSignal<string | undefined>(undefined);
    render(() => (
      <InvoiceRefField label="Invoice ref" value={ref()} setBy="Asha" setAtUtc="2026-11-24T04:30:00Z" onSet={setRef} />
    ));
    const set = screen.getByTestId("invoice-ref-set") as HTMLButtonElement;
    expect(set.disabled).toBe(true);
    type(screen.getByTestId("invoice-ref"), "INV-9");
    flush();
    fireEvent.click(set);
    flush();
    expect(ref()).toBe("INV-9");
    expect(screen.queryByTestId("invoice-ref")).toBeNull();
    expect(screen.getByTestId("invoice-ref-locked").textContent).toContain("Set by Asha on 24 Nov 2026");
  });
});

describe("admin display", () => {
  it("OneTimeReveal removes the secret from the DOM after acknowledgement", () => {
    const onDone = vi.fn();
    const { container } = render(() => <OneTimeReveal label="Code" secret="ABCD-EFGH" onDone={onDone} />);
    expect(container.textContent).toContain("ABCD-EFGH");
    fireEvent.click(screen.getByTestId("reveal-ack"));
    flush();
    expect(container.textContent).not.toContain("ABCD-EFGH");
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("DiffList marks only rows that changed", () => {
    render(() => (
      <DiffList
        label="Changes"
        rows={[
          { id: "a", label: "CGST", before: "250", after: "250" },
          { id: "b", label: "SGST", before: "250", after: "300" },
        ]}
      />
    ));
    expect(screen.getByTestId("diff-a").getAttribute("data-changed")).toBe("false");
    expect(screen.getByTestId("diff-b").getAttribute("data-changed")).toBe("true");
    expect(screen.getByTestId("diff-b").textContent).toContain("Changed");
  });

  it("WizardStepper links done steps only and explains locked ones", () => {
    const onOpen = vi.fn();
    render(() => (
      <WizardStepper
        label="Setup"
        onOpen={onOpen}
        steps={[
          { id: "a", label: "Business", status: "done" },
          { id: "b", label: "Tax", status: "locked", lockedReason: "For the owner" },
        ]}
      />
    ));
    fireEvent.click(screen.getByTestId("wizard-open-a"));
    expect(onOpen).toHaveBeenCalledWith("a");
    expect(screen.queryByTestId("wizard-open-b")).toBeNull();
    expect(screen.getByTestId("wizard-reason-b").textContent).toBe("For the owner");
  });

  it("RuleGrid navigates cells with arrows, shows 'changed from', and is input-free when read-only", () => {
    const onChange = vi.fn();
    const props = {
      label: "Tax",
      rows: [
        { id: "food", label: "Food" },
        { id: "bev", label: "Drinks" },
      ],
      columns: [{ id: "in", label: "Dine-in" }],
      values: { "food:in": 500, "bev:in": 1800 } as Record<string, number | undefined>,
      previous: { "food:in": 500, "bev:in": 1200 } as Record<string, number | undefined>,
      onChange,
    };
    const { unmount } = render(() => <RuleGrid {...props} />);
    const food = screen.getByTestId("rule-food-in");
    food.focus();
    fireEvent.keyDown(food, { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getByTestId("rule-bev-in"));
    expect(screen.getByTestId("rule-bev-in-changed").textContent).toBe("changed from 1200");
    expect(screen.queryByTestId("rule-food-in-changed")).toBeNull();
    expect(screen.getByLabelText("Food, Dine-in, basis points")).toBe(food);
    type(food, "550");
    expect(onChange).toHaveBeenCalledWith("food", "in", 550);
    unmount();
    render(() => <RuleGrid {...props} readOnly />);
    expect(screen.queryByTestId("rule-food-in")).toBeNull();
  });
});
