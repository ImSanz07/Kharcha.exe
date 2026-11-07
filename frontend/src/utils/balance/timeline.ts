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

/**
 * Counted transactions: everything newer than the anchor pin. The summary
 * cards and charts use this so that
 *   bank balance = pinned amount + credits - debits
 * adds up on screen.
 */
export const getCountedTransactions = (
  transactions: Transaction[],
  checkpoints: BalanceCheckpoint[],
): Transaction[] => {
  const anchor = getAnchor(checkpoints);
  return transactions.filter((t) => !isBeforeAnchor(t, anchor));
};

/**
 * "Pins that disagree": for each pin after the first, compare its amount with
 * what the previous pin plus the transactions in between would give.
 * Returns pinId -> difference (pin amount minus expected). Only mismatches.
 */
export const getPinDiscrepancies = (
  transactions: Transaction[],
  checkpoints: BalanceCheckpoint[],
): Map<number, number> => {
  const pins = [...checkpoints].sort(compareCheckpoints);
  const result = new Map<number, number>();

  for (let i = 1; i < pins.length; i++) {
    const prevKey = cpKey(pins[i - 1]);
    const curKey = cpKey(pins[i]);
    const between = transactions.filter(
      (t) => compareKeys(txKey(t), prevKey) > 0 && compareKeys(txKey(t), curKey) < 0,
    );
    const expected = parseFloat(pins[i - 1].amount) + between.reduce((s, t) => s + signedAmount(t), 0);
    const diff = round2(parseFloat(pins[i].amount) - expected);
    if (Math.abs(diff) >= 0.01) result.set(pins[i].id, diff);
  }
  return result;
};

export interface LateImportReview {
  anchor: BalanceCheckpoint;
  /** SMS transactions on the pin's own date that were imported after the pin was made. */
  candidates: Transaction[];
  /** Other entries that would also be treated as included if the pin moves past the candidates. */
  swallowed: Transaction[];
  /** Highest candidate id: the pin moves to sit right after it. */
  maxId: number;
  /** How much the candidates currently add to the balance (credits minus debits). */
  impact: number;
}

/**
 * Same-day ambiguity. Transactions only carry a date, so an SMS that is
 * imported after the pin and dated the same day could have happened before the
 * pin (then it is double counted) or after it (then it is correct). We cannot
 * tell, so surface it and let the user decide.
 */
export const findLateImports = (
  transactions: Transaction[],
  checkpoints: BalanceCheckpoint[],
): LateImportReview | null => {
  const anchor = getAnchor(checkpoints);
  if (!anchor || anchor.is_opening) return null;

  const pinnedAt = Date.parse(anchor.created_at);
  if (Number.isNaN(pinnedAt)) return null;

  const sameDayAfter = transactions.filter(
    (t) =>
      effectiveDate(t) === anchor.as_of_date &&
      t.transaction_id > anchor.after_transaction_id,
  );
  const candidates = sameDayAfter.filter(
    (t) => t.source === "SMS" && Date.parse(t.created_at) > pinnedAt,
  );
  if (candidates.length === 0) return null;

  const maxId = Math.max(...candidates.map((t) => t.transaction_id));
  const swallowed = sameDayAfter.filter(
    (t) => t.transaction_id <= maxId && !candidates.includes(t),
  );
  return {
    anchor,
    candidates,
    swallowed,
    maxId,
    impact: round2(candidates.reduce((s, t) => s + signedAmount(t), 0)),
  };
};
