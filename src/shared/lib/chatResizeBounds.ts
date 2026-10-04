/** Enough space for the composer controls without entering the compact layout. */
export const MIN_CHAT_PANE_WIDTH = 600;

/** Both sidebars spend the same remaining chat-space budget. */
export function chatPreservingMaxWidth(
  pane: HTMLElement | null,
  configuredMax: number,
): number {
  if (!pane || getComputedStyle(pane).position === "absolute") {
    return configuredMax;
  }
  const chat = pane
    .closest("[data-workspace-shell]")
    ?.querySelector<HTMLElement>("[data-workspace-chat]");
  const chatWidth = chat?.getBoundingClientRect().width ?? 0;
  const paneWidth = pane.getBoundingClientRect().width;
  // Hidden chrome and standalone surfaces have no shared layout to constrain.
  if (chatWidth <= 0 || paneWidth <= 0) return configuredMax;
  return Math.min(configuredMax, paneWidth + chatWidth - MIN_CHAT_PANE_WIDTH);
}

export function chatResizeContainer(pane: HTMLElement): Element | null {
  return pane.closest("[data-workspace-shell]");
}
