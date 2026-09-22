import type { HarnessId } from "../lib/session";
import { GitChangesPanel } from "./GitChangesPanel";

type Props = {
  cwd: string;
  toolbarTarget?: HTMLElement | null;
  enabled: boolean;
  textHarness?: HarnessId;
  selectedPath?: string;
  onOpenFile: (path: string) => void;
};

export function SourceControl({
  cwd,
  toolbarTarget,
  enabled,
  textHarness,
  selectedPath,
  onOpenFile,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <GitChangesPanel
        cwd={cwd}
        toolbarTarget={toolbarTarget}
        enabled={enabled}
        textHarness={textHarness}
        selectedPath={selectedPath}
        onOpenFile={onOpenFile}
      />
    </div>
  );
}
