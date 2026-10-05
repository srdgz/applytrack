import { computed, ref, watch } from "vue";

import { matchesMedia, useMediaQuery } from "./useMediaQuery";

export const SIDEBAR_KEY = "applytrack:sidebar";
export const COLLAPSIBLE_QUERY = "(min-width: 64rem)";
export const WIDE_QUERY = "(min-width: 96rem)";

const readStored = (): boolean | null => {
  try {
    const value = window.localStorage.getItem(SIDEBAR_KEY);
    return value === null ? null : value === "collapsed";
  } catch {
    return null;
  }
};

const store = (collapsed: boolean): void => {
  try {
    window.localStorage.setItem(SIDEBAR_KEY, collapsed ? "collapsed" : "expanded");
  } catch {
    return;
  }
};

export const useSidebar = () => {
  const collapsible = useMediaQuery(COLLAPSIBLE_QUERY);
  const collapsed = ref(readStored() ?? !matchesMedia(WIDE_QUERY));

  watch(collapsed, store);

  return {
    collapsible,
    collapsed,
    expanded: computed(() => collapsible.value && !collapsed.value),
    toggle: () => {
      collapsed.value = !collapsed.value;
    },
  };
};
