import { useState } from "react";
import { Pin } from "lucide-react";
import { createCheckpoint } from "../../utils/balance/api";

interface OnboardingBalanceProps {
  token: string;
  onDone: () => void;
}

const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;

/** Shown once, to a brand new account, before anything else on the dashboard. */
const OnboardingBalance = ({ token, onDone }: OnboardingBalanceProps) => {
  const [amount, setAmount] = useState("");
  const [negative, setNegative] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = amount.trim().replace(/,/g, "");
    if (!AMOUNT_RE.test(cleaned)) {
      setError("Enter your balance as a number, up to 2 decimals. Use 0 if it is empty.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await createCheckpoint(token, {
        amount: `${negative && Number(cleaned) > 0 ? "-" : ""}${cleaned}`,
        after_transaction_id: null,
        as_of_date: new Date().toLocaleDateString("en-CA"),
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  };

  return (
    <div className="onboard-shell">
      <form className="onboard-card" onSubmit={handleSubmit} noValidate>
        <div className="onboard-pin">
          <Pin size={26} />
        </div>
        <h1 className="onboard-title">What is your balance right now?</h1>
        <p className="onboard-sub">
          This is your starting point. Every expense and income you add or import is
          counted from here, so your balance stays accurate.
        </p>

        {error && <div className="modal-error" role="alert">{error}</div>}

        <label className="form-label" htmlFor="onboard-amount">Current balance (₹)</label>
        <div className="amount-row">
          <input
            id="onboard-amount"
            className="form-input form-amount"
            inputMode="decimal"
            autoComplete="off"
            autoFocus
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

        <button type="submit" className="submit-btn submit-pin" disabled={submitting}>
          {submitting ? "Saving…" : "Start tracking"}
        </button>
        <p className="onboard-note">You can add more balance pins later if it drifts.</p>
      </form>
    </div>
  );
};

export default OnboardingBalance;
