import { usesPrivateIpHost } from "./redirect-url";

describe("usesPrivateIpHost", () => {
  it.each([
    ["exp://192.168.1.40:8081/--/auth/callback", true],
    ["exp://10.0.0.2:8081/--/auth/callback", true],
    ["exp://127.0.0.1:8081/--/auth/callback", false],
    ["exp://abc-anonymous-8081.exp.direct/--/auth/callback", false],
    ["applytrack://auth/callback", false],
    ["no es una url", false],
  ])("%s → %s", (url, expected) => {
    expect(usesPrivateIpHost(url)).toBe(expected);
  });
});
