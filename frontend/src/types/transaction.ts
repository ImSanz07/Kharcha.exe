export type TransactionType = "debit" | "credit";

export interface Transaction {
  transaction_id: number;
  amount: string;
  transaction_type: TransactionType;
  category_name: string;
  created_at: string;
}
