import { Check } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import {
  DEFAULT_SESSION_SIDEBAR_FILTERS,
  hasActiveSessionFilters,
  type SessionSidebarFilters,
  type SessionTimeFilter,
} from "../lib/sessionFilters";
import { HARNESS_TITLE, type HarnessId } from "../lib/session";
import { HarnessIcon } from "./HarnessIcon";
import type { SidebarOrganization } from "../lib/sidebarOrganization";

const MENU_WIDTH = 228;

type Props = {
  x: number;
  y: number;
  harnesses: HarnessId[];
  filters: SessionSidebarFilters;
  onChange: (filters: SessionSidebarFilters) => void;
  onClose: () => void;
  triggerRef?: RefObject<HTMLButtonElement | null>;
  organization?: {
    value: SidebarOrganization;
    onPick: (id: SidebarOrganization | "expand-all" | "collapse-all") => void;
  };
};

const TIME_OPTIONS: { id: SessionTimeFilter; label: string }[] = [
  { id: "all", label: "All time" },
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
];

export function SessionFiltersMenu({
  x,
  y,
  harnesses,
  filters,
  onChange,
  onClose,
  organization,
  triggerRef,
}: Props) {
  const menu = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const hiddenHarnesses = new Set(filters.hiddenHarnesses);

  useLayoutEffect(() => {
    menu.current?.focus();
  }, []);

  useLayoutEffect(() => {
    const el = menu.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pad = 8;
    let left = x;
    let top = y;
    if (left + rect.width > window.innerWidth - pad) {
      left = window.innerWidth - rect.width - pad;
    }
    if (top + rect.height > window.innerHeight - pad) {
      top = window.innerHeight - rect.height - pad;
    }
    setPos({
      left: Math.max(pad, left),
      top: Math.max(pad, top),
    });
  }, [x, y, harnesses.length, filters, organization?.value]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (triggerRef?.current?.contains(event.target as Node)) return;
      if (!menu.current?.contains(event.target as Node)) onCloseRef.current();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onCloseRef.current();
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [triggerRef]);

  const toggleHarness = (harness: HarnessId) => {
    const next = new Set(hiddenHarnesses);
    if (next.has(harness)) next.delete(harness);
    else next.add(harness);
    onChange({ ...filters, hiddenHarnesses: [...next] });
  };

  const setTime = (time: SessionTimeFilter) => {
    onChange({ ...filters, time });
  };

  const toggleStatus = (key: keyof SessionSidebarFilters["status"]) => {
    onChange({
      ...filters,
      status: { ...filters.status, [key]: !filters.status[key] },
    });
  };

  const toggleArchived = () => {
    onChange({ ...filters, showArchived: !filters.showArchived });
    onCloseRef.current();
  };

  return createPortal(
    <div
      ref={menu}
      role="menu"
      aria-label={organization ? "Sidebar options" : "Filter sessions"}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          const item = (event.target as HTMLElement).closest<HTMLButtonElement>(
            "button",
          );
          if (item && menu.current?.contains(item)) {
            event.preventDefault();
            item.click();
          }
          return;
        }
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key))
          return;
        event.preventDefault();
        const items = Array.from(
          menu.current?.querySelectorAll<HTMLButtonElement>(
            "button:not(:disabled)",
          ) ?? [],
        );
        if (!items.length) return;
        const current = items.indexOf(
          document.activeElement as HTMLButtonElement,
        );
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? items.length - 1
              : event.key === "ArrowDown"
                ? (current + 1) % items.length
                : current < 0
                  ? items.length - 1
                  : (current + items.length - 1) % items.length;
        items[next]?.focus();
      }}
      onContextMenu={(event) => event.preventDefault()}
      style={{
        position: "fixed",
        left: pos.left,
        top: pos.top,
        width: MENU_WIDTH,
        zIndex: 80,
      }}
      className="app-scrollbar max-h-[min(70vh,480px)] overflow-x-hidden overflow-y-auto rounded-lg border border-content/10 bg-content/10 p-1 shadow-xl backdrop-blur-xl outline-none"
    >
      {organization ? (
        <>
          <SectionLabel>Organize sidebar</SectionLabel>
          <FilterItem
            label="By project"
            checked={organization.value === "project"}
            onClick={() => organization.onPick("project")}
          />
          <FilterItem
            label="In one list"
            checked={organization.value === "list"}
            onClick={() => organization.onPick("list")}
          />
          {organization.value === "project" ? (
            <>
              <button
                type="button"
                role="menuitem"
                className="flex h-7 w-full items-center rounded-lg px-2 text-left text-[13px] text-content hover:bg-content/5 focus-visible:outline-2 focus-visible:outline-accent"
                onClick={() => organization.onPick("expand-all")}
              >
                Expand all projects
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex h-7 w-full items-center rounded-lg px-2 text-left text-[13px] text-content hover:bg-content/5 focus-visible:outline-2 focus-visible:outline-accent"
                onClick={() => organization.onPick("collapse-all")}
              >
                Collapse all projects
              </button>
            </>
          ) : null}
          <div role="separator" className="my-1 h-px bg-content/10" />
        </>
      ) : null}
      <FilterItem
        label="Archived"
        checked={filters.showArchived}
        onClick={toggleArchived}
      />

      <SectionLabel>Status</SectionLabel>
      <FilterItem
        label="Working"
        checked={filters.status.working}
        onClick={() => toggleStatus("working")}
      />
      <FilterItem
        label="Needs approval"
        checked={filters.status.needsApproval}
        onClick={() => toggleStatus("needsApproval")}
      />
      <FilterItem
        label="Done"
        checked={filters.status.done}
        onClick={() => toggleStatus("done")}
      />

      <SectionLabel>Time</SectionLabel>
      {TIME_OPTIONS.map((option) => (
        <FilterItem
          key={option.id}
          label={option.label}
          checked={filters.time === option.id}
          onClick={() => setTime(option.id)}
        />
      ))}

      {harnesses.length > 0 ? (
        <>
          <SectionLabel>Provider</SectionLabel>
          {harnesses.map((harness) => (
            <FilterItem
              key={harness}
              label={HARNESS_TITLE[harness]}
              checked={!hiddenHarnesses.has(harness)}
              icon={
                <HarnessIcon harness={harness} className="size-3.5 shrink-0" />
              }
              onClick={() => toggleHarness(harness)}
            />
          ))}
        </>
      ) : null}

      {hasActiveSessionFilters(filters) ? (
        <>
          <div role="separator" className="my-1 h-px bg-content/10" />
          <button
            type="button"
            role="menuitem"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onChange(DEFAULT_SESSION_SIDEBAR_FILTERS)}
            className="flex h-7 w-full items-center rounded-lg px-2 text-left text-[13px] leading-none text-content/70 hover:bg-content/5 hover:text-content focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
          >
            Clear filters
          </button>
        </>
      ) : null}
    </div>,
    document.body,
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="px-2 pb-0.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-content/40">
      {children}
    </div>
  );
}

function FilterItem({
  label,
  checked,
  icon,
  onClick,
}: {
  label: string;
  checked: boolean;
  icon?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={checked}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="flex h-7 w-full items-center gap-2 rounded-lg px-2 text-left text-[13px] leading-none text-content hover:bg-content/5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {checked ? (
        <Check className="size-3.5 shrink-0" strokeWidth={2.25} />
      ) : null}
    </button>
  );
}
