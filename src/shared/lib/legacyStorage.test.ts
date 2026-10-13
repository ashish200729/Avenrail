// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";

const script = readFileSync(
  resolve(__dirname, "../../../public/legacy-storage.js"),
  "utf8",
);
const run = () => new Function(script)();

describe("legacy storage migration", () => {
  beforeEach(() => localStorage.clear());

  it("moves monocode.* and monocode:* keys to avenrail", () => {
    localStorage.setItem("monocode.themeHue", "210");
    localStorage.setItem("monocode:tab-group:labels", '{"a":"b"}');
    run();
    expect(localStorage.getItem("avenrail.themeHue")).toBe("210");
    expect(localStorage.getItem("avenrail:tab-group:labels")).toBe('{"a":"b"}');
    expect(localStorage.getItem("monocode.themeHue")).toBeNull();
    expect(localStorage.getItem("monocode:tab-group:labels")).toBeNull();
  });

  it("keeps a value that already exists under the new name", () => {
    localStorage.setItem("monocode.sidebarOpacity", "0.5");
    localStorage.setItem("avenrail.sidebarOpacity", "0.9");
    run();
    expect(localStorage.getItem("avenrail.sidebarOpacity")).toBe("0.9");
    expect(localStorage.getItem("monocode.sidebarOpacity")).toBeNull();
  });

  it("leaves unrelated keys alone and can run twice", () => {
    localStorage.setItem("monocodex", "1");
    localStorage.setItem("other.key", "2");
    localStorage.setItem("monocode.autosave", "true");
    run();
    run();
    expect(localStorage.getItem("monocodex")).toBe("1");
    expect(localStorage.getItem("other.key")).toBe("2");
    expect(localStorage.getItem("avenrail.autosave")).toBe("true");
  });
});
