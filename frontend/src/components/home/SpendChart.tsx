import { getDailySpend } from "../../utils/home/Calculations";
import { Transaction } from "../../types/transaction";

interface SpendChartProps {
  transactions: Transaction[];
}

const SpendChart = ({ transactions }: SpendChartProps) => {
  const data = getDailySpend(transactions);
  if (data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.amount));
  const W = 600;
  const H = 120;
  const barW = Math.min(32, (W / data.length) - 6);
  const gap = W / data.length;

  return (
    <div className="chart-card">
      <div className="chart-header">
        <span className="chart-title">Daily Spend</span>
        <span className="chart-sub">{data.length} days</span>
      </div>
      <div className="chart-wrap">
        <svg viewBox={`0 0 ${W} ${H + 28}`} preserveAspectRatio="none" width="100%" height="160">
          {data.map((d, i) => {
            const barH = Math.max(4, (d.amount / max) * H);
            const x = i * gap + gap / 2 - barW / 2;
            const y = H - barH;
            const isMax = d.amount === max;
            return (
              <g key={d.date}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={4}
                  fill={isMax ? "#f87171" : "#334155"}
                  opacity={0.9}
                />
                <text
                  x={x + barW / 2}
                  y={H + 16}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#64748b"
                >
                  {new Date(d.date + "T00:00:00").toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                  })}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default SpendChart;
