import type { Filters } from "@applytrack/presentation";
import { DEFAULT_FILTERS, withoutFilters } from "@applytrack/presentation";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface FiltersApi {
  readonly filters: Filters;
  readonly update: (changes: Partial<Filters>) => void;
  readonly clear: () => void;
}

const FiltersContext = createContext<FiltersApi | null>(null);

export const FiltersProvider = ({ children }: { readonly children: ReactNode }) => {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const update = useCallback((changes: Partial<Filters>) => {
    setFilters((current) => ({ ...current, ...changes }));
  }, []);

  const clear = useCallback(() => {
    setFilters((current) => withoutFilters(current));
  }, []);

  const value = useMemo(() => ({ filters, update, clear }), [filters, update, clear]);

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
};

export const useFilters = (): FiltersApi => {
  const api = useContext(FiltersContext);
  if (!api) throw new Error("FiltersProvider is missing");
  return api;
};
