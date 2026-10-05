import { onScopeDispose, ref } from "vue";

export const matchesMedia = (query: string): boolean =>
  typeof window.matchMedia === "function" && window.matchMedia(query).matches;

export const useMediaQuery = (query: string) => {
  const matches = ref(matchesMedia(query));
  if (typeof window.matchMedia !== "function") return matches;

  const list = window.matchMedia(query);
  const onChange = (event: MediaQueryListEvent) => {
    matches.value = event.matches;
  };
  list.addEventListener("change", onChange);
  onScopeDispose(() => {
    list.removeEventListener("change", onChange);
  });
  return matches;
};
