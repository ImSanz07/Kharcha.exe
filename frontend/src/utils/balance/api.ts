import { request } from "../transactions/api";

export interface CheckpointPayload {
  amount: string; // decimal string, may be negative
  /** Pin goes right after this transaction. null means opening balance (before all). */
  after_transaction_id?: number | null;
  /** Only used by the server for an opening balance on an account with no transactions. */
  as_of_date?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, "");
export const CHECKPOINTS_URL = `${API_BASE_URL}/api/balance-checkpoints/`;

export const createCheckpoint = (token: string, payload: CheckpointPayload) =>
  request(token, CHECKPOINTS_URL, "POST", payload);

export const updateCheckpoint = (token: string, id: number, payload: CheckpointPayload) =>
  request(token, `${CHECKPOINTS_URL}${id}/`, "PATCH", payload);

export const deleteCheckpoint = (token: string, id: number) =>
  request(token, `${CHECKPOINTS_URL}${id}/`, "DELETE");
