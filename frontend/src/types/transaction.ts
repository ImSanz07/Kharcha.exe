export type TransactionType = "debit" | "credit";

export type TransactionSource = "SMS" | "MANUAL";

export interface Transaction {
  transaction_id: number;
  amount: string;
  transaction_type: TransactionType;
  category_name: string;
  transaction_date: string | null; // YYYY-MM-DD
  source: TransactionSource;
  created_at: string;
}
