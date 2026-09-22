import { FileCheck2, Shield, ShieldCheck, ShieldOff } from "lucide-react";
import {
  RUNTIME_MODE_LABEL,
  RUNTIME_MODES,
  type RuntimeMode,
} from "../lib/session";
import { accessChoices } from "../lib/composerOptions";
import { ComposerChoicePicker } from "./ComposerMenu";

const ICONS = {
  supervised: Shield,
  "auto-accept-edits": FileCheck2,
  auto: ShieldCheck,
  "full-access": ShieldOff,
};

export function AccessPicker({
  value,
  onChange,
  onClose,
  enabled = true,
}: {
  value: RuntimeMode;
  onChange: (mode: RuntimeMode) => void;
  onClose?: () => void;
  enabled?: boolean;
}) {
  return (
    <ComposerChoicePicker
      label="Access"
      valueLabel={RUNTIME_MODE_LABEL[value]}
      icon={ICONS[value]}
      entries={accessChoices(value)}
      enabled={enabled}
      width={288}
      onPick={(id) => {
        if (RUNTIME_MODES.includes(id as RuntimeMode))
          onChange(id as RuntimeMode);
      }}
      onClose={onClose}
    />
  );
}
