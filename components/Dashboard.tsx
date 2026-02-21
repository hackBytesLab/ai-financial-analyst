import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_COLORS, CATEGORY_COLORS } from '../constants';
import { getFinancialInsight } from '../services/geminiService';
import { Transaction } from '../types';

interface DashboardProps {
  transactions: Transaction[];
}

type MonthlyChange = number | null;

function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' });
}

function lastNMonthKeys(n: number): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(toMonthKey(d));
  }
  return result;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const [aiInsight, setAiInsight] = useState<string>('กำลังประมวลผลคำแนะนำจาก AI...');
  const [isKeyMissing, setIsKeyMissing] = useState(false);

  const hasData = transactions.length > 0;

  const stats = useMemo(() => {
    const income = transactions.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const net = income - expenses;
    const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0;
    return { income, expenses, net, savingsRate };
  }, [transactions]);

  const expenseBreakdown = useMemo(() => {
    const groups: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        groups[t.category] = (groups[t.category] || 0) + t.amount;
      });

    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const barData = useMemo(() => {
    const keys = lastNMonthKeys(6);
    const bucket = new Map<string, { income: number; expenses: number }>();
    keys.forEach((key) => bucket.set(key, { income: 0, expenses: 0 }));

    transactions.forEach((t) => {
      const date = new Date(t.date);
      if (Number.isNaN(date.getTime())) return;
      const key = toMonthKey(date);
      const target = bucket.get(key);
      if (!target) return;
      if (t.type === 'income') target.income += t.amount;
      if (t.type === 'expense') target.expenses += t.amount;
    });

    return keys.map((key) => {
      const value = bucket.get(key) || { income: 0, expenses: 0 };
      return {
        name: formatMonthLabel(key),
        income: value.income,
        expenses: value.expenses,
      };
    });
  }, [transactions]);

  const healthScore = useMemo(() => {
    const savingsRate = stats.savingsRate;
    const savingsScore =
      savingsRate >= 20 ? 25 : savingsRate >= 10 ? 18 : savingsRate >= 5 ? 10 : Math.max(0, Math.round(savingsRate * 2));

    const expenseRatio = stats.income > 0 ? (stats.expenses / stats.income) * 100 : 100;
    const expenseScore = expenseRatio <= 50 ? 25 : expenseRatio <= 70 ? 20 : expenseRatio <= 85 ? 12 : 5;

    const categoryCount = expenseBreakdown.length;
    const topPct = expenseBreakdown.length > 0 && stats.expenses > 0
      ? (Math.max(...expenseBreakdown.map((e) => e.value)) / stats.expenses) * 100
      : 100;
    const diverseScore = categoryCount >= 4 && topPct < 40 ? 25 : categoryCount >= 3 && topPct < 50 ? 18 : categoryCount >= 2 ? 12 : 5;

    const incomeEntries = transactions.filter((t) => t.type === 'income').length;
    const consistScore = incomeEntries >= 3 ? 25 : incomeEntries >= 2 ? 18 : incomeEntries >= 1 ? 12 : 0;

    return Math.min(100, savingsScore + expenseScore + diverseScore + consistScore);
  }, [expenseBreakdown, stats, transactions]);

  useEffect(() => {
    if (!hasData) {
      setAiInsight('เริ่มบันทึกรายรับและรายจ่ายเพื่อรับคำแนะนำจาก AI ได้ทันที');
      setIsKeyMissing(false);
      return;
    }

    const fetchInsight = async () => {
      const summary = `Income: ฿${stats.income}, Expenses: ฿${stats.expenses}, Net: ฿${stats.net}, Savings: ${stats.savingsRate}%`;
      try {
        const result = await getFinancialInsight(summary);
        setIsKeyMissing(false);
        setAiInsight(result || 'พร้อมให้คำปรึกษาทางการเงินกับคุณเสมอ');
      } catch (error) {
        if (error instanceof Error && error.message.includes('GEMINI_API_KEY_MISSING')) {
          setIsKeyMissing(true);
          setAiInsight('กรุณาตั้งค่า Gemini API Key เพื่อใช้คำแนะนำจาก AI');
          return;
        }
        setAiInsight('พร้อมให้คำปรึกษาทางการเงินกับคุณเสมอ');
      }
    };

    void fetchInsight();
  }, [hasData, stats]);

  const monthlyComparison = useMemo(() => {
    const now = new Date();
    const currentKey = toMonthKey(now);
    const lastKey = toMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

    const values = {
      currentIncome: 0,
      currentExpense: 0,
      lastIncome: 0,
      lastExpense: 0,
    };

    transactions.forEach((t) => {
      const d = new Date(t.date);
      if (Number.isNaN(d.getTime())) return;
      const key = toMonthKey(d);
      if (key === currentKey && t.type === 'income') values.currentIncome += t.amount;
      if (key === currentKey && t.type === 'expense') values.currentExpense += t.amount;
      if (key === lastKey && t.type === 'income') values.lastIncome += t.amount;
      if (key === lastKey && t.type === 'expense') values.lastExpense += t.amount;
    });

    const calcPercent = (current: number, last: number): MonthlyChange => {
      if (last <= 0) return null;
      return Math.round(((current - last) / last) * 100);
    };

    const currentNet = values.currentIncome - values.currentExpense;
    const lastNet = values.lastIncome - values.lastExpense;
    const currentSavingsRate = values.currentIncome > 0 ? Math.round((currentNet / values.currentIncome) * 100) : 0;
    const lastSavingsRate = values.lastIncome > 0 ? Math.round((lastNet / values.lastIncome) * 100) : 0;

    return {
      incomeChange: calcPercent(values.currentIncome, values.lastIncome),
      expenseChange: calcPercent(values.currentExpense, values.lastExpense),
      netChange: calcPercent(currentNet, lastNet),
      savingsChange: calcPercent(currentSavingsRate, lastSavingsRate),
    };
  }, [transactions]);

  const getCategoryColor = (categoryName: string, index: number): string => CATEGORY_COLORS[categoryName] || CHART_COLORS[index % CHART_COLORS.length];

  return (
    <div className="w-full min-h-screen bg-white dark:bg-black">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 flex flex-col gap-6 lg:gap-8">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="รายรับเดือนนี้" value={`฿${stats.income.toLocaleString()}`} change={monthlyComparison.incomeChange} icon="account_balance_wallet" />
          <StatCard title="รายจ่ายเดือนนี้" value={`฿${stats.expenses.toLocaleString()}`} change={monthlyComparison.expenseChange} icon="credit_card" />
          <StatCard title="เงินคงเหลือสุทธิ" value={`฿${stats.net.toLocaleString()}`} change={monthlyComparison.netChange} icon="savings" />
          <StatCard title="สัดส่วนออม" value={`${stats.savingsRate}%`} change={monthlyComparison.savingsChange} icon="percent" progress={stats.savingsRate} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-sm flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
              <div>
                <h3 className="text-gray-900 dark:text-white text-lg font-bold">Income vs Expenses</h3>
                <p className="text-gray-500 dark:text-neutral-400 text-sm">Last 6 Months</p>
              </div>
            </div>
            {hasData ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 16, right: 8, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <Tooltip
                      cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                      formatter={(value: number, name: string) => [`฿${value.toLocaleString()}`, name === 'income' ? 'Income' : 'Expenses']}
                    />
                    <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyPanel text="ยังไม่มีข้อมูลเพียงพอสำหรับกราฟรายเดือน" ctaText="เพิ่มรายการแรก" ctaPath="/entry" />
            )}
          </div>

          <div className="p-6 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-sm flex flex-col">
            <h3 className="text-gray-900 dark:text-white text-lg font-bold mb-1">Expense Breakdown</h3>
            <p className="text-gray-500 dark:text-neutral-400 text-sm mb-6">By Category</p>
            {expenseBreakdown.length > 0 ? (
              <>
                <div className="h-[250px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                        {expenseBreakdown.map((entry, index) => (
                          <Cell key={`${entry.name}-${index}`} fill={getCategoryColor(entry.name, index)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string) => [`฿${value.toLocaleString()}`, name]} />
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
                        <div className="size-2.5 rounded-full" style={{ backgroundColor: getCategoryColor(item.name, index) }} />
                        <span className="text-gray-700 dark:text-neutral-300">{item.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">฿{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyPanel text="ยังไม่มีข้อมูลรายจ่าย" ctaText="บันทึกรายจ่าย" ctaPath="/entry" compact />
            )}
          </div>
        </section>

        <section className="w-full">
          <div className="w-full rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 w-full">
              <div className="relative size-20 flex-shrink-0">
                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                  <path className="text-gray-200 dark:text-neutral-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                  <path className={healthScore >= 80 ? 'text-emerald-500' : healthScore >= 60 ? 'text-blue-500' : healthScore >= 40 ? 'text-yellow-500' : 'text-red-500'} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${healthScore}, 100`} strokeWidth="3" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{healthScore}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 max-w-2xl flex-1">
                <h3 className="text-gray-900 dark:text-white text-lg font-bold">Financial Health Score</h3>
                <div className="flex gap-3 mt-1">
                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-500 mt-0.5 flex-shrink-0">smart_toy</span>
                  <p className="text-gray-700 dark:text-neutral-300 text-base leading-relaxed">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">AI Analyst:</span> {aiInsight}
                  </p>
                </div>
                {isKeyMissing && (
                  <div className="mt-1">
                    <Link to="/settings" className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700">
                      ไปที่หน้าตั้งค่า API Key
                    </Link>
                  </div>
                )}
              </div>
            </div>
            <Link to="/analysis" className="group flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all w-full md:w-auto">
              ดูรายละเอียด
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

const EmptyPanel: React.FC<{ text: string; ctaText: string; ctaPath: string; compact?: boolean }> = ({ text, ctaText, ctaPath, compact }) => (
  <div className={`rounded-lg border border-dashed border-gray-300 dark:border-neutral-700 bg-gray-50/80 dark:bg-neutral-800/40 flex flex-col items-center justify-center text-center px-4 ${compact ? 'h-[250px]' : 'h-[300px]'}`}>
    <p className="text-sm text-gray-600 dark:text-neutral-300">{text}</p>
    <Link to={ctaPath} className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4">
      {ctaText}
    </Link>
  </div>
);

const StatCard: React.FC<{ title: string; value: string; change: MonthlyChange; icon: string; progress?: number }> = ({ title, value, change, icon, progress }) => (
  <div className="p-4 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-sm flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <p className="text-gray-600 dark:text-neutral-400 text-sm font-medium">{title}</p>
      <span className="material-symbols-outlined text-gray-400 dark:text-neutral-500 text-[20px]">{icon}</span>
    </div>
    <p className="text-gray-900 dark:text-white text-2xl font-bold tracking-tight">{value}</p>
    <div className="flex items-center gap-1">
      {change === null ? (
        <p className="text-xs font-semibold text-gray-500 dark:text-neutral-400">N/A (ไม่มีข้อมูลเดือนก่อน)</p>
      ) : (
        <>
          <span className={`material-symbols-outlined text-[14px] ${change >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
            {change >= 0 ? 'trending_up' : 'trending_down'}
          </span>
          <p className={`text-sm font-medium ${change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </p>
          <span className="text-gray-500 dark:text-neutral-600 text-xs ml-1">เทียบเดือนก่อน</span>
        </>
      )}
    </div>
    {progress !== undefined && (
      <div className="w-full h-1 bg-gray-100 dark:bg-neutral-800 mt-2 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
      </div>
    )}
  </div>
);

export default Dashboard;
