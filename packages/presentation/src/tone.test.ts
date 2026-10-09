import { APPLICATION_STATUSES, BOARD_COLUMNS } from "@applytrack/core";
import { describe, expect, it } from "vitest";

import { columnTone, companyInitials, STATUS_TONES, statusTone } from "./tone";

describe("statusTone", () => {
  it("CA-116-03 · da un tono a cada estado", () => {
    for (const status of APPLICATION_STATUSES) {
      expect(STATUS_TONES).toContain(statusTone(status));
    }
    expect(statusTone("applied")).toBe("applied");
    expect(statusTone("accepted")).toBe("offer");
    expect(statusTone("rejected")).toBe("rejected");
    expect(statusTone("withdrawn")).toBe("closed");
    expect(statusTone("no_response")).toBe("closed");
  });

  it("da un tono a cada columna del tablero", () => {
    expect(BOARD_COLUMNS.map(columnTone)).toEqual([
      "wishlist",
      "applied",
      "screening",
      "interviewing",
      "offer",
      "closed",
    ]);
  });
});

describe("companyInitials", () => {
  it("CA-116-03 · toma la inicial de las dos primeras palabras", () => {
    expect(companyInitials("Nimbus Labs")).toBe("NL");
    expect(companyInitials("Atlas Retail Tech")).toBe("AR");
  });

  it("toma dos letras si solo hay una palabra", () => {
    expect(companyInitials("Kraken")).toBe("KR");
    expect(companyInitials("X")).toBe("X");
  });

  it("ignora símbolos y respeta acentos", () => {
    expect(companyInitials("  Ñandú & Co. ")).toBe("ÑC");
    expect(companyInitials("órbita-data")).toBe("ÓD");
    expect(companyInitials("@@@")).toBe("?");
  });
});
