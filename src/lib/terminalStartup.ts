type Size = { cols: number; rows: number };
type Phase = "idle" | "starting" | "running" | "failed" | "exited" | "disposed";

/** One shell launch per mounted view. Resizing must never retry a failed launch. */
export function createTerminalStartup({
  spawn,
  resize,
  onError,
}: {
  spawn: (cols: number, rows: number) => Promise<void>;
  resize: (cols: number, rows: number) => Promise<void>;
  onError: (error: unknown, operation: "start" | "resize") => void;
}) {
  let phase: Phase = "idle";
  let desired: Size | null = null;
  let applied: Size | null = null;
  let resizing = false;
  const flush = async () => {
    if (phase !== "running" || resizing) return;
    resizing = true;
    try {
      while (
        phase === "running" &&
        desired &&
        (desired.cols !== applied?.cols || desired.rows !== applied?.rows)
      ) {
        const size = desired;
        try {
          await resize(size.cols, size.rows);
          applied = size;
        } catch (error) {
          if (phase === "running") onError(error, "resize");
          // Do not loop on a failed size, but do apply a newer size requested
          // while the failed IPC call was pending.
          if (desired.cols === size.cols && desired.rows === size.rows) break;
        }
      }
    } finally {
      resizing = false;
    }
  };
  return {
    isRunning: () => phase === "running",
    acceptsInput: () => phase === "running" || phase === "starting",
    exit() {
      phase = "exited";
    },
    dispose() {
      phase = "disposed";
    },
    async setSize(cols: number, rows: number) {
      desired = { cols, rows };
      if (phase === "idle") {
        phase = "starting";
        applied = desired;
        try {
          await spawn(cols, rows);
          if (phase !== "starting") return;
          phase = "running";
        } catch (error) {
          if (phase !== "starting") return;
          phase = "failed";
          onError(error, "start");
          return;
        }
      }
      await flush();
    },
  };
}
