import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const bridge = vi.hoisted(() => ({
  listeners: new Map<string, (event: { payload: unknown }) => void>(),
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => bridge.invoke(...args),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: async (
    name: string,
    handler: (event: { payload: unknown }) => void,
  ) => {
    bridge.listeners.set(name, handler);
    return () => bridge.listeners.delete(name);
  },
}));

import {
  isCurrentChildExit,
  spawnChild,
  startHarnessBridge,
  unwatchChild,
  watchChild,
} from "./child";

describe("child exit generations", () => {
  beforeEach(() => {
    bridge.invoke.mockReset();
  });

  afterEach(async () => {
    unwatchChild("fast");
    unwatchChild("replace");
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it("ignores an exit before this session has a live pid", () => {
    expect(isCurrentChildExit(undefined, 41)).toBe(false);
  });

  it("ignores the previous child's exit after a handoff spawn", () => {
    expect(isCurrentChildExit(42, 41)).toBe(false);
  });

  it("accepts the live child's own exit", () => {
    expect(isCurrentChildExit(42, 42)).toBe(true);
  });

  it("delivers an exit that arrives before harness_spawn returns", async () => {
    let finishSpawn!: (pid: number) => void;
    bridge.invoke.mockImplementation(
      () =>
        new Promise<number>((resolve) => {
          finishSpawn = resolve;
        }),
    );
    const stopBridge = startHarnessBridge();
    const exits: Array<number | null> = [];
    watchChild("fast", () => undefined, (code) => exits.push(code));

    const spawning = spawnChild("fast", "/fake/codex", ["app-server"], "/repo");
    bridge.listeners.get("harness-exit")?.({
      payload: { sessionId: "fast", code: 127, pid: 91 },
    });
    finishSpawn(91);
    await spawning;

    expect(exits).toEqual([127]);
    stopBridge();
  });

  it("does not deliver the previous child's exit during replacement", async () => {
    bridge.invoke.mockResolvedValueOnce(41);
    const stopBridge = startHarnessBridge();
    const exits: Array<number | null> = [];
    watchChild("replace", () => undefined, (code) => exits.push(code));
    await spawnChild("replace", "/fake/codex", ["app-server"], "/repo");

    let finishReplacement!: (pid: number) => void;
    bridge.invoke.mockImplementationOnce(
      () =>
        new Promise<number>((resolve) => {
          finishReplacement = resolve;
        }),
    );
    const replacing = spawnChild(
      "replace",
      "/fake/codex",
      ["app-server"],
      "/repo",
    );
    bridge.listeners.get("harness-exit")?.({
      payload: { sessionId: "replace", code: 0, pid: 41 },
    });
    finishReplacement(42);
    await replacing;
    expect(exits).toEqual([]);

    bridge.listeners.get("harness-exit")?.({
      payload: { sessionId: "replace", code: 1, pid: 42 },
    });
    expect(exits).toEqual([1]);
    stopBridge();
  });
});
