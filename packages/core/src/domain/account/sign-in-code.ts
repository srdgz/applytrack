import type { FieldIssue } from "../application/field-issue";
import type { Result } from "../shared/result";
import { err, ok } from "../shared/result";

export const SIGN_IN_CODE_LENGTH = 6;

const CODE_SHAPE = /^\d{6}$/;

export const validateSignInCode = (value: string): Result<string, FieldIssue> => {
  const code = value.replace(/\s/g, "");
  if (code === "") return err({ field: "code", code: "REQUIRED_FIELD" });
  if (!CODE_SHAPE.test(code)) {
    return err({
      field: "code",
      code: "INVALID_CODE_FORMAT",
      meta: { length: SIGN_IN_CODE_LENGTH },
    });
  }
  return ok(code);
};
