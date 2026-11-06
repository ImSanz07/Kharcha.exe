import { useEffect, useMemo, useState } from "react";
import { RefreshCw, AlertCircle, Landmark, Pin, Plus } from "lucide-react";
import { useTransactions } from "../../hooks/useTransactions";
import { useBalanceCheckpoints } from "../../hooks/useBalanceCheckpoints";
import { getAnchoredBalance } from "../../utils/balance/timeline";
import type { BalanceCheckpoint } from "../../types/balance";
import {
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
import OnboardingBalance from "../../components/home/OnboardingBalance";
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

  // A brand new account must set a starting balance before anything else.
  // Skipped if either request failed, so an outage can never trap the user here.
  const isFreshAccount =
    !error && !cp.error && transactions.length === 0 && cp.checkpoints.length === 0;
  if (isFreshAccount) return <OnboardingBalance token={token} onDone={refetchAll} />;

  const missingBalance = !cp.error && cp.checkpoints.length === 0;

  const { balance, anchor } = getAnchoredBalance(transactions, cp.checkpoints);
  const totalDebits = getTotalDebits(transactions);
  const totalCredits = getTotalCredits(transactions);
  const debitCount = transactions.filter(
    (t) => t.transaction_type === "debit",
  ).length;

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

      {missingBalance && (
        <div className="balance-banner">
          <span>Your balance isn&apos;t set, so the total below only reflects these transactions.</span>
          <button type="button" className="pin-btn" onClick={() => setPinModal("new")}>
            <Pin size={12} />
            <span>Set balance</span>
          </button>
        </div>
      )}

      {/* Stats */}
      <StatsBar
        balance={balance}
        totalDebits={totalDebits}
        totalCredits={totalCredits}
        txCount={debitCount}
        balanceNote={
          anchor
            ? `pinned ${formatDate(`${anchor.as_of_date}T00:00:00`)}`
            : "balance not set"
        }
      />

      {/* Charts row */}
      <div className="charts-row">
        <SpendChart transactions={transactions} />
        <TopCategories transactions={transactions} />
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
