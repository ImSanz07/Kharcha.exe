import type { Transaction } from "../../types/transaction";
import { getTopCategories, formatCurrency } from "../../utils/home/Calculations";

interface TopCategoriesProps {
  transactions: Transaction[];
}

const COLORS = ["#f87171", "#fb923c", "#fbbf24", "#a78bfa", "#818cf8"];

const TopCategories = ({ transactions }: TopCategoriesProps) => {
  const categories = getTopCategories(transactions);
  const maxTotal = categories[0]?.total || 1;

  return (
    <div className="chart-card">
      <div className="chart-header">
        <span className="chart-title">Top Categories</span>
        <span className="chart-sub">by spend</span>
      </div>
      <div className="categories-list">
        {categories.map((cat, i) => (
          <div key={cat.name} className="category-row">
            <div className="category-meta">
              <span className="category-dot" style={{ background: COLORS[i] }} />
              <span className="category-name">{cat.name}</span>
              <span className="category-count">{cat.count}x</span>
            </div>
            <div className="category-bar-track">
              <div
                className="category-bar-fill"
                style={{
                  width: `${(cat.total / maxTotal) * 100}%`,
                  background: COLORS[i],
                }}
              />
            </div>
            <span className="category-amount">{formatCurrency(cat.total)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopCategories;
