import { useEffect, useMemo, useRef, useState } from "react";
import { X, Plus, Minus } from "lucide-react";
import {
  createTransaction,
  type NewTransactionType,
} from "../../utils/transactions/api";

interface AddTransactionModalProps {
  token: string;
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

const AddTransactionModal = ({
  token,
  initialType = "expense",
  existingCategories,
  onClose,
  onCreated,
}: AddTransactionModalProps) => {
  const [type, setType] = useState<NewTransactionType>(initialType);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(todayLocal);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  // Lock background scroll + close on Escape
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !submitting && onClose();
    window.addEventListener("keydown", onKey);
    amountRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, submitting]);

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
      await createTransaction(token, {
        amount: cleanAmount,
        transaction_type: type,
        category: cleanCategory,
        transaction_date: date,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
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
          <h2 id="add-txn-title" className="modal-title">Add transaction</h2>
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
            {submitting ? "Saving…" : `Add ${type}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
