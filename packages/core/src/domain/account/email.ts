import type { FieldIssue } from "../application/field-issue";
import type { Brand } from "../shared/brand";
import type { Result } from "../shared/result";
import { err, ok } from "../shared/result";

export type Email = Brand<string, "Email">;

export const EMAIL_MAX_LENGTH = 254;

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (value: string): Result<Email, FieldIssue> => {
  const email = value.trim().toLowerCase();
  if (email === "") return err({ field: "email", code: "REQUIRED_FIELD" });
  if (email.length > EMAIL_MAX_LENGTH || !EMAIL_SHAPE.test(email)) {
    return err({ field: "email", code: "INVALID_EMAIL" });
  }
  return ok(email as Email);
};
