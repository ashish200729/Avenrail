import { MASCOT_GRID, projectMascot } from "../model/projectMascots";

type Props = {
  project: string;
  /** Project color; omit to inherit the surrounding text color. */
  color?: string;
  /** Explicit pick from the project menu; falls back to the hashed one. */
  name?: string | null;
  className?: string;
  /** Cycles the mascot's two frames while a turn is in flight. */
  active?: boolean;
};

/**
 * Pixel mascot standing in for the project's color dot, seated on a soft chip
 * of the project color so it reads as an app icon rather than a loose sprite.
 * The chip adds 2px on every side of `className`'s size.
 */
export function ProjectMascot({
  project,
  color,
  name,
  className = "size-3 shrink-0",
  active = false,
}: Props) {
  const mascot = projectMascot(project, name);
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${MASCOT_GRID} ${MASCOT_GRID}`}
      shapeRendering="crispEdges"
      className={`box-content rounded-[5px] p-0.5 ${className}`}
      fill="currentColor"
      style={{
        ...(color ? { color } : undefined),
        backgroundColor: "color-mix(in srgb, currentColor 14%, transparent)",
      }}
    >
      {active ? (
        <g className="mascot-active">
          <path className="mascot-rest" d={mascot.restPath} />
          <path className="mascot-talk" d={mascot.talkPath} />
        </g>
      ) : (
        <path d={mascot.restPath} />
      )}
    </svg>
  );
}
