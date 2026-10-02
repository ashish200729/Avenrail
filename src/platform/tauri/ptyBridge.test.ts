import { afterEach, beforeEach, expect, it, vi } from "vitest";

const native = vi.hoisted(() => ({ invoke: vi.fn(), listen: vi.fn() }));
vi.mock("@tauri-apps/api/core", () => ({ invoke: native.invoke }));
vi.mock("@tauri-apps/api/event", () => ({ listen: native.listen }));
let pty: typeof import("./pty");
beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();
  native.invoke.mockReset().mockResolvedValue(undefined);
  native.listen.mockReset();
  pty = await import("./pty");
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

it("does not reconnect event listeners for an already-cancelled launch", async () => {
  native.listen.mockResolvedValue(vi.fn());
  const controller = new AbortController();
  controller.abort();
  await expect(
    pty.spawnPty("cancelled", "/project", 80, 24, controller.signal),
  ).rejects.toThrow("Terminal launch cancelled");
  expect(native.listen).not.toHaveBeenCalled();
  expect(native.invoke).not.toHaveBeenCalled();
});

it("cleans up partial listener setup and permits a fresh terminal to recover", async () => {
  const stopData = vi.fn();
  native.listen
    .mockResolvedValueOnce(stopData)
    .mockRejectedValueOnce(new Error("events unavailable"));
  const closeFirst = pty.subscribePty("first", vi.fn(), vi.fn());
  await expect(pty.spawnPty("first", "/project", 80, 24)).rejects.toThrow(
    "events unavailable",
  );
  expect(stopData).toHaveBeenCalledTimes(1);

  const stopNextData = vi.fn();
  const stopNextExit = vi.fn();
  native.listen
    .mockResolvedValueOnce(stopNextData)
    .mockResolvedValueOnce(stopNextExit);
  const closeSecond = pty.subscribePty("second", vi.fn(), vi.fn());
  await expect(
    pty.spawnPty("second", "/project", 80, 24),
  ).resolves.toBeUndefined();
  expect(native.invoke).toHaveBeenCalledExactlyOnceWith("pty_spawn", {
    id: "second",
    cwd: "/project",
    cols: 80,
    rows: 24,
  });
  closeFirst();
  closeSecond();
  await vi.runAllTimersAsync();
  expect(stopNextData).toHaveBeenCalledTimes(1);
  expect(stopNextExit).toHaveBeenCalledTimes(1);
});

it("removes a listener that resolves after its companion has already failed", async () => {
  let install!: (unlisten: () => void) => void;
  const stopLate = vi.fn();
  native.listen
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          install = resolve;
        }),
    )
    .mockRejectedValueOnce(new Error("exit listener failed"));
  const close = pty.subscribePty("terminal", vi.fn(), vi.fn());
  await expect(pty.spawnPty("terminal", "/project", 80, 24)).rejects.toThrow(
    "exit listener failed",
  );
  install(stopLate);
  await Promise.resolve();
  expect(stopLate).toHaveBeenCalledTimes(1);
  close();
  await vi.runAllTimersAsync();
});
