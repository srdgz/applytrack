import type { RouteLocationRaw } from "vue-router";
import { useRouter } from "vue-router";

export const useGoBack = () => {
  const router = useRouter();

  return async (fallback: RouteLocationRaw): Promise<void> => {
    if (typeof router.options.history.state.back === "string") router.back();
    else await router.push(fallback);
  };
};
