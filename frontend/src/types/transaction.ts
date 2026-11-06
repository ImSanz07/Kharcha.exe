export type TransactionType = "debit" | "credit";

export interface Transaction {
  transaction_id: number;
  amount: string;
  transaction_type: TransactionType;
  category_name: string;
  transaction_date: string | null; // YYYY-MM-DD
  created_at: string;
}
