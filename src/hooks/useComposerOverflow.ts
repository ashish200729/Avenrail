import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import {
  composerControlsRequiredWidth,
  shouldGroupComposerOptions,
} from "../lib/composerOptions";

/** Measure the real inline controls, even while their inert host is clipped out of view. */
export function useComposerOverflow(
  controls: RefObject<HTMLDivElement | null>,
  inline: RefObject<HTMLDivElement | null>,
  onFocusComposer: () => void,
) {
  const [grouped, setGrouped] = useState(true);
  const groupedRef = useRef(grouped);
  groupedRef.current = grouped;
  const focusRef = useRef(onFocusComposer);
  focusRef.current = onFocusComposer;

  useLayoutEffect(() => {
    const bar = controls.current;
    const secondary = inline.current;
    if (!bar || !secondary) return;
    let frame: number | undefined;
    const measure = () => {
      frame = undefined;
      if (bar.clientWidth <= 0) return;
      const model = bar.querySelector<HTMLElement>("[data-model-trigger]");
      const label = model?.querySelector<HTMLElement>("[data-model-label]");
      if (!model || !label) return;
      const style = getComputedStyle(bar);
      const modelStyle = getComputedStyle(model);
      const number = (value: string) => parseFloat(value) || 0;
      const gap = number(style.columnGap);
      const modelGap = number(modelStyle.columnGap);
      const children = Array.from(model.children) as HTMLElement[];
      const naturalModel =
        children.reduce(
          (sum, child) =>
            sum +
            (child === label
              ? label.scrollWidth
              : child.getBoundingClientRect().width),
          0,
        ) +
        Math.max(0, children.length - 1) * modelGap +
        number(modelStyle.paddingLeft) +
        number(modelStyle.paddingRight);
      const cap =
        13 *
        (number(getComputedStyle(document.documentElement).fontSize) || 16);
      const secondaryWidth = secondary.getBoundingClientRect().width;
      const fixed = Array.from(
        bar.querySelectorAll<HTMLElement>(":scope > [data-composer-fixed]"),
      ).map((node) => node.getBoundingClientRect().width);
      const available =
        bar.clientWidth -
        number(style.paddingLeft) -
        number(style.paddingRight);
      const required = composerControlsRequiredWidth(
        Math.min(cap, naturalModel),
        secondaryWidth,
        fixed,
        gap,
      );
      const next =
        secondaryWidth > 0 &&
        shouldGroupComposerOptions(available, required, groupedRef.current);
      if (next === groupedRef.current) return;
      if (bar.contains(document.activeElement)) focusRef.current();
      groupedRef.current = next;
      setGrouped(next);
    };
    const schedule = () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    const resize =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(schedule)
        : null;
    resize?.observe(bar);
    resize?.observe(secondary);
    const mutation = new MutationObserver(schedule);
    mutation.observe(bar, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    window.addEventListener("resize", schedule);
    document.fonts?.addEventListener("loadingdone", schedule);
    return () => {
      resize?.disconnect();
      mutation.disconnect();
      window.removeEventListener("resize", schedule);
      document.fonts?.removeEventListener("loadingdone", schedule);
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [controls, inline]);
  return grouped;
}
