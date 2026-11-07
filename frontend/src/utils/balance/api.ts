import { request } from "../transactions/api";

export interface CheckpointPayload {
  amount: string; // decimal string, may be negative
  /** Pin goes right after this transaction. */
  after_transaction_id?: number | null;
  /** Balance before all history. Every transaction counts, even older ones added later. */
  is_opening?: boolean;
  /** Only used when there is no transaction to place the pin after. */
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
