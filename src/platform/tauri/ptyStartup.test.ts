import { expect, it, vi } from "vitest";
const bridge = vi.hoisted(() => ({ invoke: vi.fn(), listen: vi.fn() }));
vi.mock("@tauri-apps/api/core", () => ({ invoke: bridge.invoke }));
vi.mock("@tauri-apps/api/event", () => ({ listen: bridge.listen }));
import { spawnPty, subscribePty } from "./pty";

it("waits for both event subscriptions before launching a shell", async () => {
  vi.useFakeTimers();
  let resolveData!: (stop: () => void) => void;
  let resolveExit!: (stop: () => void) => void;
  const stopData = vi.fn();
  const stopExit = vi.fn();
  bridge.listen.mockImplementation(
    (event) =>
      new Promise((resolve) => {
        if (event === "pty-data") resolveData = resolve;
        else resolveExit = resolve;
      }),
  );
  bridge.invoke.mockResolvedValue(undefined);
  const unsubscribe = subscribePty("terminal", vi.fn(), vi.fn());
  try {
    const pending = spawnPty("terminal", "/project", 80, 24);
    resolveData(stopData);
    await Promise.resolve();
    expect(bridge.invoke).not.toHaveBeenCalled();
    resolveExit(stopExit);
    await pending;
    expect(bridge.invoke).toHaveBeenCalledExactlyOnceWith("pty_spawn", {
      id: "terminal",
      cwd: "/project",
      cols: 80,
      rows: 24,
    });
  } finally {
    unsubscribe();
    await vi.runAllTimersAsync();
    vi.useRealTimers();
  }
  expect(stopData).toHaveBeenCalledTimes(1);
  expect(stopExit).toHaveBeenCalledTimes(1);
});

it("does not launch an orphan shell when its view closes during listener setup", async () => {
  vi.useFakeTimers();
  bridge.invoke.mockClear();
  const ready: Array<(stop: () => void) => void> = [];
  bridge.listen.mockImplementation(
    () => new Promise((resolve) => ready.push(resolve)),
  );
  const unsubscribe = subscribePty("closed-terminal", vi.fn(), vi.fn());
  const controller = new AbortController();
  try {
    const launch = spawnPty(
      "closed-terminal",
      "/project",
      80,
      24,
      controller.signal,
    );
    controller.abort();
    for (const resolve of ready) resolve(vi.fn());
    await expect(launch).rejects.toThrow("Terminal launch cancelled");
    expect(bridge.invoke).not.toHaveBeenCalled();
  } finally {
    unsubscribe();
    await vi.runAllTimersAsync();
    vi.useRealTimers();
  }
});
