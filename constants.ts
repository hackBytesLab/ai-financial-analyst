
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

export const CHART_COLORS = ['#19e619', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7'];
