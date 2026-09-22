const MAX_FIELD_HEIGHT = 160;

/** Keep the highlighted text aligned with the textarea, including its scrollbar gutter. */
export function resizeComposerField(
  field: HTMLTextAreaElement,
  highlight: HTMLDivElement | null,
) {
  if (field.clientWidth <= 0) return;
  const scrollTop = field.scrollTop;
  field.style.height = "auto";
  field.style.height = `${Math.min(field.scrollHeight, MAX_FIELD_HEIGHT)}px`;
  field.scrollTop = scrollTop;
  if (highlight) {
    highlight.style.width = `${field.clientWidth}px`;
    highlight.scrollTop = field.scrollTop;
    highlight.scrollLeft = field.scrollLeft;
  }
}

/** Resize on pane-width changes without reacting recursively to our own height writes. */
export function observeComposerSizing(
  field: HTMLTextAreaElement,
  highlight: () => HTMLDivElement | null,
): () => void {
  let width = field.clientWidth;
  let frame: number | undefined;
  const resize = () => resizeComposerField(field, highlight());
  resize();
  const onResize = () => {
    const nextWidth = field.clientWidth;
    if (nextWidth === width) return;
    width = nextWidth;
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
    if (width <= 0) return;
    frame = requestAnimationFrame(() => {
      frame = undefined;
      if (field.isConnected) resize();
    });
  };
  const observer =
    typeof ResizeObserver !== "undefined" ? new ResizeObserver(onResize) : null;
  if (observer) observer.observe(field);
  else window.addEventListener("resize", onResize);
  return () => {
    observer?.disconnect();
    if (!observer) window.removeEventListener("resize", onResize);
    if (frame !== undefined) cancelAnimationFrame(frame);
  };
}
