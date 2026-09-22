import { useMemo, useSyncExternalStore } from "react";
import {
  getModelSnapshot,
  resolveModel,
  subscribeModels,
  type ModelSetting,
} from "../lib/models";
import type { HarnessId } from "../lib/session";

export function useModelSettings(
  harness: HarnessId,
  model: string,
): ModelSetting[] {
  const catalog = useSyncExternalStore(
    subscribeModels,
    getModelSnapshot,
    getModelSnapshot,
  );
  return useMemo(() => {
    void catalog;
    const order = [
      "variant",
      "agent",
      "effort",
      "reasoning",
      "thinking",
      "fast",
      "context",
    ];
    return [...(resolveModel(harness, model).settings ?? [])].sort((a, b) => {
      const ai = order.indexOf(a.id);
      const bi = order.indexOf(b.id);
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });
  }, [catalog, harness, model]);
}
