import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HarnessIcon } from "../../features/sessions/ui/HarnessIcon";
import { FilePlus, FoldVertical, UnfoldVertical } from "./icons";

const SRC = fileURLToPath(new URL("../..", import.meta.url));
const CATALOG = "shared/ui/icons.tsx";
const SPECIFIER = /["'](@hugeicons\/[^"']+)["']/g;

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(path));
    else if (
      /\.(ts|tsx)$/.test(entry.name) &&
      !entry.name.endsWith(".test.ts")
    ) {
      out.push(path);
    }
  }
  return out;
}

describe("hugeicons imports", () => {
  it("keeps typed static glyph imports in the shared icon catalog", () => {
    const violations: string[] = [];

    for (const file of sourceFiles(SRC)) {
      const rel = relative(SRC, file).replaceAll("\\", "/");
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(SPECIFIER)) {
        const spec = match[1];
        const allowedCatalog =
          rel === CATALOG &&
          (spec === "@hugeicons/react" ||
            spec === "@hugeicons/core-free-icons");
        if (allowedCatalog) continue;
        violations.push(`${rel}: ${spec}`);
      }
    }

    expect(violations).toEqual([]);
  });

  it("draws fold/unfold as strokes, not filled chevrons", () => {
    for (const Icon of [FoldVertical, UnfoldVertical, FilePlus]) {
      const html = renderToStaticMarkup(createElement(Icon));
      expect(html, Icon.displayName).not.toMatch(/fill="currentColor"/);
      expect(html, Icon.displayName).toMatch(/stroke="currentColor"/);
    }
  });

  it("optically insets the detailed Hermes artwork at UI icon sizes", () => {
    const html = renderToStaticMarkup(
      createElement(HarnessIcon, {
        harness: "hermes",
        className: "size-4 shrink-0",
      }),
    );
    expect(html).toContain("items-center justify-center");
    expect(html).toContain("size-[72%]");
  });
});
