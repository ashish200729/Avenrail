import { describe, expect, it } from "vitest";
import type { Block } from "./session";
import { avenrailToolCall, avenrailWorkSummary } from "./avenrailToolCall";

function shell(text: string): Block {
  return { id: text, role: "tool", text, tool: { kind: "shell" } };
}

describe("Avenrail CLI tool calls", () => {
  it("recognizes the avenrail executable as well as the legacy avenrail one", () => {
    expect(
      avenrailToolCall(
        shell("/Applications/Avenrail.app/Contents/MacOS/avenrail app --help"),
      )?.label,
    ).toBe("View CLI commands");
    expect(
      avenrailToolCall(shell('"C:\\Avenrail\\avenrail.exe" app sessions.read'))
        ?.label,
    ).toBe("Read a session");
    expect(avenrailToolCall(shell("avenrail-host app --help"))).toBeUndefined();
  });

  it("recognizes app actions with absolute, quoted, or bare executables", () => {
    expect(
      avenrailToolCall(
        shell(
          "/repo/target/debug/Avenrail.app/Contents/MacOS/avenrail app notes.list --json '{}'",
        ),
      )?.label,
    ).toBe("List notes");
    expect(
      avenrailToolCall(
        shell(
          "'/Applications/Avenrail App/avenrail' app folders.move --input -",
        ),
      )?.label,
    ).toBe("Move a session");
    expect(
      avenrailToolCall(
        shell('"C:\\Program Files\\Avenrail\\avenrail.exe" app notes.list'),
      )?.label,
    ).toBe("List notes");
    expect(avenrailToolCall(shell("avenrail app --help"))?.label).toBe(
      "View CLI commands",
    );
    expect(
      avenrailToolCall(shell("avenrail app sessions.read --json '{}'"))?.label,
    ).toBe("Read a session");
    expect(
      avenrailToolCall(shell("avenrail app sessions.send --json '{}'"))?.label,
    ).toBe("Continue a session");
    expect(
      avenrailToolCall(shell("avenrail app sessions.draft --json '{}'"))?.label,
    ).toBe("Save a draft");
    expect(
      avenrailToolCall(shell("avenrail app notes.write --input -"))?.label,
    ).toBe("Write a note");
    expect(
      avenrailToolCall({
        id: "generic",
        role: "tool",
        text: "Run command:",
        tool: { kind: "other", title: "avenrail app sessions.start" },
      })?.label,
    ).toBe("Start a session");
    expect(
      avenrailToolCall({
        id: "codex-action",
        role: "tool",
        text: "List",
        tool: {
          kind: "execute",
          preview: { kind: "shell", title: "avenrail app notes.list" },
        },
      })?.label,
    ).toBe("List notes");
  });

  it("does not restyle unrelated commands or text mentioning the CLI", () => {
    expect(
      avenrailToolCall(shell("echo avenrail app notes.list")),
    ).toBeUndefined();
    expect(avenrailToolCall(shell("avenrail control list"))).toBeUndefined();
    expect(
      avenrailToolCall({
        id: "prose",
        role: "assistant",
        text: "avenrail app notes.list",
      }),
    ).toBeUndefined();
  });

  it("does not compact compound shell commands or hide a longer shell preview", () => {
    for (const command of [
      "avenrail app notes.list && echo extra",
      "avenrail app notes.list; echo extra",
      "avenrail app notes.list | cat",
      "avenrail app notes.list\necho extra",
      'avenrail app notes.list --json "$(echo extra)"',
    ]) {
      expect(avenrailToolCall(shell(command))).toBeUndefined();
    }
    expect(
      avenrailToolCall({
        id: "short-title",
        role: "tool",
        text: "avenrail app notes.list",
        tool: {
          kind: "shell",
          title: "avenrail app notes.list",
          preview: {
            kind: "shell",
            title: "avenrail app notes.list && echo extra",
          },
        },
      }),
    ).toBeUndefined();
    expect(
      avenrailToolCall(
        shell('avenrail app sessions.send --json \'{"prompt":"a; b"}\''),
      )?.command,
    ).toBe('avenrail app sessions.send --json \'{"prompt":"a; b"}\'');
  });

  it("names a group only when all its tool calls use Avenrail", () => {
    const calls = [
      shell("avenrail app --help"),
      shell("avenrail app notes.list"),
    ];
    expect(avenrailWorkSummary(calls, true)).toBe("Using Avenrail");
    expect(avenrailWorkSummary(calls, false)).toBe("Used Avenrail");
    expect(
      avenrailWorkSummary([...calls, shell("git status")], true),
    ).toBeUndefined();
  });
});
