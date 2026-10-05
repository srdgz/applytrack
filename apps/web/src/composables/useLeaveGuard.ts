import type { Ref } from "vue";
import { onBeforeUnmount, onMounted } from "vue";
import { onBeforeRouteLeave } from "vue-router";

export const useLeaveGuard = (isDirty: Readonly<Ref<boolean>>, message: () => string) => {
  const onBeforeUnload = (event: BeforeUnloadEvent) => {
    if (isDirty.value) event.preventDefault();
  };

  onMounted(() => {
    window.addEventListener("beforeunload", onBeforeUnload);
  });
  onBeforeUnmount(() => {
    window.removeEventListener("beforeunload", onBeforeUnload);
  });

  onBeforeRouteLeave(() => !isDirty.value || window.confirm(message()));
};
