import { RefreshCw, AlertCircle, Landmark } from "lucide-react";
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

// Hardcoded for now — swap with auth context later
// const AUTH_TOKEN = "722f973950bc6a01b1b1bd510c81a3b16b24c303";

interface HomeProps {
  token: string;
}


const Home = ({ token }: HomeProps) => {
  const { transactions, loading, error, refetch } = useTransactions(token);

  // Home.tsx
  if (loading) return <LoadingScreen />;

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
        <button className="refresh-btn" onClick={refetch} disabled={loading}>
          <RefreshCw size={14} className={loading ? "spin" : ""} />
          <span>{loading ? "Loading..." : "Refresh"}</span>
        </button>
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
      <TransactionTable transactions={transactions} />
    </div>
  );
};

export default Home;
