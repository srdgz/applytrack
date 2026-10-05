import { onScopeDispose, ref } from "vue";

const version = ref(0);

export const bumpDataVersion = (): void => {
  version.value += 1;
};

export const useDataVersion = () => {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key.startsWith("applytrack:")) bumpDataVersion();
  };
  window.addEventListener("storage", onStorage);
  onScopeDispose(() => {
    window.removeEventListener("storage", onStorage);
  });
  return version;
};
