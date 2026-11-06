import { ArrowDownRight, ArrowUpRight, Wallet, TrendingDown } from "lucide-react";
import { formatCurrency } from "../../utils/home/Calculations";

interface StatsBarProps {
  balance: number;
  totalDebits: number;
  totalCredits: number;
  txCount: number;
  /** Small text under the balance, e.g. when it was last pinned. */
  balanceNote?: string;
}

const StatCard = ({
  label,
  value,
  icon: Icon,
  accent,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accent: string;
  sub?: string;
}) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: accent + "18", border: `1px solid ${accent}30` }}>
      <Icon size={16} color={accent} />
    </div>
    <div>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  </div>
);

const StatsBar = ({ balance, totalDebits, totalCredits, txCount, balanceNote }: StatsBarProps) => (
  <div className="stats-bar">
    <StatCard
      label="Net Balance"
      value={`${balance < 0 ? "−" : ""}${formatCurrency(Math.abs(balance))}`}
      icon={Wallet}
      accent={balance >= 0 ? "#34d399" : "#f87171"}
      sub={balanceNote ?? (balance >= 0 ? "surplus" : "deficit")}
    />
    <StatCard
      label="Total Debited"
      value={formatCurrency(totalDebits)}
      icon={ArrowDownRight}
      accent="#f87171"
      sub={`${txCount} transactions`}
    />
    <StatCard
      label="Total Credited"
      value={formatCurrency(totalCredits)}
      icon={ArrowUpRight}
      accent="#34d399"
    />
    <StatCard
      label="Avg per Txn"
      value={formatCurrency(txCount > 0 ? totalDebits / txCount : 0)}
      icon={TrendingDown}
      accent="#818cf8"
    />
  </div>
);

export default StatsBar;
