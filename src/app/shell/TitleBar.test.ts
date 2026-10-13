import { describe, expect, it } from "vitest";
import { tabCopy, type Tab } from "./TitleBar";

function tab(overrides: Partial<Tab> = {}): Tab {
  return {
    id: "t1",
    project: "agent-terminal",
    title: "",
    more: [],
    sessionCount: 1,
    harnesses: [],
    busyHarnesses: [],
    files: [],
    ...overrides,
  };
}

describe("tabCopy", () => {
  it("layers conversation and file when split across panes", () => {
    const focusedSession = tabCopy(
      tab({
        multiPane: true,
        title: "Add custom project logos",
        files: ["opencodeAdapter.ts"],
      }),
    );
    expect(focusedSession).toEqual({
      headline: "Add custom project logos",
      meta: "opencodeAdapter.ts",
      tooltip: "agent-terminal · Add custom project logos · opencodeAdapter.ts",
    });

    const focusedFile = tabCopy(
      tab({
        multiPane: true,
        fileFocused: true,
        title: "Add custom project logos",
        files: ["opencodeAdapter.ts"],
      }),
    );
    expect(focusedFile).toEqual({
      headline: "opencodeAdapter.ts",
      meta: "Add custom project logos",
      tooltip: "agent-terminal · Add custom project logos · opencodeAdapter.ts",
    });
  });

  it("layers two conversations in split panes", () => {
    const copy = tabCopy(
      tab({
        multiPane: true,
        title: "First chat",
        more: ["Second chat"],
        sessionCount: 2,
      }),
    );
    expect(copy.headline).toBe("First chat");
    expect(copy.meta).toBe("Second chat");
  });

  it("keeps a single-line title for one pane with only a conversation", () => {
    const copy = tabCopy(
      tab({
        title: "Only chat",
        project: "agent-terminal",
      }),
    );
    expect(copy.headline).toBe("Only chat");
    expect(copy.meta).toBe("");
  });

  it("labels an empty tab New session", () => {
    const copy = tabCopy(tab({ project: "agent-terminal" }));
    expect(copy.headline).toBe("New session");
    expect(copy.meta).toBe("");
  });
});
