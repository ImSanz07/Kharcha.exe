import { useMemo, useState } from "react";
import type { Transaction } from "../../types/transaction";
import type { BalanceCheckpoint } from "../../types/balance";
import { formatCurrency, formatDate, formatTime } from "../../utils/home/Calculations";
import {
  buildTimeline,
  getAnchor,
  getPinDiscrepancies,
  isBeforeAnchor,
  type TimelineItem,
} from "../../utils/balance/timeline";
import { ArrowDownRight, ArrowUpRight, Pencil, Pin, Search } from "lucide-react";
import BalanceMarker from "./BalanceMarker";

interface TransactionTableProps {
  transactions: Transaction[];
  checkpoints: BalanceCheckpoint[];
  onEdit: (transaction: Transaction) => void;
  onAddCheckpoint: () => void;
  onEditCheckpoint: (checkpoint: BalanceCheckpoint) => void;
}

const TransactionTable = ({
  transactions,
  checkpoints,
  onEdit,
  onAddCheckpoint,
  onEditCheckpoint,
}: TransactionTableProps) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "debit" | "credit">("all");

  const filtered = transactions.filter((t) => {
    const matchType = filter === "all" || t.transaction_type === filter;
    const matchSearch =
      t.category_name.toLowerCase().includes(search.toLowerCase()) ||
      t.amount.includes(search);
    return matchType && matchSearch;
  });

  // Balance pins only make sense in the full, unfiltered history
  const showPins = filter === "all" && search.trim() === "";
  const anchor = useMemo(() => getAnchor(checkpoints), [checkpoints]);
  const discrepancies = useMemo(
    () => getPinDiscrepancies(transactions, checkpoints),
    [transactions, checkpoints],
  );
  const items: TimelineItem[] = useMemo(
    () => buildTimeline(filtered, showPins ? checkpoints : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transactions, checkpoints, search, filter],
  );

  const renderTransaction = (t: Transaction) => {
    const editable = t.source === "MANUAL";
    const settled = isBeforeAnchor(t, anchor);
    return (
      <div
        key={`t-${t.transaction_id}`}
        className={`tx-row ${editable ? "tx-row-editable" : ""} ${settled ? "tx-row-settled" : ""}`}
        {...(editable && {
          role: "button",
          tabIndex: 0,
          "aria-label": `Edit ${t.category_name} transaction`,
          onClick: () => onEdit(t),
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onEdit(t);
            }
          },
        })}
      >
        <div
          className="tx-icon"
          style={{
            background: t.transaction_type === "debit" ? "#f8717118" : "#34d39918",
            border: `1px solid ${t.transaction_type === "debit" ? "#f8717130" : "#34d39930"}`,
          }}
        >
          {t.transaction_type === "debit" ? (
            <ArrowDownRight size={14} color="#f87171" />
          ) : (
            <ArrowUpRight size={14} color="#34d399" />
          )}
        </div>
        <div className="tx-meta">
          <span className="tx-category">{t.category_name}</span>
          <span className="tx-date">
            {t.transaction_date
              ? formatDate(`${t.transaction_date}T00:00:00`)
              : `${formatDate(t.created_at)} · ${formatTime(t.created_at)}`}
          </span>
        </div>
        <div className="tx-right">
          <span
            className="tx-amount"
            style={{ color: t.transaction_type === "debit" ? "#f87171" : "#34d399" }}
          >
            {t.transaction_type === "debit" ? "−" : "+"}
            {formatCurrency(parseFloat(t.amount))}
          </span>
          <span className="tx-id">
            {editable ? <Pencil size={11} /> : <span className="tx-tag">SMS</span>}
            #{t.transaction_id}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="table-card">
      <div className="table-header">
        <div className="table-title-row">
          <span className="chart-title">All Transactions</span>
          <button type="button" className="pin-btn" onClick={onAddCheckpoint}>
            <Pin size={12} />
            <span>Pin balance</span>
          </button>
        </div>
        <div className="table-controls">
          <div className="search-wrap">
            <Search size={13} color="#64748b" />
            <input
              className="search-input"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-pills">
            {(["all", "debit", "credit"] as const).map((f) => (
              <button
                key={f}
                className={`pill ${filter === f ? "pill-active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="tx-list">
        {filtered.length === 0 && <p className="tx-empty">No transactions found.</p>}
        {items.map((item) =>
          item.kind === "txn" ? (
            renderTransaction(item.transaction)
          ) : (
            <BalanceMarker
              key={`p-${item.checkpoint.id}`}
              checkpoint={item.checkpoint}
              isAnchor={item.isAnchor}
              discrepancy={discrepancies.get(item.checkpoint.id)}
              onClick={onEditCheckpoint}
            />
          ),
        )}
      </div>
    </div>
  );
};

export default TransactionTable;
