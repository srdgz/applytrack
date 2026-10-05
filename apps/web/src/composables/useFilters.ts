import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import type { Filters } from "../query/url-query";
import {
  countActiveFilters,
  filtersFromQuery,
  queryFromFilters,
  withoutFilters,
} from "../query/url-query";

export const useFilters = () => {
  const route = useRoute();
  const router = useRouter();

  const filters = computed(() => filtersFromQuery(route.query));
  const activeCount = computed(() => countActiveFilters(filters.value));

  const update = async (patch: Partial<Filters>, { replace = false } = {}) => {
    const location = { query: queryFromFilters({ ...filters.value, ...patch }) };
    await (replace ? router.replace(location) : router.push(location));
  };

  const clear = () => router.push({ query: queryFromFilters(withoutFilters(filters.value)) });

  return { filters, activeCount, update, clear };
};
