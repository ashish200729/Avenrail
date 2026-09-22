import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadTranscriptLayout,
  loadTranscriptZen,
  saveTranscriptLayout,
  saveTranscriptZen,
  toggleTranscriptZen,
  TRANSCRIPT_LAYOUT_DEFAULT,
  TRANSCRIPT_ZEN_DEFAULT,
  loadSidebarOpen,
  loadSidebarLayout,
  loadProjectRailWidth,
  loadWorkspacePanelOpen,
  loadWorkspacePanelTab,
  loadWorkspacePanelWidth,
  saveSidebarOpen,
  saveWorkspacePanelOpen,
  saveWorkspacePanelTab,
  saveWorkspacePanelWidth,
  PROJECT_RAIL_WIDTH_MIN,
  WORKSPACE_PANEL_WIDTH_DEFAULT,
  WORKSPACE_PANEL_WIDTH_MIN,
  WORKSPACE_PANEL_WIDTH_MAX,
} from "./appearance";

const KEY = "monocode.transcriptLayout";
const ZEN_KEY = "monocode.transcriptZen";

describe("fixed Deck workspace layout", () => {
  beforeEach(mockLocalStorage);
  afterEach(() => vi.restoreAllMocks());

  it("normalizes saved Classic and invalid preferences to Deck", () => {
    for (const saved of ["classic", "unknown", "deck"]) {
      localStorage.setItem("monocode.sidebarLayout", saved);
      expect(loadSidebarLayout()).toBe("deck");
      expect(localStorage.getItem("monocode.sidebarLayout")).toBe("deck");
    }
  });

  it("defaults to Deck and leaves transcript and panel preferences unchanged", () => {
    saveTranscriptLayout("chat");
    saveWorkspacePanelOpen(false);
    expect(loadSidebarLayout()).toBe("deck");
    expect(loadTranscriptLayout()).toBe("chat");
    expect(loadWorkspacePanelOpen()).toBe(false);
  });

  it("still uses Deck when preference storage cannot be read or written", () => {
    localStorage.setItem("monocode.sidebarLayout", "classic");
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("full");
    });
    expect(loadSidebarLayout()).toBe("deck");
    vi.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(loadSidebarLayout()).toBe("deck");
  });
});

describe("workspace panel preferences", () => {
  beforeEach(mockLocalStorage);
  afterEach(() => vi.restoreAllMocks());

  it("keeps right-panel visibility independent from the saved Classic sidebar", () => {
    saveSidebarOpen(false);
    expect(loadWorkspacePanelOpen()).toBe(true);
    saveWorkspacePanelOpen(false);
    saveSidebarOpen(true);
    expect(loadWorkspacePanelOpen()).toBe(false);
    saveWorkspacePanelOpen(true);
    expect(loadSidebarOpen()).toBe(true);
  });

  it("remembers the selected tool and ignores legacy session tabs", () => {
    saveWorkspacePanelTab("changes");
    expect(loadWorkspacePanelTab()).toBe("changes");
    localStorage.setItem("monocode.workspacePanelTab", "sessions");
    expect(loadWorkspacePanelTab()).toBe("files");
  });

  it("bounds saved widths and migrates narrow project rails for session rows", () => {
    localStorage.setItem("monocode.projectRailWidth", "180");
    expect(loadProjectRailWidth()).toBe(PROJECT_RAIL_WIDTH_MIN);
    saveWorkspacePanelWidth(10);
    expect(loadWorkspacePanelWidth()).toBe(WORKSPACE_PANEL_WIDTH_MIN);
    saveWorkspacePanelWidth(9999);
    expect(loadWorkspacePanelWidth()).toBe(WORKSPACE_PANEL_WIDTH_MAX);
    localStorage.setItem("monocode.workspacePanelWidth.v2", "not-a-number");
    expect(loadWorkspacePanelWidth()).toBe(WORKSPACE_PANEL_WIDTH_DEFAULT);
  });

  it("stays usable when preference storage is unavailable", () => {
    vi.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("full");
    });
    expect(loadWorkspacePanelOpen()).toBe(true);
    expect(loadWorkspacePanelTab()).toBe("files");
    expect(loadWorkspacePanelWidth()).toBe(WORKSPACE_PANEL_WIDTH_DEFAULT);
    expect(() => {
      saveWorkspacePanelOpen(false);
      saveWorkspacePanelTab("changes");
      saveWorkspacePanelWidth(320);
    }).not.toThrow();
  });
});

function mockLocalStorage() {
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
    clear: () => {
      data.clear();
    },
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    configurable: true,
  });
}

describe("transcript layout setting", () => {
  beforeEach(mockLocalStorage);
  afterEach(() => {
    localStorage.removeItem(KEY);
  });

  it("defaults to full width", () => {
    expect(TRANSCRIPT_LAYOUT_DEFAULT).toBe("full");
    expect(loadTranscriptLayout()).toBe("full");
  });

  it("persists the chat layout", () => {
    saveTranscriptLayout("chat");
    expect(localStorage.getItem(KEY)).toBe("chat");
    expect(loadTranscriptLayout()).toBe("chat");
    saveTranscriptLayout("full");
    expect(loadTranscriptLayout()).toBe("full");
  });

  it("ignores unknown stored values", () => {
    localStorage.setItem(KEY, "bubbles");
    expect(loadTranscriptLayout()).toBe("full");
  });
});

describe("zen mode setting", () => {
  beforeEach(mockLocalStorage);
  afterEach(() => {
    localStorage.removeItem(ZEN_KEY);
  });

  it("defaults to on", () => {
    expect(TRANSCRIPT_ZEN_DEFAULT).toBe(true);
    expect(loadTranscriptZen()).toBe(true);
  });

  it("persists across loads", () => {
    saveTranscriptZen(true);
    expect(loadTranscriptZen()).toBe(true);
    saveTranscriptZen(false);
    expect(loadTranscriptZen()).toBe(false);
  });

  it("toggles from the current value", () => {
    expect(toggleTranscriptZen()).toBe(false);
    expect(loadTranscriptZen()).toBe(false);
    expect(toggleTranscriptZen()).toBe(true);
    expect(loadTranscriptZen()).toBe(true);
  });
});
