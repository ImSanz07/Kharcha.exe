import type { Transaction } from "../../types/transaction";


export const getTotalDebits = (transactions: Transaction[]): number =>
  transactions
    .filter((t) => t.transaction_type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

export const getTotalCredits = (transactions: Transaction[]): number =>
  transactions
    .filter((t) => t.transaction_type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

export const getBalance = (transactions: Transaction[]): number =>
  getTotalCredits(transactions) - getTotalDebits(transactions);

export const formatCurrency = (amount: number): string =>
  "₹" + amount.toLocaleString("en-IN", { minimumFractionDigits: 2 });

export const formatDate = (isoStr: string): string => {
  const d = new Date(isoStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const formatTime = (isoStr: string): string => {
  const d = new Date(isoStr);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

export const getTopCategories = (
  transactions: Transaction[],
  limit = 5
): { name: string; total: number; count: number }[] => {
  const map: Record<string, { total: number; count: number }> = {};
  transactions
    .filter((t) => t.transaction_type === "expense")
    .forEach((t) => {
      const name = t.category_name;
      if (!map[name]) map[name] = { total: 0, count: 0 };
      map[name].total += parseFloat(t.amount);
      map[name].count += 1;
    });

  return Object.entries(map)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
};

export const getDailySpend = (
  transactions: Transaction[]
): { date: string; amount: number }[] => {
  const map: Record<string, number> = {};
  transactions
    .filter((t) => t.transaction_type === "expense")
    .forEach((t) => {
      const date = t.created_at.split("T")[0];
      map[date] = (map[date] || 0) + parseFloat(t.amount);
    });

  return Object.entries(map)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));
};
