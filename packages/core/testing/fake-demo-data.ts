import type { DemoData } from "../src";

export class FakeDemoData implements DemoData {
  active = false;
  calls: string[] = [];

  isActive(): Promise<boolean> {
    return Promise.resolve(this.active);
  }

  start(contentLocale: string): Promise<void> {
    this.active = true;
    this.calls.push(`start:${contentLocale}`);
    return Promise.resolve();
  }

  reset(contentLocale: string): Promise<void> {
    this.calls.push(`reset:${contentLocale}`);
    return Promise.resolve();
  }

  exit(): Promise<void> {
    this.active = false;
    this.calls.push("exit");
    return Promise.resolve();
  }
}
