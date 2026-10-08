const native = {
  RelativeTimeFormat: Intl.RelativeTimeFormat,
  PluralRules: Intl.PluralRules,
};

const intl = Intl as unknown as Record<string, unknown>;

afterEach(() => {
  intl.RelativeTimeFormat = native.RelativeTimeFormat;
  intl.PluralRules = native.PluralRules;
});

describe("Intl en el móvil", () => {
  it("los polyfills cubren lo que falta en Hermes en español e inglés", () => {
    delete intl.RelativeTimeFormat;
    delete intl.PluralRules;

    jest.isolateModules(() => {
      jest.requireActual("./intl-polyfills");
    });

    expect(Intl.RelativeTimeFormat).not.toBe(native.RelativeTimeFormat);
    expect(new Intl.RelativeTimeFormat("es", { numeric: "auto" }).format(-1, "day")).toBe("ayer");
    expect(new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(-5, "day")).toBe(
      "5 days ago",
    );
    expect(new Intl.PluralRules("es").select(1)).toBe("one");
    expect(new Intl.PluralRules("en").select(2)).toBe("other");
  });
});
