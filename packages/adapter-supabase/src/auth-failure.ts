import type { AuthFailure } from "@applytrack/core";

interface AuthErrorLike {
  readonly code?: string | undefined;
  readonly status?: number | undefined;
}

const RATE_LIMIT_CODES = new Set(["over_email_send_rate_limit", "over_request_rate_limit"]);
const INVALID_CODE_CODES = new Set(["otp_expired", "invalid_credentials"]);

export const toAuthFailure = (error: AuthErrorLike, context: "request" | "verify"): AuthFailure => {
  if ((error.code !== undefined && RATE_LIMIT_CODES.has(error.code)) || error.status === 429) {
    return "RATE_LIMITED";
  }
  if (context === "verify") {
    if (error.code !== undefined && INVALID_CODE_CODES.has(error.code)) return "INVALID_CODE";
    if (error.status === 401 || error.status === 403) return "INVALID_CODE";
  }
  return "AUTH_UNAVAILABLE";
};
