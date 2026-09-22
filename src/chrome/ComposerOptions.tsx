import { ChevronDown, Settings2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  accessChoices,
  modelSettingChoices,
  modelSettingLabel,
  updateModelOption,
  type ComposerMenuEntry,
} from "../lib/composerOptions";
import {
  RUNTIME_MODE_LABEL,
  RUNTIME_MODES,
  type HarnessId,
  type RuntimeMode,
} from "../lib/session";
import { useModelSettings } from "../hooks/useModelSettings";
import { ComposerMenu } from "./ComposerMenu";

type Props = {
  enabled: boolean;
  harness: HarnessId;
  model: string;
  values: Record<string, string>;
  onSettingsChange: (settings: Record<string, string>) => void;
  onClose: () => void;
} & (
  | {
      scope?: "all";
      runtimeMode: RuntimeMode;
      onRuntimeModeChange: (mode: RuntimeMode) => void;
    }
  | { scope: "model" }
);
type Page = { kind: "setting"; id: string } | { kind: "access" };

/** Shared model-settings menu; includes access only for narrow-pane overflow. */
export function ComposerOptions(props: Props) {
  const { enabled, harness, model, values, onSettingsChange, onClose } = props;
  const settings = useModelSettings(harness, model);
  const modelOnly = props.scope === "model";
  const hasAccess = !modelOnly && harness !== "fx";
  const rootLabel = modelOnly ? "Model settings" : "Composer options";
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<Page | null>(null);
  const [returnId, setReturnId] = useState<string>();
  const anchor = useRef<HTMLButtonElement>(null);
  const pageSetting =
    page?.kind === "setting"
      ? settings.find((setting) => setting.id === page.id)
      : undefined;
  useEffect(() => {
    if (!enabled) {
      setOpen(false);
      setPage(null);
    }
  }, [enabled]);
  useEffect(() => {
    if (page?.kind === "setting" && !pageSetting) setPage(null);
  }, [page, pageSetting]);
  if (!hasAccess && settings.length === 0) return null;
  const modeLabel =
    props.scope !== "model" && hasAccess
      ? RUNTIME_MODE_LABEL[props.runtimeMode]
      : modelOnly
        ? settings
            .slice(0, 2)
            .map((setting) => modelSettingLabel(setting, values))
            .join(" · ")
        : "Options";
  const root: ComposerMenuEntry[] = settings.map((setting) => ({
    id: `setting:${setting.id}`,
    label: setting.label,
    value: modelSettingLabel(setting, values),
    ...(setting.kind === "toggle"
      ? {
          kind: "checkbox" as const,
          description: setting.description,
          checked: (values[setting.id] ?? setting.value) === "true",
        }
      : { submenu: true, disabled: setting.options.length === 0 }),
  }));
  if (hasAccess)
    root.push({
      id: "access",
      label: "Access",
      value: modeLabel,
      submenu: true,
    });
  const entries =
    page?.kind === "access" && props.scope !== "model"
      ? accessChoices(props.runtimeMode)
      : pageSetting
        ? modelSettingChoices(pageSetting, values)
        : root;
  const label =
    page?.kind === "access" ? "Access" : (pageSetting?.label ?? rootLabel);
  const dismiss = (restore: boolean) => {
    setOpen(false);
    setPage(null);
    if (restore) onClose();
  };
  const pick = (id: string) => {
    if (page?.kind === "access") {
      if (props.scope === "model") return;
      if (!RUNTIME_MODES.includes(id as RuntimeMode)) return;
      props.onRuntimeModeChange(id as RuntimeMode);
      dismiss(true);
      return;
    }
    if (pageSetting) {
      const updated = updateModelOption(pageSetting, values, id);
      if (updated) {
        onSettingsChange(updated);
        dismiss(true);
      }
      return;
    }
    if (id === "access" && hasAccess) {
      setReturnId(id);
      setPage({ kind: "access" });
      return;
    }
    const setting = settings.find((entry) => `setting:${entry.id}` === id);
    if (!setting) return;
    if (setting.kind === "toggle") {
      const updated = updateModelOption(
        setting,
        values,
        (values[setting.id] ?? setting.value) === "true" ? "false" : "true",
      );
      if (updated) onSettingsChange(updated);
    } else if (setting.options.length) {
      setReturnId(id);
      setPage({ kind: "setting", id: setting.id });
    }
  };
  return (
    <>
      <button
        ref={anchor}
        type="button"
        disabled={!enabled}
        title={[
          rootLabel,
          ...root.map((entry) => `${entry.label}: ${entry.value}`),
        ].join(" · ")}
        aria-label={`${rootLabel}, ${modeLabel}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => (open ? dismiss(true) : setOpen(true))}
        className={`composer-options-trigger flex h-6.5 min-w-0 items-center gap-1 rounded-md px-1.5 text-xs text-content disabled:opacity-50 ${modelOnly ? "max-w-48" : ""} ${open ? "bg-content/20" : "bg-content/10 hover:bg-content/15"}`}
      >
        <Settings2 className="size-3.5 shrink-0" strokeWidth={1.75} />
        <span className="min-w-0 truncate">{modeLabel}</span>
        <ChevronDown className="size-3 shrink-0 text-content/55" aria-hidden />
      </button>
      {open && enabled ? (
        <ComposerMenu
          anchor={anchor}
          label={label}
          description={pageSetting?.description}
          entries={entries}
          width={page?.kind === "access" ? 288 : 264}
          pageKey={
            page?.kind === "access"
              ? "access"
              : pageSetting
                ? `setting:${pageSetting.id}`
                : "root"
          }
          initialId={page ? undefined : returnId}
          onPick={pick}
          onBack={page ? () => setPage(null) : undefined}
          onClose={dismiss}
          onRestoreFocus={onClose}
        />
      ) : null}
    </>
  );
}
