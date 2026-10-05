import { foldForComparison } from "../shared/text";
import type { ApplicationSnapshot } from "./application";

export const uniqueTags = (applications: readonly ApplicationSnapshot[]): string[] => {
  const newestFirst = [...applications].sort((a, b) =>
    a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0,
  );

  const byKey = new Map<string, string>();
  for (const application of newestFirst) {
    for (const tag of application.tags) {
      const key = foldForComparison(tag);
      if (!byKey.has(key)) byKey.set(key, tag);
    }
  }

  return [...byKey.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([, tag]) => tag);
};
