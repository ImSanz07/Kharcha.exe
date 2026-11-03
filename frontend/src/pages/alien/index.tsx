import React, { useState, useEffect } from "react";
import {
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  Wallet,
  Coffee,
  Car,
  Home,
  ShoppingBag,
  Heart,
  Zap,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
} from "lucide-react";

const AlienExpenseTracker = () => {
  const [expenses, setExpenses] = useState([
    {
      id: 1,
      amount: 45.5,
      category: "Food",
      description: "LUNCH AT CAFE",
      date: "2025-08-26",
      type: "expense",
    },
    {
      id: 2,
      amount: 2500.0,
      category: "Income",
      description: "SALARY DEPOSIT",
      date: "2025-08-25",
      type: "income",
    },
    {
      id: 3,
      amount: 120.0,
      category: "Transport",
      description: "FUEL CONSUMPTION",
      date: "2025-08-24",
      type: "expense",
    },
    {
      id: 4,
      amount: 85.3,
      category: "Shopping",
      description: "EQUIPMENT PURCHASE",
      date: "2025-08-23",
      type: "expense",
    },
    {
      id: 5,
      amount: 200.0,
      category: "Income",
      description: "FREELANCE CONTRACT",
      date: "2025-08-22",
      type: "income",
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [systemTime, setSystemTime] = useState(new Date());
  const [blinkingElements, setBlinkingElements] = useState({});
  const [newTransaction, setNewTransaction] = useState({
    amount: "",
    category: "Food",
    description: "",
    type: "expense",
  });

  const categories = {
    Food: { icon: Coffee, code: "NUTR" },
    Transport: { icon: Car, code: "TRAN" },
    Home: { icon: Home, code: "HABS" },
    Shopping: { icon: ShoppingBag, code: "SUPL" },
    Health: { icon: Heart, code: "MED_" },
    Bills: { icon: Zap, code: "UTIL" },
    Income: { icon: TrendingUp, code: "INC_" },
  };

  // System clock
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Random blinking effect
  useEffect(() => {
    const blinkTimer = setInterval(() => {
      setBlinkingElements({
        status1: Math.random() > 0.7,
        status2: Math.random() > 0.8,
        status3: Math.random() > 0.6,
        warning: Math.random() > 0.9,
      });
    }, 500);
    return () => clearInterval(blinkTimer);
  }, []);

  const totalIncome = expenses
    .filter((e) => e.type === "income")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = expenses
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIncome - totalExpenses;

  const addTransaction = () => {
    if (!newTransaction.amount || !newTransaction.description) return;

    const transaction = {
      id: Date.now(),
      amount: parseFloat(newTransaction.amount),
      category: newTransaction.category,
      description: newTransaction.description.toUpperCase(),
      date: new Date().toISOString().split("T")[0],
      type: newTransaction.type,
    };

    setExpenses([transaction, ...expenses]);
    setNewTransaction({
      amount: "",
      category: "Food",
      description: "",
      type: "expense",
    });
    setShowAddForm(false);
  };

  const formatTime = (date) => {
    return date.toISOString().slice(11, 19);
  };

  const formatDate = (date) => {
    return date.toISOString().slice(0, 10).replace(/-/g, ".");
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono overflow-hidden relative">
      {/* CRT Screen Effect */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.03) 2px, rgba(0,255,0,0.03) 4px)",
          }}
        ></div>
      </div>

      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-40 opacity-20">
        <div className="w-full h-1 bg-green-400 animate-scan-line"></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto p-4 space-y-4">
        {/* System Header */}
        <div className="border-2 border-green-400 bg-black p-4">
          <div className="flex justify-between items-start text-xs">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <div
                  className={`w-2 h-2 border border-green-400 ${
                    blinkingElements.status1 ? "bg-green-400" : "bg-black"
                  } transition-all duration-200`}
                ></div>
                <span>WEYLAND-YUTANI CORP</span>
              </div>
              <div>FINANCIAL.TRACKING.SYSTEM</div>
              <div>VERSION 2.1.7</div>
            </div>
            <div className="text-right">
              <div>DATE: {formatDate(systemTime)}</div>
              <div>TIME: {formatTime(systemTime)}</div>
              <div className="flex items-center justify-end space-x-1 mt-1">
                <span>STATUS:</span>
                <div
                  className={`w-2 h-2 border border-green-400 ${
                    blinkingElements.status2 ? "bg-green-400" : "bg-black"
                  } transition-all duration-200`}
                ></div>
                <span>ONLINE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Display */}
        <div className="border-2 border-green-400 bg-black">
          {/* Header Bar */}
          <div className="bg-green-400 text-black px-4 py-2 text-sm font-bold">
            <div className="flex justify-between items-center">
              <span>EXPENSEFLOW TERMINAL</span>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 border border-black ${
                    blinkingElements.status3 ? "bg-black" : "bg-green-400"
                  } transition-all duration-200`}
                ></div>
                <span>ACTIVE</span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Balance Display */}
            <div className="border border-green-400 bg-black">
              <div className="bg-green-400 text-black px-3 py-1 text-xs font-bold">
                ACCOUNT.BALANCE.STATUS
              </div>
              <div className="p-4 space-y-4">
                <div className="text-center">
                  <div className="text-xs mb-2 tracking-wider">
                    CURRENT BALANCE
                  </div>
                  <div
                    className={`text-3xl font-bold mb-2 ${
                      balance >= 0 ? "text-green-400" : "text-red-500"
                    } ${balance < 0 ? "animate-pulse" : ""}`}
                  >
                    {balance >= 0 ? "+" : "-"}$
                    {Math.abs(balance).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                  {balance < 0 && blinkingElements.warning && (
                    <div className="flex items-center justify-center space-x-1 text-red-500 text-xs">
                      <AlertTriangle className="w-3 h-3" />
                      <span>WARNING: NEGATIVE BALANCE</span>
                      <AlertTriangle className="w-3 h-3" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="border border-green-400 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span>INCOME.TOTAL</span>
                      <TrendingUp className="w-3 h-3" />
                    </div>
                    <div className="text-green-400 font-bold text-lg">
                      +$
                      {totalIncome.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                  <div className="border border-green-400 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span>EXPENSE.TOTAL</span>
                      <TrendingDown className="w-3 h-3" />
                    </div>
                    <div className="text-red-500 font-bold text-lg">
                      -$
                      {totalExpenses.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Control Panel */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setNewTransaction({ ...newTransaction, type: "expense" });
                  setShowAddForm(true);
                }}
                className="border-2 border-green-400 bg-black hover:bg-green-400 hover:text-black transition-all duration-200 py-4 px-4 text-xs font-bold group"
              >
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <Minus className="w-4 h-4" />
                  <span>ADD</span>
                </div>
                <div>EXPENSE</div>
              </button>

              <button
                onClick={() => {
                  setNewTransaction({ ...newTransaction, type: "income" });
                  setShowAddForm(true);
                }}
                className="border-2 border-green-400 bg-black hover:bg-green-400 hover:text-black transition-all duration-200 py-4 px-4 text-xs font-bold"
              >
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <Plus className="w-4 h-4" />
                  <span>ADD</span>
                </div>
                <div>INCOME</div>
              </button>
            </div>
          </div>
        </div>

        {/* Transaction Log */}
        <div className="border-2 border-green-400 bg-black">
          <div className="bg-green-400 text-black px-4 py-2 text-xs font-bold flex justify-between items-center">
            <span>TRANSACTION.LOG.DISPLAY</span>
            <span>ENTRIES: {expenses.length}</span>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {expenses.slice(0, 15).map((expense, index) => {
              const CategoryIcon = categories[expense.category]?.icon || Coffee;
              const categoryCode = categories[expense.category]?.code || "UNKN";

              return (
                <div
                  key={expense.id}
                  className="border-b border-green-400/30 p-3 hover:bg-green-400/10 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="flex items-center space-x-2 text-xs">
                        <CategoryIcon className="w-4 h-4" />
                        <span className="font-bold">{categoryCode}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate">
                          {expense.description}
                        </div>
                        <div className="text-xs opacity-70">
                          {expense.date.replace(/-/g, ".")}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-bold text-sm ${
                          expense.type === "income"
                            ? "text-green-400"
                            : "text-red-500"
                        }`}
                      >
                        {expense.type === "income" ? "+" : "-"}$
                        {expense.amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Info */}
        <div className="border border-green-400 bg-black p-2 text-xs">
          <div className="flex justify-between">
            <span>SYSTEM.STATUS: OPERATIONAL</span>
            <span>MEM: {Math.floor(Math.random() * 100)}% USED</span>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md border-2 border-green-400 bg-black animate-terminal-boot">
            <div className="bg-green-400 text-black px-4 py-2 text-xs font-bold flex justify-between items-center">
              <span>TRANSACTION.INPUT.MODULE</span>
              <button
                onClick={() => setShowAddForm(false)}
                className="hover:bg-black hover:text-green-400 px-2 py-1 border border-black transition-all duration-200"
              >
                [X]
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center text-xs mb-4">
                <div>ADDING: {newTransaction.type.toUpperCase()} RECORD</div>
                <div>STATUS: INPUT_REQUIRED</div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-2 tracking-wider">
                    AMOUNT.VALUE:
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTransaction.amount}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        amount: e.target.value,
                      })
                    }
                    className="w-full bg-black border border-green-400 px-3 py-2 text-green-400 placeholder-green-400/50 focus:outline-none focus:bg-green-400/10 text-sm font-mono"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-2 tracking-wider">
                    CATEGORY.TYPE:
                  </label>
                  <select
                    value={newTransaction.category}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        category: e.target.value,
                      })
                    }
                    className="w-full bg-black border border-green-400 px-3 py-2 text-green-400 focus:outline-none focus:bg-green-400/10 text-sm font-mono"
                  >
                    {Object.keys(categories)
                      .filter(
                        (cat) =>
                          cat !== "Income" || newTransaction.type === "income"
                      )
                      .map((category) => (
                        <option
                          key={category}
                          value={category}
                          className="bg-black text-green-400"
                        >
                          {category.toUpperCase()}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-2 tracking-wider">
                    DESCRIPTION.TEXT:
                  </label>
                  <input
                    type="text"
                    value={newTransaction.description}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        description: e.target.value,
                      })
                    }
                    className="w-full bg-black border border-green-400 px-3 py-2 text-green-400 placeholder-green-400/50 focus:outline-none focus:bg-green-400/10 text-sm font-mono"
                    placeholder="ENTER DESCRIPTION..."
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={addTransaction}
                  className="w-full bg-green-400 text-black hover:bg-black hover:text-green-400 border-2 border-green-400 py-3 font-bold text-sm transition-all duration-200"
                >
                  EXECUTE.TRANSACTION
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scan-line {
          0% {
            transform: translateY(-100vh);
          }
          100% {
            transform: translateY(100vh);
          }
        }
        @keyframes terminal-boot {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scan-line {
          animation: scan-line 3s linear infinite;
        }
        .animate-terminal-boot {
          animation: terminal-boot 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AlienExpenseTracker;
