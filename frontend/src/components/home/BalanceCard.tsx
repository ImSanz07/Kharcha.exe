import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "../../utils/home/Calculations";

interface BalanceCardProps {
    balance: number;
    totalIncome: number;
    totalExpenses: number;
}

const BalanceCard = ({ balance, totalIncome, totalExpenses }: BalanceCardProps) => {
    return (
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-800 shadow-2xl">
            <div className="text-center">
                <p className="text-slate-400 text-sm uppercase tracking-wider mb-2">
                    Current Balance
                </p>
                <p
                    className={`text-4xl font-bold mb-4 ${balance >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                >
                    ${formatCurrency(Math.abs(balance))}
                </p>

                <div className="flex justify-between items-center">
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                            <TrendingUp className="w-4 h-4 text-emerald-400 mr-1" />
                            <span className="text-emerald-400 text-sm">Income</span>
                        </div>
                        <p className="text-white font-semibold">
                            ${formatCurrency(totalIncome)}
                        </p>
                    </div>

                    <div className="w-px h-12 bg-slate-700"></div>

                    <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                            <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
                            <span className="text-red-400 text-sm">Expenses</span>
                        </div>
                        <p className="text-white font-semibold">
                            ${formatCurrency(totalExpenses)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BalanceCard;