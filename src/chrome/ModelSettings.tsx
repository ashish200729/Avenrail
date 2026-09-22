import { Brain, Gauge, Maximize2, Zap } from "lucide-react";
import {
  modelSettingChoices,
  modelSettingLabel,
  updateModelOption,
} from "../lib/composerOptions";
import type { HarnessId } from "../lib/session";
import { ComposerChoicePicker } from "./ComposerMenu";
import { ComposerOptions } from "./ComposerOptions";
import { useModelSettings } from "../hooks/useModelSettings";
export { useModelSettings } from "../hooks/useModelSettings";

type Props = {
  harness: HarnessId;
  model: string;
  values: Record<string, string>;
  enabled?: boolean;
  onChange: (settings: Record<string, string>) => void;
  onClose?: () => void;
};

export function ModelSettings({
  harness,
  model,
  values,
  enabled = true,
  onChange,
  onClose,
}: Props) {
  const settings = useModelSettings(harness, model);
  if (settings.length > 1) {
    return (
      <ComposerOptions
        scope="model"
        enabled={enabled}
        harness={harness}
        model={model}
        values={values}
        onSettingsChange={onChange}
        onClose={() => onClose?.()}
      />
    );
  }
  return (
    <>
      {settings.map((setting) => {
        const value = values[setting.id] ?? setting.value;
        const Icon =
          setting.id === "fast"
            ? Zap
            : setting.id === "thinking"
              ? Brain
              : setting.id === "context"
                ? Maximize2
                : Gauge;
        const pick = (next: string) => {
          const updated = updateModelOption(setting, values, next);
          if (updated) onChange(updated);
        };
        return setting.kind === "toggle" ? (
          <button
            key={setting.id}
            type="button"
            title={setting.description ?? setting.label}
            aria-label={setting.label}
            aria-pressed={value === "true"}
            disabled={!enabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => pick(value === "true" ? "false" : "true")}
            className={`flex h-6.5 max-w-36 items-center gap-1 rounded-md px-1.5 text-content disabled:opacity-50 ${value === "true" ? "bg-content/20" : "bg-content/10 hover:bg-content/15"}`}
          >
            <Icon className="size-3.5 shrink-0" strokeWidth={1.75} />
            <span className="min-w-0 truncate text-[11px]">
              {setting.label}
            </span>
          </button>
        ) : (
          <ComposerChoicePicker
            key={setting.id}
            label={setting.label}
            valueLabel={modelSettingLabel(setting, values)}
            entries={modelSettingChoices(setting, values)}
            description={setting.description}
            icon={Icon}
            enabled={enabled}
            onPick={pick}
            onClose={onClose}
          />
        );
      })}
    </>
  );
}
