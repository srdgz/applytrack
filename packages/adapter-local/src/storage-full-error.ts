export class StorageFullError extends Error {
  constructor(cause: unknown) {
    super("The device storage rejected the write", { cause });
    this.name = "StorageFullError";
  }
}
