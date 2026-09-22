import { normalizeProjectPath } from "./recents";
import type { SessionSummary } from "./sessionStore";

export type SidebarOrganization = "project" | "list";
const ORGANIZATION_KEY = "monocode.sidebarOrganization";
const COLLAPSED_KEY = "monocode.collapsedSidebarProjects";

export function loadSidebarOrganization(): SidebarOrganization {
  try {
    return localStorage.getItem(ORGANIZATION_KEY) === "list"
      ? "list"
      : "project";
  } catch {
    return "project";
  }
}
export function saveSidebarOrganization(value: SidebarOrganization) {
  try {
    localStorage.setItem(ORGANIZATION_KEY, value);
  } catch {
    /* Optional UI preference. */
  }
}
export function loadCollapsedSidebarProjects(): Set<string> {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(COLLAPSED_KEY) ?? "[]",
    );
    return new Set(
      Array.isArray(value)
        ? value
            .filter(
              (path): path is string =>
                typeof path === "string" && path.length > 0,
            )
            .map(normalizeProjectPath)
        : [],
    );
  } catch {
    return new Set();
  }
}
export function saveCollapsedSidebarProjects(paths: ReadonlySet<string>) {
  try {
    localStorage.setItem(
      COLLAPSED_KEY,
      JSON.stringify([...paths].map(normalizeProjectPath)),
    );
  } catch {
    /* Optional UI preference. */
  }
}

export function orderedSidebarSessions(
  rows: SessionSummary[],
): SessionSummary[] {
  return [...rows].sort(
    (a, b) => b.updatedAt - a.updatedAt || a.id.localeCompare(b.id),
  );
}

/** Bound initial rendering while keeping an externally selected older session visible. */
export function visibleSidebarSessions(
  rows: SessionSummary[],
  limit: number,
  activeId?: string,
) {
  const visible = rows.slice(0, Math.max(1, limit));
  const active = activeId ? rows.find((row) => row.id === activeId) : undefined;
  if (active && !visible.some((row) => row.id === active.id))
    visible.push(active);
  return { visible, remaining: rows.length - visible.length };
}
