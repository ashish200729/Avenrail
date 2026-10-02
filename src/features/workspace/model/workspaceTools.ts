import {
  splitSizesAtBoundary,
  type LayoutNode,
  type WorkspaceTab,
} from "./layout";

export type WorkspaceTool = "files" | "changes" | "terminal";
export type WorkspaceRequest = {
  tabId?: string;
  kind: WorkspaceTool | "file";
  path?: string;
  token: number;
};
export type WorkspaceView = { order: string[]; activeId: string | null };

export function openWorkspaceView(
  view: WorkspaceView,
  id: string,
): WorkspaceView {
  // Selecting a file turns the empty Files tab into that file's permanent tab.
  const hasPlaceholder = id.startsWith("file:") && view.order.includes("files");
  if (view.order.includes(id) && !hasPlaceholder)
    return { ...view, activeId: id };
  const order = view.order.filter((item) => item !== id);
  const placeholder = hasPlaceholder ? order.indexOf("files") : -1;
  if (placeholder >= 0) order.splice(placeholder, 1, id);
  else order.push(id);
  return { order, activeId: id };
}

export function closeWorkspaceView(
  view: WorkspaceView,
  id: string,
): WorkspaceView {
  const index = view.order.indexOf(id);
  const order = view.order.filter((item) => item !== id);
  return {
    order,
    activeId:
      view.activeId === id
        ? (order[Math.min(Math.max(index, 0), order.length - 1)] ?? null)
        : view.activeId,
  };
}

export function reconcileWorkspaceView(
  view: WorkspaceView,
  available: string[],
): WorkspaceView {
  let next = view;
  for (const id of view.order) {
    if (id.startsWith("file:") && !available.includes(id))
      next = closeWorkspaceView(next, id);
  }
  const order = [
    ...next.order,
    ...available.filter((id) => !next.order.includes(id)),
  ];
  if (
    order.join("\0") === view.order.join("\0") &&
    next.activeId === view.activeId
  )
    return view;
  return { order, activeId: next.activeId ?? order[0] ?? null };
}

/** Presentation-only projection. The stored split tree and editor ownership stay intact. */
export function sessionOnlyLayout(tab: WorkspaceTab): LayoutNode | null {
  const surfaces = new Set(
    [...tab.editorPanes, ...(tab.terminalPanes ?? [])].map((pane) => pane.id),
  );
  const visit = (node: LayoutNode): LayoutNode | null => {
    if (node.type === "leaf") return surfaces.has(node.id) ? null : node;
    const kept = node.children.flatMap((child, index) => {
      const projected = visit(child);
      return projected
        ? [{ node: projected, size: node.sizes[index] ?? 1 }]
        : [];
    });
    if (!kept.length) return null;
    if (kept.length === 1) return kept[0].node;
    if (
      kept.every((item, index) => item.node === node.children[index]) &&
      kept.length === node.children.length
    )
      return node;
    const total = kept.reduce((sum, item) => sum + item.size, 0);
    return {
      ...node,
      children: kept.map((item) => item.node),
      sizes: kept.map((item) =>
        total > 0 ? item.size / total : 1 / kept.length,
      ),
    };
  };
  return visit(tab.layout);
}

/** Apply a visible chat sash without resizing hidden editor leaves in the stored layout. */
export function setSessionSplitRatio(
  tab: WorkspaceTab,
  splitId: string,
  index: number,
  boundary: number,
): LayoutNode {
  const surfaces = new Set(
    [...tab.editorPanes, ...(tab.terminalPanes ?? [])].map((pane) => pane.id),
  );
  const hasSession = (node: LayoutNode): boolean =>
    node.type === "leaf"
      ? !surfaces.has(node.id)
      : node.children.some(hasSession);
  const visit = (node: LayoutNode): LayoutNode => {
    if (node.type === "leaf") return node;
    if (node.id !== splitId)
      return { ...node, children: node.children.map(visit) };
    const indices = node.children.flatMap((child, i) =>
      hasSession(child) ? [i] : [],
    );
    const total = indices.reduce((sum, i) => sum + node.sizes[i], 0);
    if (!total || index < 0 || index >= indices.length - 1) return node;
    const adjusted = splitSizesAtBoundary(
      indices.map((i) => node.sizes[i] / total),
      index,
      boundary,
    );
    const sizes = [...node.sizes];
    indices.forEach((original, i) => {
      sizes[original] = adjusted[i] * total;
    });
    return { ...node, sizes };
  };
  return visit(tab.layout);
}
