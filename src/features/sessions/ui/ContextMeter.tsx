import { useId, useRef, useState } from "react";
import {
  contextRatio,
  contextTooltip,
  type ContextUsage,
} from "../model/contextUsage";
import { Popover } from "../../../shared/ui/Popover";

const SIZE = 14;
const STROKE = 2;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Ring turns amber then red as the window fills. */
function ringClass(ratio: number): string {
  if (ratio >= 0.9) return "text-red-700 dark:text-red-400";
  if (ratio >= 0.75) return "text-amber-700 dark:text-amber-400";
  return "text-content/65";
}

/**
 * Circular gauge for how full the model context window is.
 *
 * Renders nothing until the harness reports both halves — Cursor's ACP stream
 * carries no usage at all, and a ring guessing at a number is worse than no
 * ring.
 */
export function ContextMeter({
  usage,
  onCompact,
  compactDisabled = false,
}: {
  usage?: ContextUsage;
  onCompact?: () => void;
  compactDisabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const popoverId = useId();
  const root = useRef<HTMLDivElement>(null);
  const ratio = contextRatio(usage);
  if (!usage || ratio === null) return null;

  const { headline, detail } = contextTooltip(usage);
  const actionsOpen = open && onCompact != null;

  return (
    <div
      ref={root}
      data-context-meter
      className="relative grid size-7 shrink-0 place-items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {onCompact ? (
        <button
          type="button"
          title="Context usage"
          aria-label={`${headline}, ${detail}. Open context actions`}
          aria-expanded={actionsOpen}
          aria-controls={actionsOpen ? popoverId : undefined}
          onClick={() => setOpen((value) => !value)}
          className="grid size-7 place-items-center rounded-md hover:bg-content/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <MeterRing ratio={ratio} />
        </button>
      ) : (
        <div
          role="img"
          aria-label={`${headline}, ${detail}`}
          tabIndex={0}
          title={`${headline}, ${detail}`}
          className="grid size-7 place-items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <MeterRing ratio={ratio} />
        </div>
      )}
      {hovered || focused || actionsOpen ? (
        <Popover
          id={popoverId}
          anchor={root}
          side="top"
          align="end"
          onDismiss={
            actionsOpen
              ? (reason) => {
                  setOpen(false);
                  if (reason === "escape") {
                    root.current?.querySelector("button")?.focus();
                  }
                }
              : undefined
          }
          className={`w-max px-2.5 py-1.5 ${actionsOpen ? "" : "pointer-events-none"}`}
        >
          <div className="text-[12px] leading-4 text-content">{headline}</div>
          <div className="text-[12px] leading-4 text-content/65">{detail}</div>
          {actionsOpen ? (
            <button
              type="button"
              disabled={compactDisabled}
              title={
                compactDisabled
                  ? "Wait for the current operation to finish"
                  : "Compact this conversation's context"
              }
              onClick={() => {
                setOpen(false);
                root.current?.querySelector("button")?.focus();
                onCompact?.();
              }}
              className="mt-1.5 w-full rounded-md bg-content/10 px-2 py-1 text-[12px] text-content hover:bg-content/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              Compact now
            </button>
          ) : null}
        </Popover>
      ) : null}
    </div>
  );
}

function MeterRing({ ratio }: { ratio: number }) {
  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={ringClass(ratio)}
      aria-hidden="true"
    >
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE}
        className="opacity-25"
      />
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE * (1 - ratio)}
        transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
      />
    </svg>
  );
}
