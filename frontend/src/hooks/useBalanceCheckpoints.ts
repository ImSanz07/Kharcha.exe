import { useState, useEffect } from "react";
import type { BalanceCheckpoint } from "../types/balance";
import { CHECKPOINTS_URL } from "../utils/balance/api";

interface UseBalanceCheckpointsResult {
  checkpoints: BalanceCheckpoint[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const normalize = (value: unknown): BalanceCheckpoint => {
  const v = value as Record<string, unknown>;
  if (
    typeof v !== "object" || v === null ||
    !Number.isInteger(v.id) ||
    (typeof v.amount !== "string" && typeof v.amount !== "number") ||
    typeof v.as_of_date !== "string" ||
    !Number.isInteger(v.after_transaction_id)
  ) {
    throw new Error("Invalid balance data");
  }
  return {
    id: v.id as number,
    amount: String(v.amount),
    as_of_date: v.as_of_date,
    after_transaction_id: v.after_transaction_id as number,
    is_opening: v.is_opening === true,
    created_at: typeof v.created_at === "string" ? v.created_at : "",
  };
};

export const useBalanceCheckpoints = (token: string): UseBalanceCheckpointsResult => {
  const [checkpoints, setCheckpoints] = useState<BalanceCheckpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = () => setTick((t) => t + 1);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(CHECKPOINTS_URL, {
          signal: controller.signal,
          headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: unknown = await res.json();
        if (!Array.isArray(data)) throw new Error("Invalid balance response");
        setCheckpoints(data.map(normalize));
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Failed to fetch");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [token, tick]);

  return { checkpoints, loading, error, refetch };
};
