import { Children, createElement, isValidElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ComposerOptions } from "./ComposerOptions";
import { ComposerMenuRows } from "./ComposerMenu";
import { ModelSettings } from "./ModelSettings";
import { AccessPicker } from "./AccessPicker";
import {
  accessChoices,
  modelSettingChoices,
  modelSettingLabel,
  updateModelOption,
} from "../lib/composerOptions";
import {
  resetHarnessModelOverlays,
  setHarnessModels,
  type ModelSetting,
} from "../lib/models";

const settings: ModelSetting[] = [
  {
    id: "effort",
    label: "Reasoning",
    kind: "select",
    value: "low",
    options: [
      { value: "low", label: "Low" },
      { value: "high", label: "High" },
    ],
  },
  {
    id: "fast",
    label: "Fast mode",
    kind: "toggle",
    value: "false",
    options: [],
  },
];
afterEach(resetHarnessModelOverlays);

function buttons(
  node: ReactNode,
): Array<{ onClick: () => void; disabled?: boolean }> {
  const result: Array<{ onClick: () => void; disabled?: boolean }> = [];
  Children.forEach(node, (child) => {
    if (!isValidElement<{ children?: ReactNode; onClick: () => void }>(child))
      return;
    if (child.type === "button") result.push(child.props);
    result.push(...buttons(child.props.children));
  });
  return result;
}

describe("adaptive composer settings", () => {
  it("preserves every other saved value when a choice changes", () => {
    const values = Object.freeze({
      effort: "low",
      fast: "true",
      providerExtra: "keep",
    });
    expect(updateModelOption(settings[0], values, "high")).toEqual({
      effort: "high",
      fast: "true",
      providerExtra: "keep",
    });
    expect(values.effort).toBe("low");
  });
  it("preserves canonical provider toggle strings and rejects invalid values", () => {
    expect(
      updateModelOption(settings[1], { effort: "high", fast: "false" }, "true"),
    ).toEqual({ effort: "high", fast: "true" });
    expect(updateModelOption(settings[1], {}, "yes")).toBeNull();
  });
  it("does not silently normalize saved choices that disappear from a catalog", () => {
    expect(modelSettingLabel(settings[0], { effort: "retired" })).toBe(
      "retired",
    );
    expect(
      modelSettingChoices(settings[0], { effort: "retired" }).every(
        (entry) => !entry.checked,
      ),
    ).toBe(true);
    expect(
      updateModelOption(settings[0], { effort: "retired" }, "not-in-catalog"),
    ).toBeNull();
  });
  it("shows styled checked radio choices and uses the original option ids", () => {
    const onPick = vi.fn();
    const view = ComposerMenuRows({
      entries: modelSettingChoices(settings[0], { effort: "high" }),
      onPick,
    });
    const html = renderToStaticMarkup(view);
    expect(html).toContain('role="menuitemradio"');
    expect(html).toContain('aria-checked="true"');
    expect(html).not.toContain("<select");
    buttons(view)[0].onClick();
    expect(onPick).toHaveBeenCalledExactlyOnceWith("low");
  });
  it("retains every access mode, selected state, and permission explanation", () => {
    const entries = accessChoices("auto");
    expect(entries.map((entry) => entry.id)).toEqual([
      "supervised",
      "auto-accept-edits",
      "auto",
      "full-access",
    ]);
    expect(
      entries.filter((entry) => entry.checked).map((entry) => entry.id),
    ).toEqual(["auto"]);
    expect(entries.every((entry) => entry.description)).toBe(true);
  });
  it("combines multiple model settings while keeping access separate", () => {
    setHarnessModels("codex", [
      { id: "codex:test", harness: "codex", name: "Test", settings },
    ]);
    const change = vi.fn();
    const html =
      renderToStaticMarkup(
        createElement(ModelSettings, {
          harness: "codex",
          model: "codex:test",
          values: { effort: "high" },
          onChange: change,
        }),
      ) +
      renderToStaticMarkup(
        createElement(AccessPicker, { value: "auto", onChange: change }),
      );
    expect(html).toContain("Reasoning: High");
    expect(html).toContain("Model settings, High · Off");
    expect(html).toContain("Access: Auto");
    expect(html.match(/aria-haspopup="menu"/g)).toHaveLength(2);
    expect(html).not.toContain("Composer options");
    expect(html).not.toContain("<select");
    expect(change).not.toHaveBeenCalled();
  });
  it("keeps a single setting directly accessible without an extra menu layer", () => {
    setHarnessModels("codex", [
      {
        id: "codex:single",
        harness: "codex",
        name: "Single",
        settings: [settings[0]],
      },
    ]);
    const html = renderToStaticMarkup(
      createElement(ModelSettings, {
        harness: "codex",
        model: "codex:single",
        values: { effort: "high" },
        onChange() {},
      }),
    );
    expect(html).toContain('aria-label="Reasoning: High"');
    expect(html).not.toContain("Model settings");
    expect(html.match(/aria-haspopup="menu"/g)).toHaveLength(1);
  });
  it("does not render a model-settings control when the model has no settings", () => {
    setHarnessModels("codex", [
      { id: "codex:none", harness: "codex", name: "None", settings: [] },
    ]);
    expect(
      renderToStaticMarkup(
        createElement(ModelSettings, {
          harness: "codex",
          model: "codex:none",
          values: {},
          onChange() {},
        }),
      ),
    ).toBe("");
  });
  it("keeps access visible on the grouped trigger without changing stored values", () => {
    setHarnessModels("codex", [
      { id: "codex:test", harness: "codex", name: "Test", settings },
    ]);
    const change = vi.fn();
    const html = renderToStaticMarkup(
      createElement(ComposerOptions, {
        enabled: true,
        harness: "codex",
        model: "codex:test",
        values: { effort: "high" },
        runtimeMode: "auto",
        onSettingsChange: change,
        onRuntimeModeChange: change,
        onClose() {},
      }),
    );
    expect(html).toContain("Composer options, Auto");
    expect(html).toContain("Reasoning: High");
    expect(html).toContain('aria-haspopup="menu"');
    expect(change).not.toHaveBeenCalled();
  });
  it("does not add unsupported access controls or an empty overflow trigger for fx", () => {
    setHarnessModels("fx", [
      { id: "fx:test", harness: "fx", name: "Test", settings: [] },
    ]);
    expect(
      renderToStaticMarkup(
        createElement(ComposerOptions, {
          enabled: true,
          harness: "fx",
          model: "fx:test",
          values: {},
          runtimeMode: "auto",
          onSettingsChange() {},
          onRuntimeModeChange() {},
          onClose() {},
        }),
      ),
    ).toBe("");
  });
});
