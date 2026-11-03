import { Plus } from "lucide-react";
import { CATEGORIES } from "../../utils/home/Categories";
import type { Transaction } from "../../types/Transaction";

interface AddTransactionModalProps {
  transaction: Omit<Transaction, "id" | "date"> & { amount: number };
  onChange: (fields: Partial<Transaction>) => void;
  onAdd: () => void;
  onClose: () => void;
}

const AddTransactionModal = ({
  transaction,
  onChange,
  onAdd,
  onClose,
}: AddTransactionModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50 p-4">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-t-3xl w-full max-w-md border-t border-slate-700 animate-slide-up">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">
              Add {transaction.type === "income" ? "Income" : "Expense"}
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center transition-colors border border-slate-700"
            >
              <Plus className="w-5 h-5 rotate-45 text-slate-300" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={transaction.amount}
                onChange={(e) => onChange({ amount: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Category
              </label>
              <select
                value={transaction.category}
                onChange={(e) => onChange({ category: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {Object.keys(CATEGORIES)
                  .filter(
                    (cat) => cat !== "Income" || transaction.type === "income",
                  )
                  .map((category) => (
                    <option
                      key={category}
                      value={category}
                      className="bg-slate-800"
                    >
                      {category}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Description
              </label>
              <input
                type="text"
                value={transaction.description}
                onChange={(e) => onChange({ description: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="What was this for?"
              />
            </div>
          </div>

          <button
            onClick={onAdd}
            className={`w-full rounded-xl py-4 font-semibold text-white transform hover:scale-105 transition-all duration-200 shadow-lg active:scale-95 ${
              transaction.type === "income"
                ? "bg-emerald-500 hover:bg-emerald-600"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            Add Transaction
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTransactionModal;
