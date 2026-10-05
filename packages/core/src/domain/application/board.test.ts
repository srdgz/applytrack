import { describe, expect, it } from "vitest";

import { APPLICATION_STATUSES } from "./options";
import { BOARD_COLUMNS, columnForStatus, groupForBoard, statusesForColumn } from "./board";

describe("tablero", () => {
  it("CA-102-10 · devuelve las 6 columnas en orden y agrupa los estados cerrados", () => {
    const items = APPLICATION_STATUSES.map((status, index) => ({ id: index, status }));

    const columns = groupForBoard(items);

    expect(columns.map(({ id, count }) => [id, count])).toEqual([
      ["wishlist", 1],
      ["applied", 1],
      ["screening", 1],
      ["interviewing", 1],
      ["offer", 1],
      ["closed", 4],
    ]);
    expect(columns.at(-1)?.items.map(({ status }) => status)).toEqual([
      "accepted",
      "rejected",
      "withdrawn",
      "no_response",
    ]);
  });

  it("devuelve las columnas vacías y respeta el orden recibido", () => {
    const columns = groupForBoard([
      { id: "b", status: "applied" as const },
      { id: "a", status: "applied" as const },
    ]);

    expect(columns).toHaveLength(BOARD_COLUMNS.length);
    expect(columns[0]).toEqual({ id: "wishlist", items: [], count: 0 });
    expect(columns[1]?.items.map(({ id }) => id)).toEqual(["b", "a"]);
  });

  it("relaciona estados y columnas en los dos sentidos", () => {
    for (const status of APPLICATION_STATUSES) {
      expect(statusesForColumn(columnForStatus(status))).toContain(status);
    }
    expect(statusesForColumn("closed")).toHaveLength(4);
    expect(statusesForColumn("offer")).toEqual(["offer"]);
  });
});
