import { PanelLeft, PanelRight, Plus } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { IS_MAC, MOD } from "../lib/platform";
import { IconButton } from "./TitleBar";
import { WindowControls } from "./WindowControls";

type Props = {
  sidebarOpen: boolean;
  workspaceOpen: boolean;
  onShowSidebar: () => void;
  onNewSession: () => void;
  onToggleWorkspace: () => void;
};

/** Minimal window header. Session navigation stays in the sidebar. */
export function CanvasControls({
  sidebarOpen,
  workspaceOpen,
  onShowSidebar,
  onNewSession,
  onToggleWorkspace,
}: Props) {
  return (
    <header
      className="flex h-10 shrink-0 items-center gap-1 border-b border-content/10 px-2"
      data-tauri-drag-region
      onDoubleClick={(event) => {
        if (event.target instanceof Element && event.target.closest("button"))
          return;
        try {
          void getCurrentWindow()
            .toggleMaximize()
            .catch(() => {});
        } catch {
          /* No native window in browser previews. */
        }
      }}
    >
      {!sidebarOpen && !workspaceOpen ? (
        <>
          {IS_MAC ? (
            <div className="w-[78px] shrink-0" data-tauri-drag-region />
          ) : null}
          <IconButton label={`Show sidebar (${MOD}B)`} onClick={onShowSidebar}>
            <PanelLeft className="size-3.5" strokeWidth={1.75} />
          </IconButton>
          <IconButton label={`New session (${MOD}T)`} onClick={onNewSession}>
            <Plus className="size-3.5" strokeWidth={1.75} />
          </IconButton>
        </>
      ) : null}
      <div className="flex-1" data-tauri-drag-region />
      {!workspaceOpen ? (
        <button
          id="workspace-panel-toggle"
          type="button"
          title="Open workspace"
          aria-label="Show workspace panel"
          aria-expanded={false}
          data-tauri-drag-region="false"
          onClick={onToggleWorkspace}
          className="chrome-icon-button grid shrink-0 place-items-center rounded-lg text-content/60 hover:bg-content/8 hover:text-content"
        >
          <PanelRight className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
        </button>
      ) : null}
      {!IS_MAC && !workspaceOpen ? <WindowControls /> : null}
    </header>
  );
}
