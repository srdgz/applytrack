import type {
  ApplicationQuery,
  ApplicationSort,
  ApplicationSource,
  ApplicationStatus,
  ArchivedFilter,
  SortDirection,
  SortField,
  WorkMode,
} from "@applytrack/core";
import {
  APPLICATION_SOURCES,
  APPLICATION_STATUSES,
  ARCHIVED_FILTERS,
  DEFAULT_SORT,
  SORT_DIRECTIONS,
  SORT_FIELDS,
  WORK_MODES,
} from "@applytrack/core";

export interface Filters {
  readonly text: string;
  readonly statuses: readonly ApplicationStatus[];
  readonly workModes: readonly WorkMode[];
  readonly sources: readonly ApplicationSource[];
  readonly tags: readonly string[];
  readonly archived: ArchivedFilter;
  readonly sort: ApplicationSort;
}

export type RawQuery = Readonly<
  Record<string, string | null | readonly (string | null)[] | undefined>
>;

export const DEFAULT_FILTERS: Filters = {
  text: "",
  statuses: [],
  workModes: [],
  sources: [],
  tags: [],
  archived: "exclude",
  sort: DEFAULT_SORT,
};

export const defaultDirection = (field: SortField): SortDirection =>
  field === "company" ? "asc" : "desc";

const first = (value: RawQuery[string]): string => {
  const raw = Array.isArray(value) ? (value as readonly (string | null)[])[0] : value;
  return typeof raw === "string" ? raw : "";
};

const values = (value: RawQuery[string]): string[] => [
  ...new Set(
    first(value)
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== ""),
  ),
];

const oneOf = <T extends string>(options: readonly T[], value: string): value is T =>
  (options as readonly string[]).includes(value);

const pick = <T extends string>(options: readonly T[], value: RawQuery[string]): T[] =>
  values(value).filter((item): item is T => oneOf(options, item));

export const filtersFromQuery = (query: RawQuery): Filters => {
  const sortValue = first(query.sort);
  const field: SortField = oneOf(SORT_FIELDS, sortValue) ? sortValue : DEFAULT_SORT.field;
  const dirValue = first(query.dir);
  const archivedValue = first(query.archived);

  return {
    text: first(query.q).trim(),
    statuses: pick(APPLICATION_STATUSES, query.status),
    workModes: pick(WORK_MODES, query.mode),
    sources: pick(APPLICATION_SOURCES, query.source),
    tags: values(query.tag),
    archived: oneOf(ARCHIVED_FILTERS, archivedValue) ? archivedValue : DEFAULT_FILTERS.archived,
    sort: {
      field,
      direction: oneOf(SORT_DIRECTIONS, dirValue) ? dirValue : defaultDirection(field),
    },
  };
};

export const queryFromFilters = (filters: Filters): Record<string, string> => {
  const query: Record<string, string> = {};
  const text = filters.text.trim();
  if (text) query.q = text;
  if (filters.statuses.length) query.status = filters.statuses.join(",");
  if (filters.workModes.length) query.mode = filters.workModes.join(",");
  if (filters.sources.length) query.source = filters.sources.join(",");
  if (filters.tags.length) query.tag = filters.tags.join(",");
  if (filters.archived !== DEFAULT_FILTERS.archived) query.archived = filters.archived;

  const { field, direction } = filters.sort;
  const isDefaultField = field === DEFAULT_SORT.field;
  if (!isDefaultField) query.sort = field;
  if (direction !== defaultDirection(field)) query.dir = direction;
  return query;
};

export const toApplicationQuery = (filters: Filters): Partial<ApplicationQuery> => ({
  ...(filters.text && { text: filters.text }),
  statuses: filters.statuses,
  workModes: filters.workModes,
  sources: filters.sources,
  tags: filters.tags,
  archived: filters.archived,
  sort: filters.sort,
});

export const countActiveFilters = (filters: Filters): number =>
  (filters.text ? 1 : 0) +
  filters.statuses.length +
  filters.workModes.length +
  filters.sources.length +
  filters.tags.length +
  (filters.archived === DEFAULT_FILTERS.archived ? 0 : 1);

export const withoutFilters = (filters: Filters): Filters => ({
  ...DEFAULT_FILTERS,
  sort: filters.sort,
});
