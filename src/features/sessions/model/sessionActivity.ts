import type { Session } from "./session";

function timestamp(value: number | undefined): number {
  return value != null && Number.isFinite(value) && value >= 0 ? value : 0;
}

/** Activity is recorded when content changes, never when a list renders. */
export function sessionActivityAt(session: Session): number {
  const recorded = Math.max(
    timestamp(session.createdAt),
    timestamp(session.updatedAt),
  );
  if (recorded > 0) return recorded;
  // Older transferred snapshots may predate runtime activity fields.
  return session.blocks.reduce((latest, block) => {
    const start = timestamp(block.startedAt);
    return Math.max(latest, timestamp(start + timestamp(block.durationMs)));
  }, 0);
}

export function touchSessionActivity(
  session: Session,
  now = Date.now(),
): Session {
  const updatedAt = Math.max(sessionActivityAt(session), timestamp(now));
  return session.updatedAt === updatedAt ? session : { ...session, updatedAt };
}
