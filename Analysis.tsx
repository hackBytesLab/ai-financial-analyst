import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Transaction } from '../types';
import { CATEGORY_COLORS, CHART_COLORS } from '../constants';
import { getFinancialAnalysis } from '../services/geminiService';

interface AnalysisProps {
  transactions: Transaction[];
}

interface HealthMetric {
  label: string;
  score: number;
  maxScore: number;
  icon: string;
  description: string;
  status: 'excellent' | 'good' | 'warning' | 'danger';
}

const Analysis: React.FC<AnalysisProps> = ({ transactions }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string>("กำลังวิเคราะห์ข้อมูลการเงินของคุณ...");
  const [isLoadingAI, setIsLoadingAI] = useState(true);

  // Calculate all financial stats
  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const invest = transactions.filter(t => t.type === 'invest').reduce((acc, t) => acc + t.amount, 0);
    const net = income - expenses;
    const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0;
    return { income, expenses, invest, net, savingsRate };
  }, [transactions]);

  // Expense breakdown by category
  const expenseBreakdown = useMemo(() => {
    const groups: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      groups[t.category] = (groups[t.category] || 0) + t.amount;
    });
    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Top expense category
  const topExpenseCategory = expenseBreakdown.length > 0 ? expenseBreakdown[0] : null;

  // Calculate individual health metrics
  const healthMetrics: HealthMetric[] = useMemo(() => {
    // 1. Savings Rate Score (0-25)
    const savingsRate = stats.savingsRate;
    let savingsScore = 0;
    let savingsStatus: HealthMetric['status'] = 'danger';
    if (savingsRate >= 20) { savingsScore = 25; savingsStatus = 'excellent'; }
    else if (savingsRate >= 10) { savingsScore = 18; savingsStatus = 'good'; }
    else if (savingsRate >= 5) { savingsScore = 10; savingsStatus = 'warning'; }
    else { savingsScore = Math.max(0, Math.round(savingsRate * 2)); savingsStatus = 'danger'; }

    // 2. Expense Ratio Score (0-25) — expenses should be < 70% of income
    const expenseRatio = stats.income > 0 ? (stats.expenses / stats.income) * 100 : 100;
    let expenseScore = 0;
    let expenseStatus: HealthMetric['status'] = 'danger';
    if (expenseRatio <= 50) { expenseScore = 25; expenseStatus = 'excellent'; }
    else if (expenseRatio <= 70) { expenseScore = 20; expenseStatus = 'good'; }
    else if (expenseRatio <= 85) { expenseScore = 12; expenseStatus = 'warning'; }
    else { expenseScore = 5; expenseStatus = 'danger'; }

    // 3. Diversification Score (0-25) — more categories = more diversified spending
    const categoryCount = expenseBreakdown.length;
    const topPct = topExpenseCategory && stats.expenses > 0
      ? (topExpenseCategory.value / stats.expenses) * 100 : 100;
    let diverseScore = 0;
    let diverseStatus: HealthMetric['status'] = 'danger';
    if (categoryCount >= 4 && topPct < 40) { diverseScore = 25; diverseStatus = 'excellent'; }
    else if (categoryCount >= 3 && topPct < 50) { diverseScore = 18; diverseStatus = 'good'; }
    else if (categoryCount >= 2) { diverseScore = 12; diverseStatus = 'warning'; }
    else { diverseScore = 5; diverseStatus = 'danger'; }

    // 4. Consistency Score (0-25) — regular income entries
    const incomeEntries = transactions.filter(t => t.type === 'income').length;
    let consistScore = 0;
    let consistStatus: HealthMetric['status'] = 'danger';
    if (incomeEntries >= 3) { consistScore = 25; consistStatus = 'excellent'; }
    else if (incomeEntries >= 2) { consistScore = 18; consistStatus = 'good'; }
    else if (incomeEntries >= 1) { consistScore = 12; consistStatus = 'warning'; }
    else { consistScore = 0; consistStatus = 'danger'; }

    return [
      {
        label: 'อัตราการออม',
        score: savingsScore,
        maxScore: 25,
        icon: 'savings',
        description: `ออมได้ ${savingsRate}% ของรายรับ${savingsRate >= 20 ? ' — ยอดเยี่ยม!' : savingsRate >= 10 ? ' — ดีมาก' : ' — ควรเพิ่มการออม'}`,
        status: savingsStatus,
      },
      {
        label: 'สัดส่วนรายจ่าย',
        score: expenseScore,
        maxScore: 25,
        icon: 'account_balance',
        description: `ใช้จ่าย ${Math.round(expenseRatio)}% ของรายรับ${expenseRatio <= 50 ? ' — ควบคุมได้ดีมาก' : expenseRatio <= 70 ? ' — อยู่ในเกณฑ์ดี' : ' — ค่อนข้างสูง'}`,
        status: expenseStatus,
      },
      {
        label: 'การกระจายค่าใช้จ่าย',
        score: diverseScore,
        maxScore: 25,
        icon: 'pie_chart',
        description: `มี ${categoryCount} หมวดหมู่${topPct < 40 ? ' — กระจายดี' : ' — กระจุกตัวมากไป'}`,
        status: diverseStatus,
      },
      {
        label: 'ความสม่ำเสมอของรายรับ',
        score: consistScore,
        maxScore: 25,
        icon: 'event_repeat',
        description: `บันทึกรายรับ ${incomeEntries} รายการ${incomeEntries >= 3 ? ' — สม่ำเสมอดี' : ' — ลองบันทึกให้ถี่ขึ้น'}`,
        status: consistStatus,
      },
    ];
  }, [stats, expenseBreakdown, topExpenseCategory, transactions]);

  const totalScore = healthMetrics.reduce((sum, m) => sum + m.score, 0);

  const overallStatus = useMemo(() => {
    if (totalScore >= 80) return { label: 'ยอดเยี่ยม', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950' };
    if (totalScore >= 60) return { label: 'ดี', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-950' };
    if (totalScore >= 40) return { label: 'พอใช้', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-950' };
    return { label: 'ต้องปรับปรุง', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-950' };
  }, [totalScore]);

  // Radar chart data
  const radarData = healthMetrics.map(m => ({
    subject: m.label,
    score: m.score,
    fullMark: m.maxScore,
  }));

  // Fetch AI deep analysis
  useEffect(() => {
    const fetchAnalysis = async () => {
      setIsLoadingAI(true);
      const details = {
        income: stats.income,
        expenses: stats.expenses,
        net: stats.net,
        savingsRate: stats.savingsRate,
        totalScore,
        topCategory: topExpenseCategory?.name || 'N/A',
        topCategoryAmount: topExpenseCategory?.value || 0,
        categoryCount: expenseBreakdown.length,
        metrics: healthMetrics.map(m => `${m.label}: ${m.score}/${m.maxScore}`).join(', '),
      };
      const summary = JSON.stringify(details);
      const result = await getFinancialAnalysis(summary);
      setAiAnalysis(result);
      setIsLoadingAI(false);
    };
    fetchAnalysis();
  }, [stats, totalScore, topExpenseCategory, expenseBreakdown.length, healthMetrics]);

  const getStatusColor = (status: HealthMetric['status']) => {
    switch (status) {
      case 'excellent': return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950', bar: 'bg-emerald-500' };
      case 'good': return { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-950', bar: 'bg-blue-500' };
      case 'warning': return { text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-950', bar: 'bg-yellow-500' };
      case 'danger': return { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-950', bar: 'bg-red-500' };
    }
  };

  const getCategoryColor = (name: string, index: number) => {
    return CATEGORY_COLORS[name] || CHART_COLORS[index % CHART_COLORS.length];
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-black">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 flex flex-col gap-6 lg:gap-8">

        {/* Back + Title */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center justify-center size-10 rounded-lg bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors">
            <span className="material-symbols-outlined text-gray-700 dark:text-neutral-300">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Health Analysis</h1>
            <p className="text-sm text-gray-500 dark:text-neutral-400">วิเคราะห์สุขภาพทางการเงินโดย AI อย่างละเอียด</p>
          </div>
        </div>

        {/* Score Overview */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Score Circle */}
          <div className="p-6 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-sm flex flex-col items-center justify-center gap-4">
            <div className="relative size-40">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-200 dark:text-neutral-700"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="currentColor" strokeWidth="2.5"
                />
                <path
                  className={totalScore >= 80 ? 'text-emerald-500' : totalScore >= 60 ? 'text-blue-500' : totalScore >= 40 ? 'text-yellow-500' : 'text-red-500'}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="currentColor" strokeDasharray={`${totalScore}, 100`} strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 1s ease-in-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">{totalScore}</span>
                <span className="text-xs text-gray-500 dark:text-neutral-500">/ 100</span>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-bold ${overallStatus.bg} ${overallStatus.color}`}>
              {overallStatus.label}
            </div>
            <p className="text-center text-sm text-gray-600 dark:text-neutral-400">
              คะแนนรวมจาก 4 ตัวชี้วัดหลัก
            </p>
          </div>

          {/* Radar Chart */}
          <div className="p-6 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-sm flex flex-col">
            <h3 className="text-gray-900 dark:text-white text-lg font-bold mb-1">ภาพรวมตัวชี้วัด</h3>
            <p className="text-gray-500 dark:text-neutral-400 text-sm mb-4">Radar Overview</p>
            <div className="flex-1 h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 25]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expense Pie (mini) */}
          <div className="p-6 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-sm flex flex-col">
            <h3 className="text-gray-900 dark:text-white text-lg font-bold mb-1">สัดส่วนค่าใช้จ่าย</h3>
            <p className="text-gray-500 dark:text-neutral-400 text-sm mb-4">Expense Distribution</p>
            <div className="h-[160px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name, index)} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-bold text-gray-900 dark:text-white">฿{(stats.expenses / 1000).toFixed(1)}k</span>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              {expenseBreakdown.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full" style={{ backgroundColor: getCategoryColor(item.name, index) }}></div>
                    <span className="text-gray-600 dark:text-neutral-400">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {stats.expenses > 0 ? Math.round((item.value / stats.expenses) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Detail Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {healthMetrics.map((metric) => {
            const colors = getStatusColor(metric.status);
            const pct = Math.round((metric.score / metric.maxScore) * 100);
            return (
              <div key={metric.label} className="p-5 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                      <span className={`material-symbols-outlined text-[20px] ${colors.text}`}>{metric.icon}</span>
                    </div>
                    <div>
                      <h4 className="text-gray-900 dark:text-white font-bold text-sm">{metric.label}</h4>
                      <p className="text-gray-500 dark:text-neutral-500 text-xs">{metric.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-bold ${colors.text}`}>{metric.score}</span>
                    <span className="text-gray-400 dark:text-neutral-600 text-sm">/{metric.maxScore}</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Summary Stats */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MiniStat label="รายรับรวม" value={`฿${stats.income.toLocaleString()}`} icon="trending_up" color="emerald" />
          <MiniStat label="รายจ่ายรวม" value={`฿${stats.expenses.toLocaleString()}`} icon="trending_down" color="red" />
          <MiniStat label="คงเหลือสุทธิ" value={`฿${stats.net.toLocaleString()}`} icon="account_balance" color="blue" />
          <MiniStat label="อัตราออม" value={`${stats.savingsRate}%`} icon="percent" color="purple" />
        </section>

        {/* AI Deep Analysis */}
        <section className="w-full">
          <div className="w-full rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">psychology</span>
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white text-lg font-bold">AI Deep Analysis</h3>
                <p className="text-gray-500 dark:text-neutral-400 text-xs">วิเคราะห์เชิงลึกจาก AI ตามข้อมูลจริงของคุณ</p>
              </div>
            </div>

            {isLoadingAI ? (
              <div className="flex items-center gap-3 py-4">
                <div className="flex gap-1">
                  <div className="size-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="size-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="size-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-gray-500 dark:text-neutral-400">AI กำลังวิเคราะห์ข้อมูลของคุณ...</span>
              </div>
            ) : (
              <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-5">
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-500 mt-0.5 flex-shrink-0">smart_toy</span>
                  <div className="text-gray-700 dark:text-neutral-300 text-sm leading-relaxed whitespace-pre-line">
                    {aiAnalysis}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <Link
                to="/chat"
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                ถาม AI เพิ่มเติม
              </Link>
              <Link
                to="/entry"
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 font-bold text-sm transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                เพิ่มข้อมูลการเงิน
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

const MiniStat: React.FC<{ label: string; value: string; icon: string; color: string }> = ({ label, value, icon, color }) => {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950',
    red: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950',
  };
  const cls = colorMap[color] || colorMap.emerald;

  return (
    <div className="p-4 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-sm flex items-center gap-3">
      <div className={`size-9 rounded-lg flex items-center justify-center ${cls}`}>
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-neutral-500 font-medium">{label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
};

export default Analysis;
