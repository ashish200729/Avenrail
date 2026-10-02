import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EmptySession } from "./EmptySession";

describe("empty session background", () => {
  it("keeps Avenrail's empty session free of the arcade", () => {
    const markup = renderToStaticMarkup(
      createElement(EmptySession, { cwd: "/work/demo" }),
    );

    expect(markup).not.toContain("<canvas");
  });

  it("does not render the arcade over a selected chat background", () => {
    const markup = renderToStaticMarkup(
      createElement(EmptySession, {
        cwd: "/work/demo",
        hasChatBackground: true,
      }),
    );

    expect(markup).not.toContain("<canvas");
  });
});
