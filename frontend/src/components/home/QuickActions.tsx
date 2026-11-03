import { Plus, Minus } from "lucide-react";

interface QuickActionsProps {
    onAddExpense: () => void;
    onAddIncome: () => void;
}

const QuickActions = ({ onAddExpense, onAddIncome }: QuickActionsProps) => {
    return (
        <div className="flex space-x-3">
            <button
                onClick={onAddExpense}
                className="flex-1 bg-red-500 hover:bg-red-600 rounded-2xl py-4 px-6 flex items-center justify-center space-x-2 transform hover:scale-105 transition-all duration-200 shadow-lg active:scale-95"
            >
                <Minus className="w-5 h-5" />
                <span className="font-semibold">Add Expense</span>
            </button>

            <button
                onClick={onAddIncome}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 rounded-2xl py-4 px-6 flex items-center justify-center space-x-2 transform hover:scale-105 transition-all duration-200 shadow-lg active:scale-95"
            >
                <Plus className="w-5 h-5" />
                <span className="font-semibold">Add Income</span>
            </button>
        </div>
    );
};

export default QuickActions;