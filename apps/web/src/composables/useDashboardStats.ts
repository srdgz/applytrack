import type { DashboardStats } from "@applytrack/core";
import { ref, shallowRef, watch } from "vue";
import { useRouter } from "vue-router";

import { useUseCases } from "../di/use-cases";
import { useDataVersion } from "./useDataVersion";

export const useDashboardStats = () => {
  const { getDashboardStats } = useUseCases();
  const router = useRouter();
  const dataVersion = useDataVersion();

  const stats = shallowRef<DashboardStats | null>(null);
  const status = ref<"loading" | "ready" | "error">("loading");

  const load = async () => {
    status.value = "loading";
    try {
      const result = await getDashboardStats.execute();
      if (result.ok) {
        stats.value = result.value;
        status.value = "ready";
      } else {
        if (result.error.code === "UNAUTHENTICATED") await router.replace({ name: "start" });
        status.value = "error";
      }
    } catch {
      status.value = "error";
    }
  };

  watch(dataVersion, load, { immediate: true });

  return { stats, status, reload: load };
};
