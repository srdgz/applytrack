import { describe, expect, it } from "vitest";

import { toAuthFailure } from "./auth-failure";

describe("toAuthFailure", () => {
  it.each([
    [{ code: "over_email_send_rate_limit", status: 429 }, "request", "RATE_LIMITED"],
    [{ code: "over_request_rate_limit" }, "verify", "RATE_LIMITED"],
    [{ status: 429 }, "request", "RATE_LIMITED"],
    [{ code: "otp_expired", status: 403 }, "verify", "INVALID_CODE"],
    [{ status: 401 }, "verify", "INVALID_CODE"],
    [{ status: 403 }, "request", "AUTH_UNAVAILABLE"],
    [{ status: 0 }, "request", "AUTH_UNAVAILABLE"],
    [{ code: "unexpected_failure", status: 500 }, "verify", "AUTH_UNAVAILABLE"],
  ] as const)("%o al %s → %s", (error, context, expected) => {
    expect(toAuthFailure(error, context)).toBe(expected);
  });
});
