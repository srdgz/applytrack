import type { DemoData } from "../ports/demo-data";

export interface DemoDeps {
  readonly demo: DemoData;
}

export class IsDemoActive {
  constructor(private readonly deps: DemoDeps) {}

  execute(): Promise<boolean> {
    return this.deps.demo.isActive();
  }
}

export class StartDemo {
  constructor(private readonly deps: DemoDeps) {}

  execute(contentLocale: string): Promise<void> {
    return this.deps.demo.start(contentLocale);
  }
}

export class ResetDemo {
  constructor(private readonly deps: DemoDeps) {}

  execute(contentLocale: string): Promise<void> {
    return this.deps.demo.reset(contentLocale);
  }
}

export class ExitDemo {
  constructor(private readonly deps: DemoDeps) {}

  execute(): Promise<void> {
    return this.deps.demo.exit();
  }
}
