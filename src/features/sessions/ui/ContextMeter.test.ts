// @vitest-environment happy-dom
import { act, createElement, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContextMeter } from "./ContextMeter";

describe("ContextMeter", () => {
  let container: HTMLDivElement;
  let root: Root;
  const usage = { used: 176_000, window: 256_000 };
  const render = async (props: ComponentProps<typeof ContextMeter>) => {
    await act(async () => root.render(createElement(ContextMeter, props)));
  };
  const action = () =>
    Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent === "Compact now",
    );

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it("hides absent and invalid readings, and clamps an overrun", async () => {
    for (const reading of [
      undefined,
      { used: 1 },
      { used: -1, window: 100 },
      { used: 1, window: Infinity },
    ]) {
      await render({ usage: reading });
      expect(container.childElementCount).toBe(0);
    }
    await render({ usage: { used: 300, window: 100 } });
    expect(
      container.querySelector('[role="img"]')?.getAttribute("aria-label"),
    ).toContain("100% context used");
    expect(
      container.querySelectorAll("circle")[1].getAttribute("stroke-dashoffset"),
    ).toBe("0");
  });

  it("makes read-only details available on keyboard focus", async () => {
    await render({ usage });
    const indicator = container.querySelector<HTMLElement>('[role="img"]')!;
    expect(indicator.tabIndex).toBe(0);
    await act(async () => indicator.focus());
    expect(document.body.textContent).toContain("69% context used");
    expect(document.body.textContent).toContain("176K / 256K tokens");
    expect(action()).toBeUndefined();
    await act(async () => indicator.blur());
    expect(document.body.textContent).not.toContain("176K / 256K tokens");
  });

  it("opens actions, compacts once, and restores trigger focus", async () => {
    const onCompact = vi.fn();
    await render({ usage, onCompact });
    const trigger = container.querySelector("button")!;
    await act(async () => trigger.click());
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(
      document.getElementById(trigger.getAttribute("aria-controls")!),
    ).not.toBeNull();
    await act(async () => action()!.focus());
    await act(async () => action()!.click());
    expect(onCompact).toHaveBeenCalledOnce();
    expect(action()).toBeUndefined();
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("disables compaction while busy and dismisses with Escape or outside click", async () => {
    const onCompact = vi.fn();
    await render({ usage, onCompact, compactDisabled: true });
    const trigger = container.querySelector("button")!;
    await act(async () => trigger.click());
    expect(action()!.disabled).toBe(true);
    await act(async () => action()!.click());
    expect(onCompact).not.toHaveBeenCalled();
    await act(async () =>
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      ),
    );
    expect(action()).toBeUndefined();
    expect(document.activeElement).toBe(trigger);
    await act(async () => trigger.click());
    await act(async () =>
      document.body.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true }),
      ),
    );
    expect(action()).toBeUndefined();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });
});
