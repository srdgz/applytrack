import type { ApplicationUseCaseError } from "@applytrack/core";
import type { TFunction } from "i18next";

export const describeApplicationError = (t: TFunction, error: ApplicationUseCaseError): string =>
  error.code === "INVALID_STATUS_TRANSITION"
    ? t("errors.INVALID_STATUS_TRANSITION", {
        from: t(`status.${error.from}`),
        to: t(`status.${error.to}`),
      })
    : t(`errors.${error.code}`);
