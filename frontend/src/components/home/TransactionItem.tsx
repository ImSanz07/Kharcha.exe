import { Coffee } from "lucide-react";
import { CATEGORIES } from "../../utils/home/Categories";
import { formatDate } from "../../utils/home/Calculations";
import type { Transaction } from "../../types/Transaction";

interface TransactionItemProps {
    transaction: Transaction
}

const TransactionItem = ({ transaction }: TransactionItemProps) => {
  const CategoryIcon =
    CATEGORIES[transaction.category as keyof typeof CATEGORIES]?.icon || Coffee;

  return (
    <div className="p-4 border-b border-slate-800 last:border-b-0 hover:bg-slate-800/30 transition-colors">
      <div className="flex items-center space-x-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg border ${
            transaction.type === "income"
              ? "bg-emerald-500/20 border-emerald-500/30"
              : "bg-slate-800 border-slate-700"
          }`}
        >
          <CategoryIcon
            className={`w-6 h-6 ${
              transaction.type === "income"
                ? "text-emerald-400"
                : "text-slate-300"
            }`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold truncate">
            {transaction.description}
          </p>
          <p className="text-slate-400 text-sm">
            {transaction.category} • {formatDate(transaction.date)}
          </p>
        </div>

        <div className="text-right">
          <p
            className={`font-bold text-lg ${
              transaction.type === "income"
                ? "text-emerald-400"
                : "text-red-400"
            }`}
          >
            {transaction.type === "income" ? "+" : "-"}$
            {transaction.amount.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TransactionItem;