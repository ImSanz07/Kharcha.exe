export interface BalanceCheckpoint {
  id: number;
  amount: string; // decimal string, may be negative
  as_of_date: string; // YYYY-MM-DD
  /** Pin sits right after this transaction id on that date. 0 means before all of that date. */
  after_transaction_id: number;
  created_at: string;
}
