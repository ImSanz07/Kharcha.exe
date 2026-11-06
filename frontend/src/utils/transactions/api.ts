export type NewTransactionType = "expense" | "income";

export interface NewTransactionPayload {
  amount: string; // decimal string, e.g. "250.50"
  transaction_type: NewTransactionType;
  category: string;
  transaction_date: string; // YYYY-MM-DD
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, "");

/** Flattens DRF's { field: ["msg"] } error shape into one readable string. */
const extractError = (body: unknown): string => {
  if (typeof body === "object" && body !== null) {
    const parts = Object.entries(body as Record<string, unknown>).map(([field, msgs]) => {
      const text = Array.isArray(msgs) ? msgs.join(" ") : String(msgs);
      return field === "detail" || field === "non_field_errors" ? text : `${field}: ${text}`;
    });
    if (parts.length) return parts.join(" ");
  }
  return "Could not save the transaction.";
};

export const createTransaction = async (
  token: string,
  payload: NewTransactionPayload,
): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/api/transactions/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(extractError(body));
  }
};
