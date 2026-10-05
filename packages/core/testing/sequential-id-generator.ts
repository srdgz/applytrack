import type { IdGenerator } from "../src";

export class SequentialIdGenerator implements IdGenerator {
  private counter = 0;

  constructor(private readonly prefix = "app") {}

  next(): string {
    this.counter += 1;
    return `${this.prefix}-${String(this.counter)}`;
  }
}
