import type { ApplicationStatus } from "./options";
import { CLOSED_STATUSES } from "./summary";

export const BOARD_COLUMNS = [
  "wishlist",
  "applied",
  "screening",
  "interviewing",
  "offer",
  "closed",
] as const;

export type BoardColumnId = (typeof BOARD_COLUMNS)[number];

export interface BoardColumn<T> {
  readonly id: BoardColumnId;
  readonly items: readonly T[];
  readonly count: number;
}

export const columnForStatus = (status: ApplicationStatus): BoardColumnId =>
  (CLOSED_STATUSES as readonly ApplicationStatus[]).includes(status)
    ? "closed"
    : (status as BoardColumnId);

export const statusesForColumn = (column: BoardColumnId): readonly ApplicationStatus[] =>
  column === "closed" ? CLOSED_STATUSES : [column];

export const groupForBoard = <T extends { readonly status: ApplicationStatus }>(
  items: readonly T[],
): BoardColumn<T>[] =>
  BOARD_COLUMNS.map((id) => {
    const columnItems = items.filter((item) => columnForStatus(item.status) === id);
    return { id, items: columnItems, count: columnItems.length };
  });
