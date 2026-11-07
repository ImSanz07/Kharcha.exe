import { Pin } from "lucide-react";
import type { BalanceCheckpoint } from "../../types/balance";
import { formatCurrency, formatDate } from "../../utils/home/Calculations";

interface BalanceMarkerProps {
  checkpoint: BalanceCheckpoint;
  /** The newest pin: the balance is counted forward from it. */
  isAnchor: boolean;
  onClick: (checkpoint: BalanceCheckpoint) => void;
}

/** A pin dropped in the transaction list: "your balance was X right here". */
const BalanceMarker = ({ checkpoint, isAnchor, onClick }: BalanceMarkerProps) => {
  const amount = parseFloat(checkpoint.amount);
  const label = `${amount < 0 ? "−" : ""}${formatCurrency(Math.abs(amount))}`;

  return (
    <button
      type="button"
      className={`cp-marker ${isAnchor ? "cp-marker-anchor" : ""}`}
      onClick={() => onClick(checkpoint)}
      aria-label={`Balance pin ${label} on ${formatDate(`${checkpoint.as_of_date}T00:00:00`)}. Tap to edit.`}
    >
      <span className="cp-line" aria-hidden="true" />
      <span className="cp-badge">
        <span className="cp-pin">
          <Pin size={12} />
        </span>
        <span className="cp-text">
          <span className="cp-kicker">
            {checkpoint.is_opening ? "Starting balance" : "Balance here"}
          </span>
          <span className={`cp-amount ${amount < 0 ? "cp-negative" : ""}`}>{label}</span>
        </span>
      </span>
      <span className="cp-line" aria-hidden="true" />
      <span className="cp-caption">
        {checkpoint.is_opening
          ? "Start of history"
          : formatDate(`${checkpoint.as_of_date}T00:00:00`)}
        {isAnchor ? " · counted from here" : ""}
      </span>
    </button>
  );
};

export default BalanceMarker;
