import type { ModelSetting } from "./models";
import {
  RUNTIME_MODE_HINT,
  RUNTIME_MODE_LABEL,
  RUNTIME_MODES,
  type RuntimeMode,
} from "./session";

type Anchor = { right: number; top: number; bottom: number };
type Viewport = { width: number; height: number };

/** Anchor the options popup to the button while keeping it within the viewport. */
export function composerOptionsPlacement(
  anchor: Anchor,
  viewport: Viewport,
  preferredWidth = 320,
) {
  const margin = 8;
  const gap = 6;
  const width = Math.min(
    preferredWidth,
    Math.max(0, viewport.width - margin * 2),
  );
  const top = Math.max(margin, Math.min(anchor.top, viewport.height - margin));
  const bottom = Math.max(
    margin,
    Math.min(anchor.bottom, viewport.height - margin),
  );
  const above = Math.max(0, top - margin - gap);
  const below = Math.max(0, viewport.height - bottom - margin - gap);
  const opensAbove = above >= below;
  return {
    width,
    left: Math.max(
      margin,
      Math.min(anchor.right - width, viewport.width - width - margin),
    ),
    maxHeight: Math.min(440, opensAbove ? above : below),
    ...(opensAbove
      ? { bottom: viewport.height - top + gap }
      : { top: bottom + gap }),
  };
}

export type ComposerMenuEntry = {
  id: string;
  label: string;
  value?: string;
  description?: string;
  checked?: boolean;
  kind?: "radio" | "checkbox";
  submenu?: boolean;
  disabled?: boolean;
};

export function modelSettingLabel(
  setting: ModelSetting,
  values: Record<string, string>,
): string {
  const value = values[setting.id] ?? setting.value;
  return setting.kind === "toggle"
    ? value === "true"
      ? "On"
      : "Off"
    : (setting.options.find((option) => option.value === value)?.label ??
        value);
}

export function modelSettingChoices(
  setting: ModelSetting,
  values: Record<string, string>,
): ComposerMenuEntry[] {
  const value = values[setting.id] ?? setting.value;
  return setting.options.map((option) => ({
    id: option.value,
    label: option.label,
    kind: "radio",
    checked: value === option.value,
  }));
}

export function accessChoices(value: RuntimeMode): ComposerMenuEntry[] {
  return RUNTIME_MODES.map((mode) => ({
    id: mode,
    label: RUNTIME_MODE_LABEL[mode],
    description: RUNTIME_MODE_HINT[mode],
    kind: "radio",
    checked: value === mode,
  }));
}

export function updateModelOption(
  setting: ModelSetting,
  values: Record<string, string>,
  next: string,
): Record<string, string> | null {
  const valid =
    setting.kind === "toggle"
      ? next === "true" || next === "false"
      : setting.options.some((option) => option.value === next);
  return valid ? { ...values, [setting.id]: next } : null;
}

/** A small return margin avoids oscillation at fractional layout boundaries. */
export function shouldGroupComposerOptions(
  available: number,
  required: number,
  currentlyGrouped: boolean,
): boolean {
  if (available <= 0) return currentlyGrouped;
  return available < required + (currentlyGrouped ? 12 : 0);
}

export function composerControlsRequiredWidth(
  model: number,
  secondary: number,
  fixed: number[],
  gap: number,
): number {
  const count = fixed.length + 1 + (secondary > 0 ? 1 : 0);
  return (
    model +
    secondary +
    fixed.reduce((total, width) => total + width, 0) +
    Math.max(0, count - 1) * gap
  );
}
