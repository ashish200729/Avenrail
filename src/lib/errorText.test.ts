import { describe, expect, it } from "vitest";
import { errorText } from "./errorText";

describe("errorText", () => {
  it("preserves Error messages", () => {
    expect(errorText(new Error("pipe closed"), "fallback")).toBe("pipe closed");
  });

  it("preserves string errors returned by Tauri commands", () => {
    expect(errorText("Codex CLI not found", "fallback")).toBe(
      "Codex CLI not found",
    );
  });

  it("reads message-shaped rejections and otherwise falls back", () => {
    expect(errorText({ message: "spawn failed" }, "fallback")).toBe(
      "spawn failed",
    );
    expect(errorText(null, "fallback")).toBe("fallback");
    expect(errorText("  ", "fallback")).toBe("fallback");
  });
});
