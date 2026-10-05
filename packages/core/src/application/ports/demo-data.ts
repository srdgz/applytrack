export interface DemoData {
  isActive(): Promise<boolean>;
  start(contentLocale: string): Promise<void>;
  reset(contentLocale: string): Promise<void>;
  exit(): Promise<void>;
}
