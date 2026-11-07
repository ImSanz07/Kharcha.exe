import { useEffect, useMemo, useState } from "react";
import { RefreshCw, AlertCircle, Landmark, Pin, Plus, TriangleAlert } from "lucide-react";
import { useTransactions } from "../../hooks/useTransactions";
import { useBalanceCheckpoints } from "../../hooks/useBalanceCheckpoints";
import {
  findLateImports,
  getAnchoredBalance,
  getCountedTransactions,
} from "../../utils/balance/timeline";
import { updateCheckpoint } from "../../utils/balance/api";
import { readFlag, writeFlag } from "../../utils/storage";
import type { BalanceCheckpoint } from "../../types/balance";
import {
  formatCurrency,
  formatDate,
  getTotalDebits,
  getTotalCredits,
} from "../../utils/home/Calculations";
import StatsBar from "../../components/home/StatsBar";
import SpendChart from "../../components/home/SpendChart";
import TopCategories from "../../components/home/TopCategories";
import TransactionTable from "../../components/home/TransactionTable";
import "../../styles/dashboard.css";
import LoadingScreen from "../../components/home/LoadingScreen";
import TransactionModal from "../../components/home/TransactionModal";
import BalanceModal from "../../components/home/BalanceModal";
import type { Transaction } from "../../types/transaction";
import type { NewTransactionType } from "../../utils/transactions/api";

// Hardcoded for now — swap with auth context later
// const AUTH_TOKEN = "722f973950bc6a01b1b1bd510c81a3b16b24c303";

interface HomeProps {
  token: string;
}


const Home = ({ token }: HomeProps) => {
  const { transactions, loading, error, refetch } = useTransactions(token);
  const cp = useBalanceCheckpoints(token);

  const [modalType, setModalType] = useState<NewTransactionType | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  // "new" opens the pin popup empty, a checkpoint opens it for editing
  const [pinModal, setPinModal] = useState<"new" | BalanceCheckpoint | null>(null);

  const promptKey = `balancePromptDismissed:${token.slice(-8)}`;
  const [promptDismissed, setPromptDismissed] = useState(() => {
    try {
      return localStorage.getItem(promptKey) === "1";
    } catch {
      return false;
    }
  });

  // "Since pin" shows only activity that counts toward the balance, so the cards add up
  const [scope, setScope] = useState<"since" | "all">("since");
  const [reviewDismissed, setReviewDismissed] = useState<string[]>([]);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const lateImports = useMemo(
    () => findLateImports(transactions, cp.checkpoints),
    [transactions, cp.checkpoints],
  );

  // Full-screen loader only for the very first load; later refetches keep the page mounted
  const [hasLoaded, setHasLoaded] = useState(false);
  const busy = loading || cp.loading;
  useEffect(() => {
    if (!busy) setHasLoaded(true);
  }, [busy]);

  const existingCategories = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.category_name))),
    [transactions],
  );

  if (busy && !hasLoaded) return <LoadingScreen />;

  const refetchAll = () => {
    refetch();
    cp.refetch();
  };

  // The bank balance is optional: just a dismissible suggestion until the user adds one
  const showBalancePrompt =
    !cp.error && cp.checkpoints.length === 0 && !promptDismissed;

  const dismissBalancePrompt = () => {
    setPromptDismissed(true);
    try {
      localStorage.setItem(promptKey, "1");
    } catch {
      /* storage unavailable, the prompt just comes back next visit */
    }
  };

  const { balance, anchor } = getAnchoredBalance(transactions, cp.checkpoints);
  const counted = getCountedTransactions(transactions, cp.checkpoints);
  const hasHistoryBeforePin = counted.length < transactions.length;
  const shown = anchor && hasHistoryBeforePin && scope === "since" ? counted : transactions;
  const totalDebits = getTotalDebits(shown);
  const totalCredits = getTotalCredits(shown);
  const debitCount = shown.filter((t) => t.transaction_type === "debit").length;

  const reviewKey = lateImports
    ? `balanceImportReview:${lateImports.anchor.id}:${lateImports.maxId}`
    : null;
  const showReview =
    lateImports && reviewKey && !reviewDismissed.includes(reviewKey) && !readFlag(reviewKey);

  const dismissReview = () => {
    if (!reviewKey) return;
    setReviewDismissed((keys) => [...keys, reviewKey]);
    writeFlag(reviewKey);
  };

  // "Already included": move the pin to sit after the late imports, same amount
  const markLateImportsIncluded = async () => {
    if (!lateImports) return;
    try {
      setReviewBusy(true);
      setReviewError(null);
      await updateCheckpoint(token, lateImports.anchor.id, {
        amount: lateImports.anchor.amount,
        after_transaction_id: lateImports.maxId,
        is_opening: false,
      });
      refetchAll();
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Could not update the pin.");
    } finally {
      setReviewBusy(false);
    }
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dash-header">
        <div className="dash-brand">
          <div className="brand-icon">
            <Landmark size={18} color="#818cf8" />
          </div>
          <div>
            <h1 className="brand-name">ExpenseFlow</h1>
            <p className="brand-sub">Personal Finance Dashboard</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="add-btn-desktop" onClick={() => setModalType("expense")}>
            <Plus size={14} />
            <span>Add transaction</span>
          </button>
          <button className="refresh-btn" onClick={refetchAll} disabled={busy}>
            <RefreshCw size={14} className={busy ? "spin" : ""} />
            <span>{busy ? "Loading..." : "Refresh"}</span>
          </button>
        </div>
      </header>

      {/* Error */}
      {(error || cp.error) && (
        <div className="error-bar">
          <AlertCircle size={14} />
          <span>Failed to load: {error ?? cp.error}</span>
        </div>
      )}

      {showBalancePrompt && (
        <div className="balance-banner">
          <span>
            Optional: add your bank balance to see your real balance, kept up to date as
            you add transactions.
          </span>
          <div className="balance-banner-actions">
            <button type="button" className="pin-btn" onClick={() => setPinModal("new")}>
              <Pin size={12} />
              <span>Add balance</span>
            </button>
            <button type="button" className="banner-dismiss" onClick={dismissBalancePrompt}>
              Not now
            </button>
          </div>
        </div>
      )}

      {showReview && lateImports && (
        <div className="balance-banner balance-banner-warn" role="alert">
          <div className="banner-body">
            <span className="banner-title">
              <TriangleAlert size={13} />
              {lateImports.candidates.length === 1
                ? "1 SMS transaction was imported after your balance pin"
                : `${lateImports.candidates.length} SMS transactions were imported after your balance pin`}
            </span>
            <span>
              They are dated {formatDate(`${lateImports.anchor.as_of_date}T00:00:00`)}, the same day as
              your pin, so we can&apos;t tell if they happened before it. If they did, they&apos;re
              counted twice (currently {lateImports.impact < 0 ? "−" : "+"}
              {formatCurrency(Math.abs(lateImports.impact))} on your balance).
              {lateImports.swallowed.length > 0 &&
                ` Marking them included also covers ${lateImports.swallowed.length} other ${lateImports.swallowed.length === 1 ? "entry" : "entries"} from that day.`}
            </span>
            {reviewError && <span className="banner-error">{reviewError}</span>}
          </div>
          <div className="balance-banner-actions">
            <button type="button" className="pin-btn" onClick={markLateImportsIncluded} disabled={reviewBusy}>
              {reviewBusy ? "Saving…" : "Already included"}
            </button>
            <button type="button" className="banner-dismiss" onClick={dismissReview} disabled={reviewBusy}>
              Count them
            </button>
          </div>
        </div>
      )}

      {anchor && hasHistoryBeforePin && (
        <div className="scope-bar">
          <span>
            {scope === "since"
              ? `Cards and charts show activity since your ${formatDate(`${anchor.as_of_date}T00:00:00`)} pin`
              : "Cards and charts show all history"}
          </span>
          <div className="scope-toggle" role="group" aria-label="Summary period">
            <button
              type="button"
              className={`scope-btn ${scope === "since" ? "scope-btn-active" : ""}`}
              aria-pressed={scope === "since"}
              onClick={() => setScope("since")}
            >
              Since pin
            </button>
            <button
              type="button"
              className={`scope-btn ${scope === "all" ? "scope-btn-active" : ""}`}
              aria-pressed={scope === "all"}
              onClick={() => setScope("all")}
            >
              All time
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <StatsBar
        balance={balance}
        totalDebits={totalDebits}
        totalCredits={totalCredits}
        txCount={debitCount}
        balanceLabel={anchor ? "Bank Balance" : "Net Balance"}
        balanceNote={
          anchor
            ? anchor.is_opening
              ? "from your starting balance"
              : `pinned ${formatDate(`${anchor.as_of_date}T00:00:00`)}`
            : "income minus expenses"
        }
      />

      {/* Charts row */}
      <div className="charts-row">
        <SpendChart transactions={shown} />
        <TopCategories transactions={shown} />
      </div>

      {/* Full table */}
      <TransactionTable
        transactions={transactions}
        checkpoints={cp.checkpoints}
        onEdit={setEditing}
        onAddCheckpoint={() => setPinModal("new")}
        onEditCheckpoint={setPinModal}
      />

      {/* Mobile floating action button */}
      <button
        className="fab"
        onClick={() => setModalType("expense")}
        aria-label="Add transaction"
      >
        <Plus size={24} />
      </button>

      {modalType && (
        <TransactionModal
          token={token}
          initialType={modalType}
          existingCategories={existingCategories}
          onClose={() => setModalType(null)}
          onCreated={refetchAll}
        />
      )}

      {pinModal && (
        <BalanceModal
          token={token}
          transactions={transactions}
          checkpoint={pinModal === "new" ? undefined : pinModal}
          onClose={() => setPinModal(null)}
          onSaved={refetchAll}
        />
      )}

      {editing && (
        <TransactionModal
          token={token}
          transaction={editing}
          existingCategories={existingCategories}
          onClose={() => setEditing(null)}
          onCreated={refetchAll}
        />
      )}
    </div>
  );
};

export default Home;
