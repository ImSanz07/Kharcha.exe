import { useState, useEffect } from "react";
import type { Transaction, TransactionType } from "../types/transaction";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, "");
const API_URL = `${API_BASE_URL}/api/transactions/`;

interface UseTransactionsResult {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const normalizeTransaction = (value: unknown): Transaction => {
  if (!isRecord(value)) {
    throw new Error("Invalid transaction data");
  }

  const rawType = value.transaction_type;
  let transactionType: TransactionType;

  if (rawType === "expense" || rawType === "debit") {
    transactionType = "debit";
  } else if (rawType === "income" || rawType === "credit") {
    transactionType = "credit";
  } else {
    throw new Error("Invalid transaction type");
  }

  if (
    !Number.isInteger(value.transaction_id) ||
    (typeof value.amount !== "string" &&
      typeof value.amount !== "number") ||
    typeof value.category_name !== "string" ||
    typeof value.created_at !== "string"
  ) {
    throw new Error("Invalid transaction data");
  }

  return {
    transaction_id: value.transaction_id as number,
    amount: String(value.amount),
    transaction_type: transactionType,
    category_name: value.category_name,
    created_at: value.created_at,
  };
};

export const useTransactions = (token: string): UseTransactionsResult => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = () => setTick((t) => t + 1);

  useEffect(() => {
    const controller = new AbortController();

    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(API_URL, {
          signal: controller.signal,
          headers: {
            Authorization: `Token ${ token } `,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${ res.status } `);
        }

        const data: unknown = await res.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid transactions response");
        }

        const normalizedData = data.map(normalizeTransaction);
        setTransactions(normalizedData);

      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch"
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchTransactions();

    return () => controller.abort();
  }, [token, tick]);

  return { transactions, loading, error, refetch };
};