import { foldForComparison } from "../shared/text";
import type { ApplicationSnapshot } from "./application";
import type { FieldIssue } from "./field-issue";
import type { ApplicationSource, ApplicationStatus, WorkMode } from "./options";

export const SORT_FIELDS = ["company", "appliedAt", "updatedAt"] as const;
export const SORT_DIRECTIONS = ["asc", "desc"] as const;
export const ARCHIVED_FILTERS = ["exclude", "only", "include"] as const;

export type SortField = (typeof SORT_FIELDS)[number];
export type SortDirection = (typeof SORT_DIRECTIONS)[number];
export type ArchivedFilter = (typeof ARCHIVED_FILTERS)[number];

export interface ApplicationSort {
  readonly field: SortField;
  readonly direction: SortDirection;
}

export interface ApplicationQuery {
  readonly text?: string;
  readonly statuses?: readonly ApplicationStatus[];
  readonly workModes?: readonly WorkMode[];
  readonly sources?: readonly ApplicationSource[];
  readonly tags?: readonly string[];
  readonly archived: ArchivedFilter;
  readonly sort: ApplicationSort;
  readonly offset: number;
  readonly limit: number;
}

export interface Page<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly offset: number;
  readonly limit: number;
}

export const DEFAULT_SORT: ApplicationSort = { field: "updatedAt", direction: "desc" };
export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 500;

export const completeQuery = (partial: Partial<ApplicationQuery> = {}): ApplicationQuery => ({
  archived: "exclude",
  sort: DEFAULT_SORT,
  offset: 0,
  limit: DEFAULT_LIMIT,
  ...partial,
});

export const validateQuery = (query: ApplicationQuery): FieldIssue[] => {
  const issues: FieldIssue[] = [];
  if (!Number.isInteger(query.limit) || query.limit < 1 || query.limit > MAX_LIMIT) {
    issues.push({ field: "limit", code: "INVALID_OPTION", meta: { min: 1, max: MAX_LIMIT } });
  }
  if (!Number.isInteger(query.offset) || query.offset < 0) {
    issues.push({ field: "offset", code: "INVALID_OPTION", meta: { min: 0 } });
  }
  return issues;
};

const words = (text: string | undefined): string[] =>
  foldForComparison(text ?? "")
    .split(/\s+/)
    .filter((word) => word !== "");

const includesAny = <T>(selected: readonly T[] | undefined, value: T): boolean =>
  selected === undefined || selected.length === 0 || selected.includes(value);

const matchesArchived = (filter: ArchivedFilter, archived: boolean): boolean =>
  filter === "include" || (filter === "only") === archived;

export const matchesQuery = (
  application: ApplicationSnapshot,
  query: ApplicationQuery,
): boolean => {
  if (!matchesArchived(query.archived, application.archived)) return false;
  if (!includesAny(query.statuses, application.status)) return false;
  if (!includesAny(query.workModes, application.workMode)) return false;
  if (!includesAny(query.sources, application.source)) return false;

  const tags = application.tags.map(foldForComparison);
  if (query.tags && query.tags.length > 0) {
    const wanted = query.tags.map(foldForComparison);
    if (!wanted.some((tag) => tags.includes(tag))) return false;
  }

  const haystack = [
    foldForComparison(application.company),
    foldForComparison(application.position),
    ...tags,
  ];
  return words(query.text).every((word) => haystack.some((field) => field.includes(word)));
};

const compareStrings = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

const compareField = (
  a: ApplicationSnapshot,
  b: ApplicationSnapshot,
  { field, direction }: ApplicationSort,
): number => {
  const sign = direction === "asc" ? 1 : -1;

  if (field === "appliedAt") {
    if (a.appliedAt === undefined || b.appliedAt === undefined) {
      return (a.appliedAt === undefined ? 1 : 0) - (b.appliedAt === undefined ? 1 : 0);
    }
    return sign * compareStrings(a.appliedAt, b.appliedAt);
  }

  if (field === "company") {
    return sign * compareStrings(foldForComparison(a.company), foldForComparison(b.company));
  }

  return sign * compareStrings(a.updatedAt, b.updatedAt);
};

export const compareForQuery =
  (sort: ApplicationSort) =>
  (a: ApplicationSnapshot, b: ApplicationSnapshot): number =>
    compareField(a, b, sort) || compareStrings(a.id, b.id);

export const applyQuery = (
  applications: readonly ApplicationSnapshot[],
  query: ApplicationQuery,
): Page<ApplicationSnapshot> => {
  const matching = applications
    .filter((application) => matchesQuery(application, query))
    .sort(compareForQuery(query.sort));

  return {
    items: matching.slice(query.offset, query.offset + query.limit),
    total: matching.length,
    offset: query.offset,
    limit: query.limit,
  };
};
