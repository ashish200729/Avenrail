import { describe, expect, it, vi } from "vitest";
import { newSession, type Session } from "./session";
import { createSessionSelection } from "./sessionSelection";

function deferred() {
  let resolve!: (value: Session | null) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<Session | null>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

describe("saved-session navigation", () => {
  it("keeps the latest selection when project reads finish out of order", async () => {
    const a = deferred();
    const b = deferred();
    const selection = createSessionSelection((id) =>
      id === "a" ? a.promise : b.promise,
    );
    const navigate = vi.fn();
    const first = selection.load("a", navigate);
    const latest = selection.load("b", navigate);
    const session = newSession("codex", "/second-project");
    b.resolve(session);
    await latest;
    a.resolve(newSession("codex", "/first-project"));
    await first;
    expect(navigate).toHaveBeenCalledExactlyOnceWith(session);
  });

  it("does not replace a new draft, open tab, or global view after navigation away", async () => {
    const pending = deferred();
    const selection = createSessionSelection(() => pending.promise);
    const navigate = vi.fn();
    const load = selection.load("saved", navigate);
    selection.invalidate();
    pending.resolve(newSession("codex", "/project"));
    await load;
    expect(navigate).not.toHaveBeenCalled();
  });

  it("opens a double-clicked closed session only once", async () => {
    const pending = deferred();
    const selection = createSessionSelection(() => pending.promise);
    const navigate = vi.fn();
    const first = selection.load("same", navigate);
    const second = selection.load("same", navigate);
    pending.resolve(newSession("codex", "/project"));
    await Promise.all([first, second]);
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it("ignores failures from obsolete reads without refreshing the new selection", async () => {
    const pending = deferred();
    const selection = createSessionSelection(() => pending.promise);
    const apply = vi.fn();
    const load = selection.load("old", apply);
    selection.invalidate();
    pending.reject(new Error("read failed"));
    await load;
    expect(apply).not.toHaveBeenCalled();
  });

  it("allows missing sessions to refresh history and subsequent reads to recover", async () => {
    const session = newSession("codex", "/project");
    const read = vi
      .fn()
      .mockRejectedValueOnce(new Error("unavailable"))
      .mockResolvedValueOnce(session);
    const selection = createSessionSelection(read);
    const apply = vi.fn();
    await selection.load("saved", apply);
    expect(apply).toHaveBeenLastCalledWith(null);
    await selection.load("saved", apply);
    expect(apply).toHaveBeenLastCalledWith(session);
  });
});
