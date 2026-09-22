import type { PointerEvent as ReactPointerEvent } from "react";
import {
  createContext,
  memo,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  MarkdownViewShell,
  useMarkdownMode,
} from "../chrome/MarkdownModeToggle";
import { SurfaceTabs } from "../chrome/SurfaceTabs";
import {
  isPlanTab,
  isTerminalTab,
  type EditorPane,
  type FilePaneTab,
} from "../lib/layout";
import type { TerminalMetaPatch } from "../lib/terminalTab";
import type { EditorNavigationTarget } from "../lib/search";
import { editorPathsEqual } from "../lib/search";
import type { Session } from "../lib/session";
import { MarkdownPreview, MarkdownSource } from "./AgentMarkdown";
import { FileEditor } from "./FileEditor";
import { TerminalView } from "./TerminalView";

type Props = {
  pane: EditorPane;
  hideTabs?: boolean;
  present?: boolean;
  focused: boolean;
  dirtyFileIds: Set<string>;
  fileErrorCounts: Map<string, number>;
  sessions: Session[];
  onFocus: (paneId: string) => void;
  onSelectFile: (paneId: string, fileId: string) => void;
  onCloseFile: (paneId: string, fileId: string) => void;
  onDirtyChange: (fileId: string, dirty: boolean) => void;
  onErrorCountChange: (fileId: string, count: number) => void;
  onReorderFiles: (paneId: string, ids: string[]) => void;
  onOpenFile: (path: string) => void;
  editorNavigation?: EditorNavigationTarget | null;
  onPaneDragStart?: (event: ReactPointerEvent<HTMLElement>) => void;
  onTerminalMetaChange?: (fileId: string, patch: TerminalMetaPatch) => void;
};

function FilePaneComponent({
  pane,
  hideTabs = false,
  focused,
  dirtyFileIds,
  fileErrorCounts,
  sessions,
  onFocus,
  onSelectFile,
  onCloseFile,
  onDirtyChange,
  onErrorCountChange,
  onReorderFiles,
  onOpenFile,
  editorNavigation,
  onPaneDragStart,
  onTerminalMetaChange,
}: Props) {
  return (
    <div
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col"
      onMouseDown={() => onFocus(pane.id)}
    >
      {!hideTabs ? (
        <SurfaceTabs
          files={pane.files}
          activeFileId={pane.activeFileId}
          dirtyFileIds={dirtyFileIds}
          fileErrorCounts={fileErrorCounts}
          onSelectFile={(fileId) => onSelectFile(pane.id, fileId)}
          onCloseFile={(fileId) => onCloseFile(pane.id, fileId)}
          onReorder={(ids) => onReorderFiles(pane.id, ids)}
          onPaneDragStart={onPaneDragStart}
        />
      ) : null}
      <div className="relative min-h-0 flex-1">
        {pane.files.map((file) => (
          <div
            key={file.id}
            aria-hidden={file.id !== pane.activeFileId}
            className={
              file.id === pane.activeFileId
                ? "absolute inset-0 h-full"
                : "hidden"
            }
          >
            {isPlanTab(file) ? (
              <PlanSurface
                file={file}
                sessions={sessions}
                onOpenFile={onOpenFile}
              />
            ) : isTerminalTab(file) ? (
              <TerminalView
                id={file.id}
                cwd={file.cwd}
                active={focused && file.id === pane.activeFileId}
                onMetaChange={(patch) => onTerminalMetaChange?.(file.id, patch)}
              />
            ) : (
              <FileEditor
                path={file.path}
                cwd={file.cwd}
                showDiff={!!file.review}
                active={focused && file.id === pane.activeFileId}
                navigation={
                  editorNavigation &&
                  editorPathsEqual(file.path, editorNavigation.path)
                    ? editorNavigation
                    : null
                }
                onDirtyChange={(_path, dirty) => onDirtyChange(file.id, dirty)}
                onErrorCountChange={(_path, count) =>
                  onErrorCountChange(file.id, count)
                }
                onOpenFile={onOpenFile}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const MemoFilePane = memo(FilePaneComponent, (previous, next) => {
  if (
    previous.pane !== next.pane ||
    previous.hideTabs !== next.hideTabs ||
    previous.focused !== next.focused ||
    previous.dirtyFileIds !== next.dirtyFileIds ||
    previous.fileErrorCounts !== next.fileErrorCounts ||
    previous.onFocus !== next.onFocus ||
    previous.onSelectFile !== next.onSelectFile ||
    previous.onCloseFile !== next.onCloseFile ||
    previous.onDirtyChange !== next.onDirtyChange ||
    previous.onErrorCountChange !== next.onErrorCountChange ||
    previous.onReorderFiles !== next.onReorderFiles ||
    previous.onOpenFile !== next.onOpenFile ||
    previous.editorNavigation !== next.editorNavigation ||
    Boolean(previous.onPaneDragStart) !== Boolean(next.onPaneDragStart) ||
    previous.onTerminalMetaChange !== next.onTerminalMetaChange
  ) {
    return false;
  }

  for (const file of next.pane.files) {
    const sessionId = file.plan?.sessionId;
    if (!sessionId) continue;
    const before = previous.sessions.find(
      (session) => session.id === sessionId,
    );
    const after = next.sessions.find((session) => session.id === sessionId);
    if (before !== after) return false;
  }
  return true;
});

type PaneHost = {
  node: HTMLDivElement;
  owner: object;
  props: Props;
  cleanup?: number;
};
type PaneRegistry = {
  attach: (owner: object, slot: HTMLDivElement, props: Props) => () => void;
};
const PaneRegistryContext = createContext<PaneRegistry | null>(null);

export function FilePaneProvider({ children }: { children: ReactNode }) {
  const hosts = useRef(new Map<string, PaneHost>());
  const [, refresh] = useState(0);
  const registry = useMemo<PaneRegistry>(
    () => ({
      attach(owner, slot, props) {
        const id = props.pane.id;
        let host = hosts.current.get(id);
        if (!host) {
          const node = document.createElement("div");
          node.className = "flex h-full min-h-0 min-w-0 flex-1 flex-col";
          host = { node, owner, props };
          hosts.current.set(id, host);
        }
        if (host.cleanup != null) cancelAnimationFrame(host.cleanup);
        host.cleanup = undefined;
        host.owner = owner;
        host.props = props;
        if (host.node.parentNode !== slot) slot.appendChild(host.node);
        refresh((value) => value + 1);
        return () => {
          const current = hosts.current.get(id);
          if (!current || current.owner !== owner) return;
          current.cleanup = requestAnimationFrame(() => {
            if (hosts.current.get(id)?.owner !== owner) return;
            hosts.current.delete(id);
            current.node.remove();
            refresh((value) => value + 1);
          });
        };
      },
    }),
    [],
  );
  useLayoutEffect(
    () => () => {
      for (const host of hosts.current.values())
        if (host.cleanup != null) cancelAnimationFrame(host.cleanup);
    },
    [],
  );
  return (
    <PaneRegistryContext.Provider value={registry}>
      {children}
      {[...hosts.current.entries()].map(([id, host]) =>
        createPortal(<MemoFilePane {...host.props} />, host.node, id),
      )}
    </PaneRegistryContext.Provider>
  );
}

function FilePaneSlot({
  registry,
  props,
}: {
  registry: PaneRegistry;
  props: Props;
}) {
  const slot = useRef<HTMLDivElement>(null);
  const owner = useRef({});
  useLayoutEffect(() => {
    if (!slot.current || props.present === false) return;
    return registry.attach(owner.current, slot.current, props);
  }, [registry, props]);
  return (
    <div ref={slot} className="flex h-full min-h-0 min-w-0 flex-1 flex-col" />
  );
}

export function FilePane(props: Props) {
  const registry = useContext(PaneRegistryContext);
  return registry ? (
    <FilePaneSlot registry={registry} props={props} />
  ) : props.present === false ? null : (
    <MemoFilePane {...props} />
  );
}

function PlanSurface({
  file,
  sessions,
  onOpenFile,
}: {
  file: FilePaneTab;
  sessions: Session[];
  onOpenFile: (path: string) => void;
}) {
  const plan = file.plan;
  const [mode, setMode] = useMarkdownMode(file.path);
  const session = plan
    ? sessions.find((entry) => entry.id === plan.sessionId)
    : undefined;
  const block = plan
    ? session?.blocks.find((entry) => entry.id === plan.blockId)
    : undefined;

  if (!block) {
    return (
      <div className="grid h-full place-items-center p-6 text-center">
        <p className="text-[13px] text-content/70">
          This plan is no longer in the session.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <MarkdownViewShell
        mode={mode}
        onModeChange={setMode}
        preview={
          <MarkdownPreview
            text={block.text}
            streaming={block.streaming}
            cwd={file.cwd}
            onOpenFile={onOpenFile}
          />
        }
        source={<MarkdownSource text={block.text} />}
      />
    </div>
  );
}
