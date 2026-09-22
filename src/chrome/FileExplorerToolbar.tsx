import { ChevronDown, Ellipsis, Plus } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ExplorerMenu, type ExplorerMenuItem } from "./ExplorerMenu";
import { MOD, SHIFT } from "../lib/platform";

type Action = "new-file" | "new-folder" | "search" | "collapse";
type Menu = "new" | "options";

export function fileExplorerMenuItems(
  menu: Menu,
  canSearch: boolean,
): ExplorerMenuItem[] {
  return menu === "new"
    ? [
        { kind: "item", id: "new-file", label: "New file" },
        { kind: "item", id: "new-folder", label: "New folder" },
      ]
    : [
        ...(canSearch
          ? [
              {
                kind: "item" as const,
                id: "search",
                label: "Search file contents…",
                shortcut: `${MOD}${SHIFT}F`,
              },
            ]
          : []),
        { kind: "item", id: "collapse", label: "Collapse folders" },
      ];
}

export function FileExplorerToolbar({
  active,
  cwd,
  onNewFile,
  onNewFolder,
  onCollapse,
  onSearch,
  children,
}: {
  active: boolean;
  cwd: string;
  onNewFile: () => void;
  onNewFolder: () => void;
  onCollapse: () => void;
  onSearch?: () => void;
  children?: ReactNode;
}) {
  const [menu, setMenu] = useState<{ kind: Menu; x: number; y: number } | null>(
    null,
  );
  const newButton = useRef<HTMLButtonElement>(null);
  const optionsButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setMenu(null);
  }, [active, cwd]);
  useEffect(() => {
    const close = () => setMenu(null);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);

  const open = (kind: Menu) => {
    const anchor = kind === "new" ? newButton.current : optionsButton.current;
    const rect = anchor?.getBoundingClientRect();
    if (!rect) return;
    setMenu((current) =>
      current?.kind === kind
        ? null
        : { kind, x: rect.left, y: rect.bottom + 4 },
    );
  };
  const close = (restoreFocus = true) => {
    if (restoreFocus)
      (menu?.kind === "new"
        ? newButton.current
        : optionsButton.current
      )?.focus();
    setMenu(null);
  };
  const actions: Record<Action, (() => void) | undefined> = {
    "new-file": onNewFile,
    "new-folder": onNewFolder,
    search: onSearch,
    collapse: onCollapse,
  };

  return (
    <div
      className="flex min-h-10 shrink-0 flex-wrap items-center gap-1 px-2 py-1"
      onContextMenu={(event) => event.stopPropagation()}
    >
      <span className="mr-auto pl-1 text-xs font-medium text-content/80">
        Files
      </span>
      <div
        role="group"
        aria-label="File explorer actions"
        className="flex shrink-0 items-center gap-1"
      >
        <button
          ref={newButton}
          type="button"
          aria-label="New file or folder"
          aria-haspopup="menu"
          aria-expanded={menu?.kind === "new"}
          disabled={!active}
          onClick={() => open("new")}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              open("new");
            }
          }}
          className="flex h-7 items-center gap-1 rounded-md px-2 text-xs text-content/80 hover:bg-content/8 hover:text-content focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40"
        >
          <Plus className="size-3.5" aria-hidden />
          New
          <ChevronDown className="size-3 text-content/50" aria-hidden />
        </button>
        {children}
        <button
          ref={optionsButton}
          type="button"
          title="File explorer options"
          aria-label="File explorer options"
          aria-haspopup="menu"
          aria-expanded={menu?.kind === "options"}
          disabled={!active}
          onClick={() => open("options")}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              open("options");
            }
          }}
          className="grid size-7 place-items-center rounded-md text-content/65 hover:bg-content/8 hover:text-content focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40"
        >
          <Ellipsis className="size-4" aria-hidden />
        </button>
      </div>
      {active && menu ? (
        <ExplorerMenu
          key={menu.kind}
          compact
          anchor={menu.kind === "new" ? newButton : optionsButton}
          x={menu.x}
          y={menu.y}
          ariaLabel={
            menu.kind === "new"
              ? "Create a file or folder"
              : "File explorer options"
          }
          items={fileExplorerMenuItems(menu.kind, !!onSearch)}
          onClose={close}
          onPick={(id) => {
            close();
            actions[id as Action]?.();
          }}
        />
      ) : null}
    </div>
  );
}
