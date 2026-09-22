import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import {
  composerOptionsPlacement,
  type ComposerMenuEntry,
} from "../lib/composerOptions";

export function ComposerMenuRows({
  entries,
  onPick,
}: {
  entries: ComposerMenuEntry[];
  onPick: (id: string) => void;
}) {
  return (
    <>
      {entries.map((entry) => (
        <button
          key={entry.id}
          type="button"
          data-composer-menu-item
          data-choice-id={entry.id}
          data-search-label={entry.label}
          data-submenu={entry.submenu || undefined}
          role={
            entry.kind === "radio"
              ? "menuitemradio"
              : entry.kind === "checkbox"
                ? "menuitemcheckbox"
                : "menuitem"
          }
          aria-checked={entry.kind ? !!entry.checked : undefined}
          aria-haspopup={entry.submenu ? "menu" : undefined}
          disabled={entry.disabled}
          onClick={() => {
            if (!entry.disabled) onPick(entry.id);
          }}
          className={`flex min-h-8 w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-content outline-none hover:bg-content/8 focus-visible:bg-content/10 disabled:opacity-40 ${entry.checked ? "bg-content/5" : ""}`}
        >
          <span className="min-w-0 flex-1">
            <span className="block break-words">{entry.label}</span>
            {entry.description ? (
              <span className="mt-1 block break-words text-xs leading-relaxed text-content/70">
                {entry.description}
              </span>
            ) : null}
          </span>
          {entry.value ? (
            <span className="max-w-[48%] truncate text-xs text-content/65">
              {entry.value}
            </span>
          ) : null}
          {entry.submenu ? (
            <ChevronRight className="size-3 shrink-0 text-content/55" />
          ) : (
            <span className="grid size-3.5 shrink-0 place-items-center">
              {entry.checked ? <Check className="size-3.5" /> : null}
            </span>
          )}
        </button>
      ))}
    </>
  );
}

type Props = {
  anchor: RefObject<HTMLButtonElement | null>;
  label: string;
  entries: ComposerMenuEntry[];
  pageKey?: string;
  initialId?: string;
  width?: number;
  description?: string;
  onPick: (id: string) => void;
  onBack?: () => void;
  onClose: (restore: boolean) => void;
  onRestoreFocus?: () => void;
};

/** Both inline pickers and overflow choices use the same viewport-bounded menu. */
export function ComposerMenu({
  anchor,
  label,
  entries,
  pageKey = label,
  initialId,
  width = 264,
  description,
  onPick,
  onBack,
  onClose,
  onRestoreFocus,
}: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const restoreOnUnmount = useRef(true);
  const [position, setPosition] = useState<CSSProperties>(() => {
    const rect = anchor.current?.getBoundingClientRect();
    return rect
      ? {
          position: "fixed",
          zIndex: 90,
          ...composerOptionsPlacement(
            rect,
            { width: window.innerWidth, height: window.innerHeight },
            width,
          ),
        }
      : { position: "fixed", visibility: "hidden" };
  });
  const latest = useRef({
    onClose,
    onBack,
    onRestoreFocus,
    entries,
    initialId,
  });
  latest.current = { onClose, onBack, onRestoreFocus, entries, initialId };
  const place = useCallback(() => {
    const rect = anchor.current?.getBoundingClientRect();
    if (rect)
      setPosition({
        position: "fixed",
        zIndex: 90,
        ...composerOptionsPlacement(
          rect,
          { width: window.innerWidth, height: window.innerHeight },
          width,
        ),
      });
  }, [anchor, width]);

  useLayoutEffect(() => {
    place();
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(place) : null;
    if (anchor.current) observer?.observe(anchor.current);
    window.addEventListener("resize", place);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [anchor, place]);

  useLayoutEffect(() => {
    const buttons = Array.from(
      panel.current?.querySelectorAll<HTMLButtonElement>(
        "[data-composer-menu-item]:not(:disabled)",
      ) ?? [],
    );
    const targetId =
      latest.current.initialId ??
      latest.current.entries.find(
        (entry) => entry.kind === "radio" && entry.checked,
      )?.id;
    (
      buttons.find((button) => button.dataset.choiceId === targetId) ??
      buttons[0] ??
      panel.current
    )?.focus();
  }, [pageKey]);

  useLayoutEffect(
    () => () => {
      if (
        restoreOnUnmount.current &&
        panel.current?.contains(document.activeElement)
      )
        latest.current.onRestoreFocus?.();
    },
    [],
  );

  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (
        !panel.current?.contains(event.target as Node) &&
        !anchor.current?.contains(event.target as Node)
      ) {
        restoreOnUnmount.current = false;
        latest.current.onClose(false);
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      if (latest.current.onBack) latest.current.onBack();
      else latest.current.onClose(true);
    };
    const scroll = (event: Event) => {
      if (event.target instanceof Node && panel.current?.contains(event.target))
        return;
      place();
    };
    window.addEventListener("pointerdown", outside);
    window.addEventListener("keydown", escape, true);
    window.addEventListener("scroll", scroll, true);
    return () => {
      window.removeEventListener("pointerdown", outside);
      window.removeEventListener("keydown", escape, true);
      window.removeEventListener("scroll", scroll, true);
    };
  }, [anchor, place]);

  return createPortal(
    <div
      ref={panel}
      role="menu"
      aria-label={label}
      data-composer-options
      tabIndex={-1}
      style={position ?? { position: "fixed", visibility: "hidden" }}
      className="app-scrollbar overflow-x-hidden overflow-y-auto rounded-lg border border-content/15 bg-background-base p-1 text-content shadow-xl outline-none"
      onKeyDown={(event) => {
        const buttons = Array.from(
          panel.current?.querySelectorAll<HTMLButtonElement>(
            "[data-composer-menu-item]:not(:disabled)",
          ) ?? [],
        );
        const current = buttons.indexOf(
          document.activeElement as HTMLButtonElement,
        );
        const focus = (index: number) => buttons[index]?.focus();
        if (event.key === "Tab") {
          event.preventDefault();
          onClose(true);
        } else if (event.key === "ArrowLeft" && onBack) {
          event.preventDefault();
          onBack();
        } else if (
          event.key === "ArrowRight" &&
          buttons[current]?.dataset.submenu
        ) {
          event.preventDefault();
          buttons[current].click();
        } else if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          (document.activeElement as HTMLButtonElement)?.click?.();
        } else if (
          buttons.length &&
          ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
        ) {
          event.preventDefault();
          focus(
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? buttons.length - 1
                : event.key === "ArrowDown"
                  ? (current + 1) % buttons.length
                  : current < 0
                    ? buttons.length - 1
                    : (current - 1 + buttons.length) % buttons.length,
          );
        } else if (
          event.key.length === 1 &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey
        ) {
          const ordered = [
            ...buttons.slice(current + 1),
            ...buttons.slice(0, current + 1),
          ];
          ordered
            .find((button) =>
              button.dataset.searchLabel
                ?.toLocaleLowerCase()
                .startsWith(event.key.toLocaleLowerCase()),
            )
            ?.focus();
        }
      }}
    >
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label={`Back from ${label}`}
          className="mb-1 flex h-8 w-full items-center gap-2 rounded-md px-2 text-xs font-medium hover:bg-content/8 focus-visible:outline-2 focus-visible:outline-accent"
        >
          <ArrowLeft className="size-3.5" />
          {label}
        </button>
      ) : null}
      {description ? (
        <p className="px-2 py-1.5 text-xs leading-relaxed text-content/70">
          {description}
        </p>
      ) : null}
      <ComposerMenuRows entries={entries} onPick={onPick} />
    </div>,
    document.body,
  );
}

export function ComposerChoicePicker({
  label,
  valueLabel,
  entries,
  icon: Icon,
  enabled = true,
  width,
  description,
  onPick,
  onClose,
}: {
  label: string;
  valueLabel: string;
  entries: ComposerMenuEntry[];
  icon: LucideIcon;
  enabled?: boolean;
  width?: number;
  description?: string;
  onPick: (id: string) => void;
  onClose?: () => void;
}) {
  const anchor = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!enabled) setOpen(false);
  }, [enabled]);
  const dismiss = (restore: boolean) => {
    setOpen(false);
    if (restore) onClose?.();
  };
  return (
    <div className="relative">
      <button
        ref={anchor}
        type="button"
        disabled={!enabled || entries.length === 0}
        title={[`${label}: ${valueLabel}`, description]
          .filter(Boolean)
          .join(" · ")}
        aria-label={`${label}: ${valueLabel}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => (open ? dismiss(true) : setOpen(true))}
        className="flex h-6.5 max-w-36 items-center gap-1 rounded-md bg-content/10 px-1.5 text-content hover:bg-content/15 disabled:opacity-50"
      >
        <Icon className="size-3.5 shrink-0" strokeWidth={1.75} />
        <span className="min-w-0 truncate text-[11px]">{valueLabel}</span>
        <ChevronDown className="size-3 shrink-0 text-content/55" />
      </button>
      {open && enabled ? (
        <ComposerMenu
          anchor={anchor}
          label={label}
          entries={entries}
          width={width}
          description={description}
          onPick={(id) => {
            onPick(id);
            dismiss(true);
          }}
          onClose={dismiss}
          onRestoreFocus={onClose}
        />
      ) : null}
    </div>
  );
}
