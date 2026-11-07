import { useEffect, useMemo, useRef, useState } from "react";
import { X, Pin, Trash2 } from "lucide-react";
import type { Transaction } from "../../types/transaction";
import type { BalanceCheckpoint } from "../../types/balance";
import {
  createCheckpoint,
  updateCheckpoint,
  deleteCheckpoint,
  type CheckpointPayload,
} from "../../utils/balance/api";
import { slotIndexFor, sortTransactionsNewestFirst } from "../../utils/balance/timeline";
import { formatCurrency, formatDate } from "../../utils/home/Calculations";

interface BalanceModalProps {
  token: string;
  transactions: Transaction[];
  /** When set, edits this pin instead of creating one. */
  checkpoint?: BalanceCheckpoint;
  onClose: () => void;
  onSaved: () => void;
}

const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;
const todayLocal = () => new Date().toLocaleDateString("en-CA");

type Slot =
  | { kind: "after"; id: number } // right after this transaction
  | { kind: "now" } // right now, on an account with no transactions yet
  | { kind: "opening" }; // before all history: every transaction counts

/**
 * Pick where in the timeline the balance sits by tapping the gap between two
 * transactions. Slot k is the gap just above transactions[k]. The last slot is
 * the start of history (a starting balance).
 */
const BalanceModal = ({ token, transactions, checkpoint, onClose, onSaved }: BalanceModalProps) => {
  const isEdit = !!checkpoint;
  const sorted = useMemo(() => sortTransactionsNewestFirst(transactions), [transactions]);
  const slots: Slot[] = useMemo(
    () => [
      ...sorted.map((t): Slot => ({ kind: "after", id: t.transaction_id })),
      ...(sorted.length === 0 ? [{ kind: "now" } as Slot] : []),
      { kind: "opening" },
    ],
    [sorted],
  );
  const openingIndex = slots.length - 1;
  const initialSlot = !checkpoint
    ? 0
    : checkpoint.is_opening
      ? openingIndex
      : slotIndexFor(sorted, checkpoint);

  const initialAmount = checkpoint ? parseFloat(checkpoint.amount) : 0;
  const [amount, setAmount] = useState(checkpoint ? String(Math.abs(initialAmount)) : "");
  const [negative, setNegative] = useState(initialAmount < 0);
  const [slot, setSlot] = useState(initialSlot);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !submitting && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, submitting]);

  useEffect(() => {
    if (!isEdit) amountRef.current?.focus();
    selectedRef.current?.scrollIntoView({ block: "nearest" });
  }, [isEdit]);

  const cleaned = amount.trim().replace(/,/g, "");
  const previewValue = AMOUNT_RE.test(cleaned) ? parseFloat(cleaned) : null;
  const previewLabel =
    previewValue === null
      ? "your balance"
      : `${negative && previewValue > 0 ? "−" : ""}${formatCurrency(previewValue)}`;

  /** What to send to the server for the chosen slot. */
  const positionFor = (k: number): Omit<CheckpointPayload, "amount"> => {
    const chosen = slots[k];
    if (chosen.kind === "after") {
      return { after_transaction_id: chosen.id, is_opening: false };
    }
    if (chosen.kind === "opening") {
      return { after_transaction_id: null, is_opening: true };
    }
    return { after_transaction_id: null, is_opening: false };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!AMOUNT_RE.test(cleaned)) {
      setError("Enter your balance as a number, up to 2 decimals. Use 0 if it is empty.");
      return;
    }
    const value = `${negative && Number(cleaned) > 0 ? "-" : ""}${cleaned}`;

    try {
      setSubmitting(true);
      setError(null);
      if (checkpoint) {
        await updateCheckpoint(token, checkpoint.id, {
          amount: value,
          // Only move the pin if the user picked a different slot
          ...(slot !== initialSlot && { ...positionFor(slot), as_of_date: todayLocal() }),
        });
      } else {
        await createCheckpoint(token, {
          amount: value,
          ...positionFor(slot),
          as_of_date: todayLocal(),
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!checkpoint) return;
    try {
      setSubmitting(true);
      setError(null);
      await deleteCheckpoint(token, checkpoint.id);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete.");
      setSubmitting(false);
      setConfirmingDelete(false);
    }
  };

  const renderSlot = (k: number) => {
    const selected = slot === k;
    const kind = slots[k].kind;
    const hint =
      kind === "opening"
        ? "Start of history"
        : kind === "now"
          ? "Right now"
          : k === 0
            ? "Now"
            : "Drop it here";
    return (
      <button
        key={`slot-${k}`}
        ref={selected ? selectedRef : undefined}
        type="button"
        className={`slot ${selected ? "slot-selected" : ""}`}
        onClick={() => { setSlot(k); setError(null); }}
        aria-pressed={selected}
        aria-label={`Place balance here: ${hint}`}
      >
        <span className="slot-line" aria-hidden="true" />
        {selected ? (
          <span className="slot-pin">
            <Pin size={12} /> {previewLabel}
          </span>
        ) : (
          <span className="slot-hint">{hint}</span>
        )}
        <span className="slot-line" aria-hidden="true" />
      </button>
    );
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && !submitting && onClose()}
      role="presentation"
    >
      <div className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="balance-title">
        <div className="modal-grabber" aria-hidden="true" />
        <div className="modal-head">
          <h2 id="balance-title" className="modal-title">
            {isEdit ? "Edit balance pin" : "Pin your bank balance"}
          </h2>
          <button type="button" className="modal-close" onClick={onClose} disabled={submitting} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} noValidate>
          <p className="modal-help">
            Optional. Enter what your bank balance was, then tap the gap in your history
            where it belongs. Your balance is counted forward from the latest pin.
          </p>

          {error && <div className="modal-error" role="alert">{error}</div>}

          <label className="form-label" htmlFor="bal-amount">Balance (₹)</label>
          <div className="amount-row">
            <input
              id="bal-amount"
              ref={amountRef}
              className="form-input form-amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(null); }}
            />
            <button
              type="button"
              className={`neg-toggle ${negative ? "neg-toggle-on" : ""}`}
              aria-pressed={negative}
              onClick={() => setNegative((v) => !v)}
            >
              − Negative
            </button>
          </div>

          <span className="form-label">Where does it sit?</span>
          <div className="slot-list" role="group" aria-label="Position in your history">
            {sorted.map((t, k) => (
              <div key={t.transaction_id}>
                {renderSlot(k)}
                <div className="slot-txn">
                  <span className="slot-txn-name">{t.category_name}</span>
                  <span className="slot-txn-date">
                    {formatDate(`${t.transaction_date ?? t.created_at.split("T")[0]}T00:00:00`)}
                  </span>
                  <span className={t.transaction_type === "debit" ? "slot-neg" : "slot-pos"}>
                    {t.transaction_type === "debit" ? "−" : "+"}
                    {formatCurrency(parseFloat(t.amount))}
                  </span>
                </div>
              </div>
            ))}
            {sorted.length === 0 && renderSlot(0)}
            {renderSlot(openingIndex)}
          </div>
          <p className="slot-note">
            {slots[slot].kind === "opening"
              ? "Your balance before your first transaction. Everything you add or import counts from here, even older entries."
              : slots[slot].kind === "now"
                ? "Your balance as of today. Older entries you add later are treated as already included."
                : "Your balance at this exact point. Earlier transactions are treated as already included."}
          </p>

          <button
            type="submit"
            className="submit-btn submit-pin"
            disabled={submitting}
          >
            {submitting ? "Saving…" : isEdit ? "Save pin" : "Pin balance"}
          </button>

          {isEdit && !confirmingDelete && (
            <button type="button" className="delete-btn" onClick={() => setConfirmingDelete(true)} disabled={submitting}>
              <Trash2 size={14} /> Remove pin
            </button>
          )}
          {isEdit && confirmingDelete && (
            <div className="delete-confirm" role="alert">
              <p>Remove this balance pin? Your balance will be counted from the previous pin.</p>
              <div className="delete-confirm-actions">
                <button type="button" className="delete-cancel" onClick={() => setConfirmingDelete(false)} disabled={submitting}>
                  Keep it
                </button>
                <button type="button" className="delete-yes" onClick={handleDelete} disabled={submitting}>
                  {submitting ? "Removing…" : "Yes, remove"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default BalanceModal;
