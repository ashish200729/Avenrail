import type { LucideIcon } from "lucide-react";

type Props = {
  id?: string;
  expanded?: boolean;
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  active?: boolean;
  badge?: number;
  dot?: boolean;
  shortcut?: string;
  ariaLabel?: string;
  isNavButton?: boolean;
  iconOnly?: boolean;
  prominent?: boolean;
};

export function RailAction({
  id,
  expanded,
  label,
  icon: Icon,
  onClick,
  active = false,
  badge,
  dot = false,
  shortcut,
  ariaLabel,
  isNavButton = false,
  iconOnly = false,
  prominent = false,
}: Props) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      disabled={!onClick}
      title={iconOnly ? (ariaLabel ?? label) : undefined}
      aria-label={ariaLabel ?? label}
      aria-expanded={expanded}
      aria-current={isNavButton && active ? "page" : undefined}
      className={`relative ${iconOnly ? "grid size-9 shrink-0 place-items-center" : "flex min-w-0 w-full items-center gap-2 px-2 py-2 text-left"} ${prominent || iconOnly ? "rounded-lg" : "rounded-md"} ${
        active
          ? "bg-content/10 text-content"
          : prominent
            ? "bg-content/5 text-content hover:bg-content/10"
            : isNavButton
              ? "text-content/50 hover:bg-content/10 hover:text-content"
              : "text-content/50 hover:bg-content/10 hover:text-content"
      } focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-default disabled:opacity-40`}
    >
      {badge != null ? (
        <span
          aria-hidden
          className="absolute left-1 top-1/2 grid min-w-4 -translate-y-1/2 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-white tabular-nums"
        >
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
      <Icon
        className={`size-4 shrink-0 opacity-70 ${badge != null ? "ml-4" : ""}`}
        strokeWidth={1.75}
        aria-hidden
      />
      {!iconOnly ? (
        <span className="min-w-0 flex-1 truncate text-sm font-medium leading-tight">
          {label}
        </span>
      ) : null}
      {dot ? (
        <span aria-hidden className="size-2 shrink-0 rounded-full bg-accent" />
      ) : shortcut && !iconOnly ? (
        <span aria-hidden className="shrink-0 text-[11px] text-content/40">
          {shortcut}
        </span>
      ) : null}
    </button>
  );
}
