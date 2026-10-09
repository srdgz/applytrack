import { ids } from "./boot";

jest.mock("expo-crypto", () => ({
  randomUUID: () => "123e4567-e89b-42d3-a456-426614174000",
}));

describe("boot", () => {
  it("genera los ids con expo-crypto y no con el crypto global, que Hermes no tiene", () => {
    const original = globalThis.crypto;
    Object.defineProperty(globalThis, "crypto", { value: undefined, configurable: true });
    try {
      expect(ids.next()).toBe("123e4567-e89b-42d3-a456-426614174000");
    } finally {
      Object.defineProperty(globalThis, "crypto", { value: original, configurable: true });
    }
  });
});
