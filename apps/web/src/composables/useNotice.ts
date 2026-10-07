import { useI18n } from "vue-i18n";

import { useToast } from "./useToast";

const NOTICE_KEY = "applytrack:notice";

export type Notice =
  { readonly kind: "signedIn"; readonly email: string } | { readonly kind: "signedOut" };

export const rememberNotice = (notice: Notice): void => {
  try {
    window.sessionStorage.setItem(NOTICE_KEY, JSON.stringify(notice));
  } catch {
    return;
  }
};

const takeNotice = (): Notice | null => {
  try {
    const raw = window.sessionStorage.getItem(NOTICE_KEY);
    window.sessionStorage.removeItem(NOTICE_KEY);
    if (raw === null) return null;
    const notice = JSON.parse(raw) as Partial<Notice>;
    if (notice.kind === "signedOut") return { kind: "signedOut" };
    if (notice.kind === "signedIn" && typeof notice.email === "string") {
      return { kind: "signedIn", email: notice.email };
    }
    return null;
  } catch {
    return null;
  }
};

export const useNotice = () => {
  const { t } = useI18n();
  const toast = useToast();

  const showPending = () => {
    const notice = takeNotice();
    if (notice?.kind === "signedIn") {
      toast.success(t("auth.signedInTitle", { email: notice.email }));
    } else if (notice?.kind === "signedOut") {
      toast.info(t("auth.signedOutTitle"));
    }
  };

  return { showPending };
};
