import type { HarnessId } from "../model/session";
import { HarnessIcon } from "./HarnessIcon";

export type SessionMarkState = "idle" | "working" | "done" | "approval";

/**
 * Provider mark for a session row. The artwork carries its own padding, so an
 * 18px slot paints roughly a 14px glyph: large enough to read, small enough to
 * stay quiet beside the title. Resting rows are slightly muted so the open or
 * active session is the one that draws the eye; any live state restores full
 * colour. `state` is exposed for styling hooks and tests, not for decoration.
 */
export function SessionMark({
  harness,
  state,
  emphasized,
}: {
  harness: HarnessId;
  state: SessionMarkState;
  emphasized: boolean;
}) {
  const resting = state === "idle" && !emphasized;
  return (
    <span
      data-session-badge={state}
      className="grid size-[18px] shrink-0 place-items-center"
    >
      <HarnessIcon
        harness={harness}
        className={`size-[18px] transition-[opacity,filter] duration-150 ${
          resting
            ? "opacity-70 saturate-[0.7] group-hover:opacity-100 group-hover:saturate-100"
            : ""
        }`}
      />
    </span>
  );
}
