import { readonly, ref } from "vue";

const TOAST_MS = 5000;

const message = ref<string | null>(null);
let timer: ReturnType<typeof setTimeout> | undefined;

export const showToast = (text: string): void => {
  clearTimeout(timer);
  message.value = text;
  timer = setTimeout(() => {
    message.value = null;
  }, TOAST_MS);
};

export const useToast = () => readonly(message);
