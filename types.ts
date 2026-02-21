
export type TransactionType = 'income' | 'expense' | 'invest';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  note: string;
}

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  note: string;
}

export interface TransactionFormState {
  type: TransactionType;
  amount: string;
  category: string;
  date: string;
  note: string;
}

export type UiFeedbackType = 'success' | 'error' | 'info';

export interface UiFeedback {
  type: UiFeedbackType;
  message: string;
}

export interface User {
  id: string;
  email: string;
  role?: 'USER' | 'ADMIN';
  lastLogin?: string | null;
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
  timestamp: Date;
}

/** One turn in chat history for the Gemini API (role + parts). */
export interface ChatHistoryTurn {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}
