import type { Session } from "./session";
import { getSession } from "./sessionStore";

/** A delayed history read must never navigate over a more recent user action. */
export function createSessionSelection(readSession = getSession) {
  let generation = 0;
  return {
    invalidate() {
      generation += 1;
    },
    async load(id: string, apply: (session: Session | null) => void) {
      const request = ++generation;
      const session = await readSession(id).catch(() => null);
      if (request === generation) apply(session);
    },
  };
}
