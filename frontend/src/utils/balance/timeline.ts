import type { Transaction } from "../../types/transaction";
import type { BalanceCheckpoint } from "../../types/balance";

/**
 * Timeline order. Everything (transactions and balance pins) gets a sort key
 * [date, id, kind]. A pin placed "after transaction N" gets [date, N, 1], so it
 * sorts right after that transaction. A pin with id 0 sorts before every
 * transaction of its date. A starting-balance pin (is_opening) sorts before all
 * of history, so every transaction counts. This mirrors BalanceCheckpoint on
 * the backend.
 */
type Key = [string, number, number];

export const effectiveDate = (t: Transaction): string =>
  t.transaction_date ?? t.created_at.split("T")[0];

const txKey = (t: Transaction): Key => [effectiveDate(t), t.transaction_id, 0];
const cpKey = (c: BalanceCheckpoint): Key =>
  c.is_opening ? ["", 0, 1] : [c.as_of_date, c.after_transaction_id, 1];

const compareKeys = (a: Key, b: Key): number =>
  a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] - b[1] || a[2] - b[2];

const compareCheckpoints = (a: BalanceCheckpoint, b: BalanceCheckpoint): number =>
  compareKeys(cpKey(a), cpKey(b)) || a.id - b.id;

const signedAmount = (t: Transaction): number => {
  const value = parseFloat(t.amount);
  return t.transaction_type === "credit" ? value : -value;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** The newest pin is the anchor: balance counts forward from it. */
export const getAnchor = (checkpoints: BalanceCheckpoint[]): BalanceCheckpoint | null =>
  checkpoints.length ? [...checkpoints].sort(compareCheckpoints).at(-1)! : null;

/** Transactions newer than the anchor still count; older ones are already inside it. */
export const isBeforeAnchor = (t: Transaction, anchor: BalanceCheckpoint | null): boolean =>
  anchor !== null && compareKeys(txKey(t), cpKey(anchor)) < 0;

export const getAnchoredBalance = (
  transactions: Transaction[],
  checkpoints: BalanceCheckpoint[],
): { balance: number; anchor: BalanceCheckpoint | null } => {
  const anchor = getAnchor(checkpoints);
  const counted = transactions.filter((t) => !isBeforeAnchor(t, anchor));
  const net = counted.reduce((sum, t) => sum + signedAmount(t), 0);
  return { balance: round2((anchor ? parseFloat(anchor.amount) : 0) + net), anchor };
};

export type TimelineItem =
  | { kind: "txn"; transaction: Transaction }
  | { kind: "pin"; checkpoint: BalanceCheckpoint; isAnchor: boolean };

/** Newest first. Pass an empty checkpoints array to get transactions only. */
export const buildTimeline = (
  transactions: Transaction[],
  checkpoints: BalanceCheckpoint[],
): TimelineItem[] => {
  const anchor = getAnchor(checkpoints);
  const items: { item: TimelineItem; key: Key; tie: number }[] = [
    ...transactions.map((t) => ({
      item: { kind: "txn", transaction: t } as TimelineItem,
      key: txKey(t),
      tie: 0,
    })),
    ...checkpoints.map((c) => ({
      item: { kind: "pin", checkpoint: c, isAnchor: c.id === anchor?.id } as TimelineItem,
      key: cpKey(c),
      tie: c.id,
    })),
  ];
  return items
    .sort((a, b) => compareKeys(b.key, a.key) || b.tie - a.tie)
    .map((x) => x.item);
};

/**
 * Where a pin sits among transactions sorted newest first.
 * Returns k when the pin is just above transactions[k], or transactions.length
 * when it is below all of them.
 */
export const slotIndexFor = (
  sortedNewestFirst: Transaction[],
  checkpoint: BalanceCheckpoint,
): number => {
  const k = sortedNewestFirst.findIndex(
    (t) => compareKeys(txKey(t), cpKey(checkpoint)) <= 0,
  );
  return k === -1 ? sortedNewestFirst.length : k;
};

export const sortTransactionsNewestFirst = (transactions: Transaction[]): Transaction[] =>
  [...transactions].sort((a, b) => compareKeys(txKey(b), txKey(a)));
