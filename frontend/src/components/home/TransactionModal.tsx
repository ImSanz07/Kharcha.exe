import { useEffect, useMemo, useRef, useState } from "react";
import { X, Plus, Minus, Trash2 } from "lucide-react";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  type NewTransactionType,
} from "../../utils/transactions/api";
import type { Transaction } from "../../types/transaction";

interface TransactionModalProps {
  token: string;
  /** When set, the modal edits this transaction instead of creating one. */
  transaction?: Transaction;
  initialType?: NewTransactionType;
  /** Category names already used by the user, shown as quick picks. */
  existingCategories: string[];
  onClose: () => void;
  onCreated: () => void;
}

const DEFAULT_CATEGORIES: Record<NewTransactionType, string[]> = {
  expense: ["food", "transport", "shopping", "bills", "rent", "health"],
  income: ["salary", "freelance", "refund", "gift"],
};

// Local (not UTC) today as YYYY-MM-DD, so late-night entries don't land on tomorrow/yesterday.
const todayLocal = () => new Date().toLocaleDateString("en-CA");

const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;

const TransactionModal = ({
  token,
  transaction,
  initialType = "expense",
  existingCategories,
  onClose,
  onCreated,
}: TransactionModalProps) => {
  const isEdit = !!transaction;
  const [type, setType] = useState<NewTransactionType>(
    transaction
      ? transaction.transaction_type === "credit" ? "income" : "expense"
      : initialType,
  );
  const [amount, setAmount] = useState(transaction?.amount ?? "");
  const [category, setCategory] = useState(transaction?.category_name ?? "");
  const [date, setDate] = useState(() =>
    transaction
      ? transaction.transaction_date ??
        new Date(transaction.created_at).toLocaleDateString("en-CA")
      : todayLocal(),
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  // Lock background scroll + close on Escape
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

  // Focus the amount field once when the modal opens
  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  const suggestions = useMemo(() => {
    const merged = [...DEFAULT_CATEGORIES[type], ...existingCategories];
    return Array.from(new Set(merged.map((c) => c.toLowerCase()))).slice(0, 8);
  }, [type, existingCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = amount.trim().replace(/,/g, "");
    const cleanCategory = category.trim();

    if (!AMOUNT_RE.test(cleanAmount) || Number(cleanAmount) <= 0) {
      setError("Enter a valid amount greater than 0 (up to 2 decimals).");
      return;
    }
    if (!cleanCategory) {
      setError("Pick or type a category.");
      return;
    }
    if (!date) {
      setError("Choose a date.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const payload = {
        amount: cleanAmount,
        transaction_type: type,
        category: cleanCategory,
        transaction_date: date,
      };
      if (transaction) {
        await updateTransaction(token, transaction.transaction_id, payload);
      } else {
        await createTransaction(token, payload);
      }
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!transaction) return;
    try {
      setSubmitting(true);
      setError(null);
      await deleteTransaction(token, transaction.transaction_id);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete.");
      setSubmitting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && !submitting && onClose()}
      role="presentation"
    >
      <div className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="add-txn-title">
        <div className="modal-grabber" aria-hidden="true" />
        <div className="modal-head">
          <h2 id="add-txn-title" className="modal-title">
            {isEdit ? "Edit transaction" : "Add transaction"}
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="type-toggle" role="tablist" aria-label="Transaction type">
            <button
              type="button"
              role="tab"
              aria-selected={type === "expense"}
              className={`type-btn ${type === "expense" ? "type-btn-expense" : ""}`}
              onClick={() => setType("expense")}
            >
              <Minus size={14} /> Expense
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={type === "income"}
              className={`type-btn ${type === "income" ? "type-btn-income" : ""}`}
              onClick={() => setType("income")}
            >
              <Plus size={14} /> Income
            </button>
          </div>

          {error && <div className="modal-error" role="alert">{error}</div>}

          <label className="form-label" htmlFor="txn-amount">Amount (₹)</label>
          <input
            id="txn-amount"
            ref={amountRef}
            className="form-input form-amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError(null); }}
          />

          <label className="form-label" htmlFor="txn-category">Category</label>
          <input
            id="txn-category"
            className="form-input"
            autoComplete="off"
            maxLength={100}
            placeholder="e.g. food"
            value={category}
            onChange={(e) => { setCategory(e.target.value); setError(null); }}
          />
          <div className="chip-row">
            {suggestions.map((c) => (
              <button
                key={c}
                type="button"
                className={`chip ${category.trim().toLowerCase() === c ? "chip-active" : ""}`}
                onClick={() => { setCategory(c); setError(null); }}
              >
                {c}
              </button>
            ))}
          </div>

          <label className="form-label" htmlFor="txn-date">Date</label>
          <input
            id="txn-date"
            type="date"
            className="form-input"
            value={date}
            max={todayLocal()}
            onChange={(e) => setDate(e.target.value)}
          />

          <button
            type="submit"
            className={`submit-btn ${type === "expense" ? "submit-expense" : "submit-income"}`}
            disabled={submitting}
          >
            {submitting ? "Saving…" : isEdit ? "Save changes" : `Add ${type}`}
          </button>

          {isEdit && !confirmingDelete && (
            <button
              type="button"
              className="delete-btn"
              onClick={() => setConfirmingDelete(true)}
              disabled={submitting}
            >
              <Trash2 size={14} /> Delete transaction
            </button>
          )}

          {isEdit && confirmingDelete && (
            <div className="delete-confirm" role="alert">
              <p>Delete this transaction? This cannot be undone.</p>
              <div className="delete-confirm-actions">
                <button
                  type="button"
                  className="delete-cancel"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={submitting}
                >
                  Keep it
                </button>
                <button
                  type="button"
                  className="delete-yes"
                  onClick={handleDelete}
                  disabled={submitting}
                >
                  {submitting ? "Deleting…" : "Yes, delete"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
