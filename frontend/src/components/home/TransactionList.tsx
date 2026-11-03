import type { Transaction } from "../../types/Transaction";
import { MAX_VISIBLE_TRANSACTIONS } from "../../utils/home/Categories";
import TransactionItem from "./TransactionItem";

interface TransactionListProps {
  transactions: Transaction[];
}

const TransactionList = ({ transactions }: TransactionListProps) => {
  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 overflow-hidden">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {transactions.slice(0, MAX_VISIBLE_TRANSACTIONS).map((transaction) => (
          <TransactionItem key={transaction.id} transaction={transaction} />
        ))}
      </div>
    </div>
  );
};

export default TransactionList;