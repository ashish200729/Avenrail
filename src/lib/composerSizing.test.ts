import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { observeComposerSizing, resizeComposerField } from "./composerSizing";

function elements() {
  const field = {
    clientWidth: 320,
    scrollHeight: 88,
    scrollTop: 24,
    scrollLeft: 0,
    value: "Keep my draft",
    selectionStart: 4,
    isConnected: true,
    style: { height: "44px" },
  };
  const highlight = { style: { width: "" }, scrollTop: 0, scrollLeft: 0 };
  return {
    field,
    highlight,
    textarea: field as unknown as HTMLTextAreaElement,
    overlay: highlight as unknown as HTMLDivElement,
  };
}

describe("composer field sizing", () => {
  it("grows and shrinks within the height limit without changing the draft or caret", () => {
    const { field, textarea, overlay } = elements();
    resizeComposerField(textarea, overlay);
    expect(field.style.height).toBe("88px");
    field.scrollHeight = 260;
    resizeComposerField(textarea, overlay);
    expect(field.style.height).toBe("160px");
    field.scrollHeight = 44;
    resizeComposerField(textarea, overlay);
    expect(field.style.height).toBe("44px");
    expect(field.value).toBe("Keep my draft");
    expect(field.selectionStart).toBe(4);
  });

  it("aligns the overlay after a scrollbar takes space and restores scroll position", () => {
    const { field, highlight, textarea, overlay } = elements();
    field.scrollHeight = 260;
    Object.defineProperty(field.style, "height", {
      set(value: string) {
        field.clientWidth = value === "160px" ? 314 : 320;
        field.scrollTop = 0;
      },
    });
    resizeComposerField(textarea, overlay);
    expect(highlight.style.width).toBe("314px");
    expect(field.scrollTop).toBe(24);
    expect(highlight.scrollTop).toBe(24);
  });

  it("leaves hidden fields alone until they can be measured", () => {
    const { field, highlight, textarea, overlay } = elements();
    field.clientWidth = 0;
    resizeComposerField(textarea, overlay);
    expect(field.style.height).toBe("44px");
    expect(highlight.style.width).toBe("");
  });
});

describe("composer pane resizing", () => {
  let notify: () => void;
  let disconnect: ReturnType<typeof vi.fn>;
  let frames: Map<number, FrameRequestCallback>;
  let sequence: number;

  beforeEach(() => {
    frames = new Map();
    sequence = 0;
    disconnect = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          notify = callback;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.set(++sequence, callback);
      return sequence;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  });
  afterEach(() => vi.unstubAllGlobals());

  const flush = () => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(0));
  };

  it("coalesces width changes and ignores height-only notifications", () => {
    const { field, textarea, overlay } = elements();
    const stop = observeComposerSizing(textarea, () => overlay);
    field.scrollHeight = 130;
    notify();
    expect(frames.size).toBe(0);
    field.clientWidth = 240;
    notify();
    field.clientWidth = 220;
    notify();
    expect(frames.size).toBe(1);
    flush();
    expect(field.style.height).toBe("130px");
    expect(overlay.style.width).toBe("220px");
    notify();
    expect(frames.size).toBe(0);
    stop();
  });

  it("remeasures a hidden tab when it returns at its previous width", () => {
    const { field, textarea, overlay } = elements();
    const stop = observeComposerSizing(textarea, () => overlay);
    field.clientWidth = 0;
    notify();
    field.scrollHeight = 145;
    field.clientWidth = 320;
    notify();
    flush();
    expect(field.style.height).toBe("145px");
    stop();
  });

  it("disconnects and cancels pending layout work on unmount", () => {
    const { field, textarea, overlay } = elements();
    const stop = observeComposerSizing(textarea, () => overlay);
    field.clientWidth = 240;
    notify();
    expect(frames.size).toBe(1);
    stop();
    expect(disconnect).toHaveBeenCalledOnce();
    expect(frames.size).toBe(0);
  });
});
