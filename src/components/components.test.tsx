import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@solidjs/testing-library";
import { flush } from "solid-js";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { Input } from "./Input";
import { ToastRegion, createToastQueue } from "./Toast";

describe("touch target standard", () => {
  it("tokens keep the 44 px minimum and controls use it", () => {
    const tokens = readFileSync("src/tokens/tokens.css", "utf8");
    expect(tokens).toMatch(/--hy-size-touch-min:\s*44px/);
    expect(tokens).toMatch(/--hy-touch-target:\s*var\(--hy-size-touch-min\)/);
    const styles = readFileSync("src/styles.css", "utf8");
    expect(styles).toMatch(/\.hy-btn,[\s\S]*?min-height:\s*max\(.*var\(--hy-touch-target\)\)/);
  });
});

describe("components", () => {
  it("Button defaults to type=button and forwards data-testid and clicks", () => {
    const onClick = vi.fn();
    render(() => (
      <Button data-testid="b" onClick={onClick}>
        Go
      </Button>
    ));
    const b = screen.getByTestId("b");
    expect(b.getAttribute("type")).toBe("button");
    fireEvent.click(b);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("Input links label and error", () => {
    render(() => <Input label="Qty" error="Too many" data-testid="q" />);
    const input = screen.getByTestId("q");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByLabelText("Qty")).toBe(input);
    expect(screen.getByRole("alert").textContent).toBe("Too many");
  });

  it("Dialog renders only when open and closes on Escape", () => {
    const onClose = vi.fn();
    render(() => <Dialog open={true} title="Void bill" onClose={onClose} />);
    const dlg = screen.getByRole("dialog");
    expect(dlg.getAttribute("aria-label")).toBe("Void bill");
    fireEvent.keyDown(dlg, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("Toast queue shows, dismisses and auto-dismisses", () => {
    vi.useFakeTimers();
    const q = createToastQueue(1000);
    render(() => <ToastRegion queue={q} />);
    const id = q.show("Saved");
    q.show("Printer offline", "error");
    flush();
    expect(q.items().map((i) => i.message)).toEqual(["Saved", "Printer offline"]);
    q.dismiss(id);
    flush();
    expect(q.items()).toHaveLength(1);
    vi.advanceTimersByTime(1000);
    flush();
    expect(q.items()).toHaveLength(0);
    vi.useRealTimers();
  });

  it("Toast dismiss button has a test id and removes its toast", () => {
    const q = createToastQueue(0);
    render(() => <ToastRegion queue={q} />);
    q.show("Saved");
    flush();
    fireEvent.click(screen.getByTestId("toast-dismiss"));
    flush();
    expect(q.items()).toHaveLength(0);
  });
});
