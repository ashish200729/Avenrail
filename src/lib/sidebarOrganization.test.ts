import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { newSession } from "./session";
import { summaryFromSession } from "./sessionHistory";
import {
  loadCollapsedSidebarProjects,
  loadSidebarOrganization,
  orderedSidebarSessions,
  saveCollapsedSidebarProjects,
  saveSidebarOrganization,
  visibleSidebarSessions,
} from "./sidebarOrganization";

describe("sidebar organization preferences", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("defaults to grouped projects and remembers the chosen layout", () => {
    expect(loadSidebarOrganization()).toBe("project");
    saveSidebarOrganization("list");
    expect(loadSidebarOrganization()).toBe("list");
    saveSidebarOrganization("project");
    expect(loadSidebarOrganization()).toBe("project");
  });

  it("retains independent collapsed projects across layout changes", () => {
    saveCollapsedSidebarProjects(new Set(["/projects/one/", "/projects/two"]));
    saveSidebarOrganization("list");
    saveSidebarOrganization("project");
    expect(loadCollapsedSidebarProjects()).toEqual(
      new Set(["/projects/one", "/projects/two"]),
    );
    saveCollapsedSidebarProjects(new Set(["/projects/two"]));
    expect(loadCollapsedSidebarProjects()).toEqual(new Set(["/projects/two"]));
  });

  it("ignores corrupt and obsolete preferences", () => {
    localStorage.setItem("monocode.sidebarOrganization", "unknown");
    localStorage.setItem("monocode.collapsedSidebarProjects", "{");
    expect(loadSidebarOrganization()).toBe("project");
    expect(loadCollapsedSidebarProjects().size).toBe(0);
    localStorage.setItem(
      "monocode.collapsedSidebarProjects",
      '[null, 3, "", "/one/", "/one"]',
    );
    expect(loadCollapsedSidebarProjects()).toEqual(new Set(["/one"]));
  });

  it("continues without preference storage", () => {
    vi.stubGlobal("localStorage", {
      getItem() {
        throw Error("denied");
      },
      setItem() {
        throw Error("full");
      },
    });
    expect(loadSidebarOrganization()).toBe("project");
    expect(loadCollapsedSidebarProjects().size).toBe(0);
    expect(() => {
      saveSidebarOrganization("list");
      saveCollapsedSidebarProjects(new Set(["/one"]));
    }).not.toThrow();
  });
});

describe("sidebar session ordering", () => {
  const rows = [1, 2, 3, 4, 5, 6, 7].map((updatedAt) => ({
    ...summaryFromSession(newSession("codex", updatedAt % 2 ? "/one" : "/two")),
    id: `session-${updatedAt}`,
    updatedAt,
  }));

  it("orders sessions across projects without mutating cached history", () => {
    expect(orderedSidebarSessions(rows).map((row) => row.updatedAt)).toEqual([
      7, 6, 5, 4, 3, 2, 1,
    ]);
    expect(rows[0].updatedAt).toBe(1);
  });

  it("keeps an externally selected older session visible beyond the initial limit", () => {
    const result = visibleSidebarSessions(
      orderedSidebarSessions(rows),
      5,
      "session-1",
    );
    expect(result.visible.map((row) => row.updatedAt)).toEqual([
      7, 6, 5, 4, 3, 1,
    ]);
    expect(result.remaining).toBe(1);
  });

  it("does not duplicate the selected row and exposes all rows after show more", () => {
    expect(visibleSidebarSessions(rows, 5, "session-1").visible).toHaveLength(
      5,
    );
    expect(visibleSidebarSessions(rows, 25, "session-1")).toEqual({
      visible: rows,
      remaining: 0,
    });
    expect(visibleSidebarSessions([], 5)).toEqual({
      visible: [],
      remaining: 0,
    });
  });
});
