import { describe, expect, it, vi } from "vitest";
import { createTerminalStartup } from "./terminalStartup";

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

describe("terminal startup and sizing", () => {
  it("still applies a newer requested size when an older resize fails", async () => {
    const pending = deferred();
    const resize = vi
      .fn()
      .mockImplementationOnce(() => pending.promise)
      .mockResolvedValue(undefined);
    const startup = createTerminalStartup({
      spawn: vi.fn().mockResolvedValue(undefined),
      resize,
      onError: vi.fn(),
    });
    await startup.setSize(80, 24);
    const first = startup.setSize(90, 30);
    await startup.setSize(100, 40);
    pending.reject(new Error("temporary failure"));
    await first;
    expect(resize.mock.calls).toEqual([
      [90, 30],
      [100, 40],
    ]);
  });
  it("retries the requested size after a transient resize failure", async () => {
    const resize = vi
      .fn()
      .mockRejectedValueOnce(new Error("temporary failure"))
      .mockResolvedValue(undefined);
    const startup = createTerminalStartup({
      spawn: vi.fn().mockResolvedValue(undefined),
      resize,
      onError: vi.fn(),
    });
    await startup.setSize(80, 24);
    await startup.setSize(100, 30);
    await startup.setSize(100, 30);
    expect(resize.mock.calls).toEqual([
      [100, 30],
      [100, 30],
    ]);
  });
  it("starts once and applies the latest size after a slow launch", async () => {
    const pending = deferred();
    const spawn = vi.fn(() => pending.promise);
    const resize = vi.fn().mockResolvedValue(undefined);
    const startup = createTerminalStartup({ spawn, resize, onError: vi.fn() });
    const first = startup.setSize(80, 24);
    await startup.setSize(90, 30);
    await startup.setSize(100, 40);
    expect(spawn).toHaveBeenCalledExactlyOnceWith(80, 24);
    expect(resize).not.toHaveBeenCalled();
    pending.resolve();
    await first;
    expect(resize).toHaveBeenCalledExactlyOnceWith(100, 40);
    await startup.setSize(100, 40);
    expect(spawn).toHaveBeenCalledTimes(1);
    expect(resize).toHaveBeenCalledTimes(1);
  });

  it("does not retry a failed launch when error output renders or the pane resizes", async () => {
    const failure = new Error("shell unavailable");
    const spawn = vi.fn().mockRejectedValue(failure);
    const resize = vi.fn();
    const onError = vi.fn();
    const startup = createTerminalStartup({ spawn, resize, onError });
    await startup.setSize(80, 24);
    await startup.setSize(80, 24);
    await startup.setSize(120, 40);
    expect(spawn).toHaveBeenCalledTimes(1);
    expect(resize).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledExactlyOnceWith(failure, "start");
    expect(startup.acceptsInput()).toBe(false);
  });

  it("does not revive a shell that exited before the launch response arrived", async () => {
    const pending = deferred();
    const resize = vi.fn();
    const startup = createTerminalStartup({
      spawn: () => pending.promise,
      resize,
      onError: vi.fn(),
    });
    const launch = startup.setSize(80, 24);
    startup.exit();
    pending.resolve();
    await launch;
    await startup.setSize(100, 30);
    expect(startup.isRunning()).toBe(false);
    expect(startup.acceptsInput()).toBe(false);
    expect(resize).not.toHaveBeenCalled();
  });

  it("does not touch a disposed terminal after a delayed launch failure", async () => {
    const pending = deferred();
    const onError = vi.fn();
    const resize = vi.fn();
    const startup = createTerminalStartup({
      spawn: () => pending.promise,
      resize,
      onError,
    });
    const launch = startup.setSize(80, 24);
    startup.dispose();
    pending.reject(new Error("cancelled"));
    await launch;
    expect(onError).not.toHaveBeenCalled();
    expect(resize).not.toHaveBeenCalled();
  });

  it("serializes resizes so an older reply cannot overwrite the newest dimensions", async () => {
    const pending = deferred();
    const resize = vi
      .fn()
      .mockImplementationOnce(() => pending.promise)
      .mockResolvedValue(undefined);
    const startup = createTerminalStartup({
      spawn: vi.fn().mockResolvedValue(undefined),
      resize,
      onError: vi.fn(),
    });
    await startup.setSize(80, 24);
    const firstResize = startup.setSize(90, 30);
    await startup.setSize(100, 40);
    await startup.setSize(110, 50);
    expect(resize).toHaveBeenCalledExactlyOnceWith(90, 30);
    pending.resolve();
    await firstResize;
    expect(resize.mock.calls).toEqual([
      [90, 30],
      [110, 50],
    ]);
  });

  it("keeps a live shell usable when resize fails, without an unhandled rejection", async () => {
    const onError = vi.fn();
    const failure = new Error("resize failed");
    const startup = createTerminalStartup({
      spawn: vi.fn().mockResolvedValue(undefined),
      resize: vi.fn().mockRejectedValue(failure),
      onError,
    });
    await startup.setSize(80, 24);
    await startup.setSize(100, 30);
    expect(onError).toHaveBeenCalledExactlyOnceWith(failure, "resize");
    expect(startup.isRunning()).toBe(true);
  });
});
