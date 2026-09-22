import { beforeEach, describe, expect, it, vi } from "vitest";
import { newSession } from "./session";
import {
  deleteSession,
  setSessionArchived,
  upsertSession,
} from "./sessionStore";

const bridge = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@tauri-apps/api/core", () => ({ invoke: bridge.invoke }));
beforeEach(() => {
  bridge.invoke.mockReset();
});

function savedSession() {
  const session = newSession("codex", "/project");
  session.blocks = [{ id: "user", role: "user", text: "hello" }];
  return session;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

describe("session write ordering and failures", () => {
  it("finishes queued saves before deletion and prevents late snapshots from recreating the session", async () => {
    const session = savedSession();
    const save = deferred<unknown>();
    const started = deferred<void>();
    bridge.invoke.mockImplementation((command) => {
      if (command === "session_upsert") {
        started.resolve();
        return save.promise;
      }
      return Promise.resolve();
    });
    const first = upsertSession(session);
    await started.promise;
    const deletion = deleteSession(session.id);
    const late = upsertSession({ ...session, title: "Late snapshot" });
    expect(bridge.invoke.mock.calls.map(([command]) => command)).toEqual([
      "session_upsert",
    ]);
    save.resolve({ ...session, createdAt: 1, updatedAt: 1 });
    await Promise.all([first, deletion]);
    expect(await late).toBeNull();
    expect(await upsertSession(session)).toBeNull();
    expect(bridge.invoke.mock.calls.map(([command]) => command)).toEqual([
      "session_upsert",
      "session_delete",
    ]);
  });

  it("preserves errors and resumes saving if deletion fails", async () => {
    const session = savedSession();
    const failure = new Error("database locked");
    bridge.invoke.mockImplementation((command) =>
      command === "session_delete"
        ? Promise.reject(failure)
        : Promise.resolve({ ...session, createdAt: 1, updatedAt: 1 }),
    );
    const deletion = deleteSession(session.id);
    const save = upsertSession(session);
    await expect(deletion).rejects.toBe(failure);
    expect(await save).toMatchObject({ id: session.id });
    bridge.invoke.mockResolvedValue(undefined);
    await expect(deleteSession(session.id)).resolves.toBeUndefined();
    expect(bridge.invoke.mock.calls.map(([command]) => command)).toEqual([
      "session_delete",
      "session_upsert",
      "session_delete",
    ]);
  });

  it("allows deleting a record even when an older save failed", async () => {
    const session = savedSession();
    bridge.invoke
      .mockRejectedValueOnce(new Error("save failed"))
      .mockResolvedValueOnce(undefined);
    const save = upsertSession(session);
    const deletion = deleteSession(session.id);
    await expect(save).rejects.toThrow("save failed");
    await expect(deletion).resolves.toBeUndefined();
  });

  it("orders archive after saves and propagates archive errors for the UI", async () => {
    const session = savedSession();
    const save = deferred<unknown>();
    const started = deferred<void>();
    bridge.invoke.mockImplementation((command) => {
      if (command === "session_upsert") {
        started.resolve();
        return save.promise;
      }
      return Promise.reject(new Error("archive failed"));
    });
    const pending = upsertSession(session);
    await started.promise;
    const archive = setSessionArchived(session.id, true);
    const rejected = expect(archive).rejects.toThrow("archive failed");
    expect(bridge.invoke).toHaveBeenCalledTimes(1);
    save.resolve({ ...session, createdAt: 1, updatedAt: 1 });
    await pending;
    await rejected;
    expect(bridge.invoke.mock.calls.map(([command]) => command)).toEqual([
      "session_upsert",
      "session_set_archived",
    ]);
  });
});
