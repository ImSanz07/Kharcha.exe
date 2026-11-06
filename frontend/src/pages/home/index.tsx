import { useEffect, useMemo, useState } from "react";
import { RefreshCw, AlertCircle, Landmark, Plus } from "lucide-react";
import { useTransactions } from "../../hooks/useTransactions";
import {
  getBalance,
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
import type { Transaction } from "../../types/transaction";
import type { NewTransactionType } from "../../utils/transactions/api";

// Hardcoded for now — swap with auth context later
// const AUTH_TOKEN = "722f973950bc6a01b1b1bd510c81a3b16b24c303";

interface HomeProps {
  token: string;
}


const Home = ({ token }: HomeProps) => {
  const { transactions, loading, error, refetch } = useTransactions(token);

  const [modalType, setModalType] = useState<NewTransactionType | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);

  // Full-screen loader only for the very first load; later refetches keep the page mounted
  const [hasLoaded, setHasLoaded] = useState(false);
  useEffect(() => {
    if (!loading) setHasLoaded(true);
  }, [loading]);

  const existingCategories = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.category_name))),
    [transactions],
  );

  if (loading && !hasLoaded) return <LoadingScreen />;

  const balance = getBalance(transactions);
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
          <button className="refresh-btn" onClick={refetch} disabled={loading}>
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            <span>{loading ? "Loading..." : "Refresh"}</span>
          </button>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="error-bar">
          <AlertCircle size={14} />
          <span>Failed to load: {error}</span>
        </div>
      )}

      {/* Stats */}
      <StatsBar
        balance={balance}
        totalDebits={totalDebits}
        totalCredits={totalCredits}
        txCount={debitCount}
      />

      {/* Charts row */}
      <div className="charts-row">
        <SpendChart transactions={transactions} />
        <TopCategories transactions={transactions} />
      </div>

      {/* Full table */}
      <TransactionTable transactions={transactions} onEdit={setEditing} />

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
          onCreated={refetch}
        />
      )}

      {editing && (
        <TransactionModal
          token={token}
          transaction={editing}
          existingCategories={existingCategories}
          onClose={() => setEditing(null)}
          onCreated={refetch}
        />
      )}
    </div>
  );
};

export default Home;
