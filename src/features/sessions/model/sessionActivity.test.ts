import { afterEach, describe, expect, it, vi } from "vitest";
import { newSession } from "./session";
import { sessionActivityAt, touchSessionActivity } from "./sessionActivity";
import {
  appendUser,
  appendSteerUser,
  applyHarnessEvent,
  applyHarnessEvents,
  stopStreaming,
} from "../../../integrations/harness/core/apply";

afterEach(() => vi.restoreAllMocks());

describe("session activity", () => {
  it("records creation once and only advances for conversation activity", () => {
    const clock = vi.spyOn(Date, "now").mockReturnValue(1000);
    let session = newSession("codex", "/repo");
    expect([session.createdAt, sessionActivityAt(session)]).toEqual([
      1000, 1000,
    ]);
    clock.mockReturnValue(2000);
    session = appendUser(session, "Start");
    expect(sessionActivityAt(session)).toBe(2000);
    clock.mockReturnValue(3000);
    session = applyHarnessEvents(session, [
      { type: "message.delta", text: "Working" },
      { type: "message.delta", text: "." },
    ]);
    expect(sessionActivityAt(session)).toBe(3000);
    clock.mockReturnValue(4000);
    const configured = applyHarnessEvent(session, {
      type: "session.configChanged",
      model: "other",
    });
    expect(sessionActivityAt(configured)).toBe(3000);
    expect(applyHarnessEvents(configured, [])).toBe(configured);
    clock.mockReturnValue(5000);
    session = appendSteerUser(configured, "Follow up");
    expect(sessionActivityAt(session)).toBe(5000);
    expect(session.blocks.at(-1)?.startedAt).toBeUndefined();
    session = stopStreaming(session, 6000);
    expect(sessionActivityAt(session)).toBe(6000);
    expect(sessionActivityAt(stopStreaming(session, 9000))).toBe(6000);
    expect(session.createdAt).toBe(1000);
  });

  it("does not move backwards when the clock changes or timestamps are invalid", () => {
    const session = { ...newSession(), createdAt: 1000, updatedAt: 2000 };
    expect(touchSessionActivity(session, 1500)).toBe(session);
    expect(touchSessionActivity(session, Infinity)).toBe(session);
    expect(touchSessionActivity(session, NaN)).toBe(session);
    expect(sessionActivityAt({ ...session, updatedAt: Infinity })).toBe(1000);
  });

  it("recovers activity from turn timestamps in older transferred snapshots", () => {
    const session = {
      ...newSession(),
      createdAt: undefined,
      updatedAt: undefined,
      blocks: [
        {
          id: "user",
          role: "user" as const,
          text: "Old turn",
          startedAt: 1000,
          durationMs: 500,
        },
      ],
    };
    expect(sessionActivityAt(session)).toBe(1500);
  });
});
