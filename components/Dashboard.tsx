import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Transaction } from '../types';
import { CHART_COLORS, CATEGORY_COLORS } from '../constants';
import { getFinancialInsight } from '../services/geminiService';

interface DashboardProps {
  transactions: Transaction[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const [aiInsight, setAiInsight] = useState<string>("กำลังประมวลผลคำแนะนำจาก AI...");

  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const net = income - expenses;
    const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0;
    return { income, expenses, net, savingsRate };
  }, [transactions]);

  const expenseBreakdown = useMemo(() => {
    const groups: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      groups[t.category] = (groups[t.category] || 0) + t.amount;
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const barData = useMemo(() => {
    const monthlyData: Record<string, { income: number; expenses: number }> = {};
    transactions.forEach((t) => {
      const date = new Date(t.date);
      const month = date.toLocaleString('default', { month: 'short' });
      if (!monthlyData[month]) monthlyData[month] = { income: 0, expenses: 0 };
      if (t.type === 'income') monthlyData[month].income += t.amount;
      else monthlyData[month].expenses += t.amount;
    });
    return Object.entries(monthlyData).map(([name, values]) => ({ name, income: values.income, expenses: values.expenses }));
  }, [transactions]);

  // Real health score calculation (same logic as Analysis page)
  const healthScore = useMemo(() => {
    const savingsRate = stats.savingsRate;
    let savingsScore = savingsRate >= 20 ? 25 : savingsRate >= 10 ? 18 : savingsRate >= 5 ? 10 : Math.max(0, Math.round(savingsRate * 2));

    const expenseRatio = stats.income > 0 ? (stats.expenses / stats.income) * 100 : 100;
    let expenseScore = expenseRatio <= 50 ? 25 : expenseRatio <= 70 ? 20 : expenseRatio <= 85 ? 12 : 5;

    const categoryCount = expenseBreakdown.length;
    const topPct = expenseBreakdown.length > 0 && stats.expenses > 0
      ? (Math.max(...expenseBreakdown.map(e => e.value)) / stats.expenses) * 100 : 100;
    let diverseScore = (categoryCount >= 4 && topPct < 40) ? 25 : (categoryCount >= 3 && topPct < 50) ? 18 : categoryCount >= 2 ? 12 : 5;

    const incomeEntries = transactions.filter(t => t.type === 'income').length;
    let consistScore = incomeEntries >= 3 ? 25 : incomeEntries >= 2 ? 18 : incomeEntries >= 1 ? 12 : 0;

    return Math.min(100, savingsScore + expenseScore + diverseScore + consistScore);
  }, [stats, expenseBreakdown, transactions]);

  useEffect(() => {
    const fetchInsight = async () => {
      const summary = `Income: ฿${stats.income}, Expenses: ฿${stats.expenses}, Net: ฿${stats.net}, Savings: ${stats.savingsRate}%`;
      const result = await getFinancialInsight(summary);
      setAiInsight(result || "พร้อมให้คำปรึกษาทางการเงินกับคุณเสมอ");
    };
    fetchInsight();
  }, [stats]);

  const monthlyComparison = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonthDate = new Date(currentYear, currentMonth - 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    let currentIncome = 0, lastIncome = 0, currentExpense = 0, lastExpense = 0;

    transactions.forEach((t) => {
      const date = new Date(t.date);
      const month = date.getMonth();
      const year = date.getFullYear();
      const isCurrent = month === currentMonth && year === currentYear;
      const isLast = month === lastMonth && year === lastMonthYear;

      if (t.type === "income") {
        if (isCurrent) currentIncome += t.amount;
        if (isLast) lastIncome += t.amount;
      }
      if (t.type === "expense") {
        if (isCurrent) currentExpense += t.amount;
        if (isLast) lastExpense += t.amount;
      }
    });

    const calcPercent = (current: number, last: number) =>
      last > 0 ? Math.round(((current - last) / last) * 100) : 0;

    const currentNet = currentIncome - currentExpense;
    const lastNet = lastIncome - lastExpense;
    const currentSavingsRate = currentIncome > 0 ? Math.round((currentNet / currentIncome) * 100) : 0;
    const lastSavingsRate = lastIncome > 0 ? Math.round((lastNet / lastIncome) * 100) : 0;

    return {
      incomeChange: calcPercent(currentIncome, lastIncome),
      expenseChange: calcPercent(currentExpense, lastExpense),
      netChange: calcPercent(currentNet, lastNet),
      savingsChange: calcPercent(currentSavingsRate, lastSavingsRate),
    };
  }, [transactions]);

  const getCategoryColor = (categoryName: string, index: number): string => {
    return CATEGORY_COLORS[categoryName] || CHART_COLORS[index % CHART_COLORS.length];
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-black">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 flex flex-col gap-6 lg:gap-8">
        {/* Stats Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="รายรับเดือนนี้ (Income)" value={`฿${stats.income.toLocaleString()}`} change={`${monthlyComparison.incomeChange >= 0 ? "+" : ""}${monthlyComparison.incomeChange}%`} icon="account_balance_wallet" color="green" />
          <StatCard title="รายจ่ายเดือนนี้ (Expenses)" value={`฿${stats.expenses.toLocaleString()}`} change={`${monthlyComparison.expenseChange >= 0 ? "+" : ""}${monthlyComparison.expenseChange}%`} icon="credit_card" color="orange" />
          <StatCard title="เงินคงเหลือสุทธิ (Net)" value={`฿${stats.net.toLocaleString()}`} change={`${monthlyComparison.netChange >= 0 ? "+" : ""}${monthlyComparison.netChange}%`} icon="savings" color="blue" isHighlighted />
          <StatCard title="สัดส่วนออม (%)" value={`${stats.savingsRate}%`} change={`${monthlyComparison.savingsChange >= 0 ? "+" : ""}${monthlyComparison.savingsChange}%`} icon="percent" color="purple" progress={stats.savingsRate} />
        </section>

        {/* Charts Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-sm flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h3 className="text-gray-900 dark:text-white text-lg font-bold">Income vs Expenses</h3>
                <p className="text-gray-500 dark:text-neutral-400 text-sm">Yearly View • Last 6 Months</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#10b981' }}></div>
                  <span className="text-xs text-gray-600 dark:text-neutral-400 font-medium">Income</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#ef4444' }}></div>
                  <span className="text-xs text-gray-600 dark:text-neutral-400 font-medium">Expenses</span>
                </div>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff', color: '#000' }} formatter={(value: number, name: string) => [`฿${value.toLocaleString()}`, name === 'income' ? 'Income' : 'Expenses']} />
                  <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-6 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-sm flex flex-col">
            <h3 className="text-gray-900 dark:text-white text-lg font-bold mb-1">Expense Breakdown</h3>
            <p className="text-gray-500 dark:text-neutral-400 text-sm mb-6">By Category</p>
            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name, index)} />
                    ))}
                  </Pie>
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff', color: '#000' }} formatter={(value: number, name: string) => [`฿${value.toLocaleString()}`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-gray-900 dark:text-white">฿{(stats.expenses / 1000).toFixed(1)}k</span>
                <span className="text-xs text-gray-500 dark:text-neutral-500">Total</span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {expenseBreakdown.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 rounded-full" style={{ backgroundColor: getCategoryColor(item.name, index) }}></div>
                    <span className="text-gray-700 dark:text-neutral-300">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">฿{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Insight Card */}
        <section className="w-full">
          <div className="w-full rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 z-10 w-full">
              <div className="relative size-20 flex-shrink-0">
                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                  <path className="text-gray-200 dark:text-neutral-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                  <path className={healthScore >= 80 ? 'text-emerald-500' : healthScore >= 60 ? 'text-blue-500' : healthScore >= 40 ? 'text-yellow-500' : 'text-red-500'} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${healthScore}, 100`} strokeWidth="3"></path>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{healthScore}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 max-w-2xl flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-gray-900 dark:text-white text-lg font-bold">Financial Health Score</h3>
                  <span className="bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 text-xs px-2 py-0.5 rounded-full font-bold">Analysis</span>
                </div>
                <div className="flex gap-3 mt-1">
                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-500 mt-0.5 flex-shrink-0">smart_toy</span>
                  <p className="text-gray-700 dark:text-neutral-300 text-base leading-relaxed">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">AI Analyst:</span> {aiInsight}
                  </p>
                </div>
              </div>
            </div>
            <Link to="/analysis" className="z-10 group flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 dark:bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 dark:hover:bg-emerald-700 transition-all w-full md:w-auto">
              View Analysis
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string; change: string; icon: string; color: string; isHighlighted?: boolean; progress?: number }> = ({ title, value, change, icon, color, isHighlighted, progress }) => {
  return (
    <div className="p-4 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-sm flex flex-col gap-2 relative overflow-hidden group">
      <div className="flex items-center justify-between z-10">
        <p className="text-gray-600 dark:text-neutral-400 text-sm font-medium">{title}</p>
        <div className="text-gray-400 dark:text-neutral-500">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </div>
      <p className="text-gray-900 dark:text-white text-2xl font-bold tracking-tight z-10">{value}</p>
      <div className="flex items-center gap-1 z-10">
        <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-500 text-[14px]">trending_up</span>
        <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">{change}</p>
        <span className="text-gray-500 dark:text-neutral-600 text-xs ml-1">vs last month</span>
      </div>
      {progress !== undefined && (
        <div className="w-full h-1 bg-gray-100 dark:bg-neutral-800 mt-2 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
