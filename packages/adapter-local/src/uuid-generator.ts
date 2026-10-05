import type { IdGenerator } from "@applytrack/core";

export class UuidGenerator implements IdGenerator {
  constructor(private readonly randomUuid: () => string) {}

  next(): string {
    return this.randomUuid();
  }
}
