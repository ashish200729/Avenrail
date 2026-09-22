import { describe, expect, it } from "vitest";
import {
  composerControlsRequiredWidth,
  composerOptionsPlacement,
  shouldGroupComposerOptions,
} from "./composerOptions";

describe("composer overflow decisions", () => {
  it("keeps options inline when the measured toolbar fits, and groups when it does not", () => {
    const required = composerControlsRequiredWidth(150, 205, [26, 26], 4);
    expect(required).toBe(419);
    expect(shouldGroupComposerOptions(680, required, true)).toBe(false);
    expect(shouldGroupComposerOptions(320, required, false)).toBe(true);
  });
  it("returns to inline mode on widening without chattering around the boundary", () => {
    expect(shouldGroupComposerOptions(419, 419, false)).toBe(false);
    expect(shouldGroupComposerOptions(420, 419, true)).toBe(true);
    expect(shouldGroupComposerOptions(432, 419, true)).toBe(false);
  });
  it("reserves both send and stop buttons during a running turn", () => {
    const idle = composerControlsRequiredWidth(150, 160, [26, 26], 4);
    const running = composerControlsRequiredWidth(150, 160, [26, 56], 4);
    expect(shouldGroupComposerOptions(380, idle, false)).toBe(false);
    expect(shouldGroupComposerOptions(380, running, false)).toBe(true);
  });
  it("accounts for absent secondary controls and preserves hidden-pane state", () => {
    expect(composerControlsRequiredWidth(150, 0, [26, 26], 4)).toBe(210);
    expect(shouldGroupComposerOptions(0, 400, false)).toBe(false);
    expect(shouldGroupComposerOptions(0, 400, true)).toBe(true);
  });
});

describe("composer options placement", () => {
  it("opens above a bottom-docked composer without crossing the viewport edges", () => {
    const result = composerOptionsPlacement(
      { right: 740, top: 550, bottom: 576 },
      { width: 800, height: 600 },
    );
    expect(result.left).toBe(420);
    expect(result.bottom).toBe(56);
    expect(result.maxHeight).toBe(440);
    expect(result.top).toBeUndefined();
  });

  it("opens below a composer near the top and clamps the left edge", () => {
    const result = composerOptionsPlacement(
      { right: 100, top: 30, bottom: 56 },
      { width: 800, height: 600 },
    );
    expect(result.left).toBe(8);
    expect(result.top).toBe(62);
    expect(result.bottom).toBeUndefined();
    expect(result.top! + result.maxHeight).toBeLessThanOrEqual(592);
  });

  it("fits short and narrow windows instead of clipping settings off-screen", () => {
    const result = composerOptionsPlacement(
      { right: 240, top: 140, bottom: 166 },
      { width: 240, height: 200 },
    );
    expect(result.width).toBe(224);
    expect(result.left).toBe(8);
    expect(result.maxHeight).toBe(126);
    expect(result.bottom).toBe(66);
  });

  it("keeps the popup in view if a resize moves the anchor outside the viewport", () => {
    const result = composerOptionsPlacement(
      { right: 980, top: 800, bottom: 826 },
      { width: 800, height: 600 },
    );
    expect(result.left + result.width).toBeLessThanOrEqual(792);
    expect(result.bottom).toBeGreaterThanOrEqual(8);
    expect(result.maxHeight).toBeGreaterThan(0);
  });
});
