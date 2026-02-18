import { Transaction } from './types';

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'income', amount: 10, category: 'Salary', date: '2024-06-01', note: 'Monthly Salary' },
  { id: '2', type: 'expense', amount: 2870, category: 'Food', date: '2024-06-05', note: 'Groceries' },
  { id: '3', type: 'expense', amount: 2050, category: 'Rent', date: '2024-06-02', note: 'Apartment' },
  { id: '4', type: 'expense', amount: 1640, category: 'Transport', date: '2024-06-10', note: 'Fuel' },
  { id: '5', type: 'expense', amount: 820, category: 'Utilities', date: '2024-06-12', note: 'Electricity' },
  { id: '6', type: 'expense', amount: 820, category: 'Ent.', date: '2024-06-15', note: 'Cinema' },
];

export const INCOME_CATEGORIES = ['Salary', 'Allowance', 'Freelance', 'Bonus', 'Other'];
export const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Education', 'Ent.', 'Rent'];
export const INVEST_TYPES = ['Mutual Fund', 'Stocks', 'Crypto', 'Savings'];

// Distinct colors per expense category
export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f97316',       // orange
  Transport: '#3b82f6',  // blue
  Shopping: '#a855f7',   // purple
  Bills: '#eab308',      // yellow
  Education: '#06b6d4',  // cyan
  'Ent.': '#ec4899',     // pink
  Rent: '#ef4444',       // red
  Utilities: '#14b8a6',  // teal
};

// Fallback ordered colors for any unknown categories
export const CHART_COLORS = ['#f97316', '#3b82f6', '#a855f7', '#eab308', '#06b6d4', '#ec4899', '#ef4444', '#14b8a6'];
