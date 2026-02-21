import React, { useState, useEffect } from 'react';
import { HashRouter, Link, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import DataEntry from './components/DataEntry';
import Chat from './components/Chat';
import Login from './components/Login';
import Register from './components/Register';
import Header from './components/Header';
import Analysis from './Analysis';
import ApiKeySettings from './components/ApiKeySettings';
import { Transaction, TransactionInput, Theme, User } from './types';
import { api } from './services/api';

const ComingSoon: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="w-full">
    <div className="max-w-[920px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 sm:p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 size-14 rounded-2xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
          <span className="material-symbols-outlined text-gray-700 dark:text-neutral-200">construction</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-neutral-400">{description}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors"
          >
            กลับหน้า Dashboard
          </Link>
        </div>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const isDev = import.meta.env.DEV;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<Theme>(Theme.LIGHT);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === Theme.DARK);
    }
  }, []);

  const setLoggedOutState = () => {
    setIsLoggedIn(false);
    setUser(null);
    setTransactions([]);
  };

  const loadTransactions = async () => {
    try {
      const list = await api.listTransactions();
      setTransactions(list.transactions);
    } catch (error) {
      if (isDev) {
        console.error('[app] loadTransactions failed', error);
      }
      setTransactions([]);
    }
  };

  useEffect(() => {
    const unsubscribe = api.onAuthChange(async (authUser) => {
      if (isDev) {
        console.info('[app] onAuthChange fired', authUser ? { hasUser: true } : { hasUser: false });
      }
      if (!authUser) {
        setLoggedOutState();
        setIsAuthLoading(false);
        return;
      }

      try {
        const me = await api.me();
        setUser(me.user);
        setIsLoggedIn(true);
      } catch (error) {
        if (isDev) {
          console.error('[app] hydrateAuth failed', error);
        }
        setLoggedOutState();
        setIsAuthLoading(false);
        return;
      }

      await loadTransactions();
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, [isDev]);

  const toggleTheme = () => {
    const newTheme = theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT;
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === Theme.DARK);
  };

  const addTransaction = async (t: TransactionInput) => {
    const created = await api.createTransaction(t);
    setTransactions(prev => [created.transaction, ...prev]);
  };

  const handleLogin = async () => {
    setIsRegistering(false);
  };

  const handleLogout = () => {
    setLoggedOutState();
    void api.logout().catch((error) => {
      if (isDev) {
        console.error('[app] logout failed', error);
      }
    });
  };

  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-gray-700 dark:text-neutral-300">Loading...</div>;
  }

  if (!isLoggedIn) {
    if (isRegistering) {
      return <Register onRegister={handleLogin} onSwitchToLogin={() => setIsRegistering(false)} />;
    }
    return <Login onLogin={handleLogin} onSwitchToRegister={() => setIsRegistering(true)} />;
  }

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-white dark:bg-black pb-20 md:pb-0">
        <Header theme={theme} onToggleTheme={toggleTheme} onLogout={handleLogout} userEmail={user?.email || ''} userRole={user?.role} />
        <main className="flex-1 w-full">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard transactions={transactions} />
              }
            />
            <Route path="/entry" element={<DataEntry onAdd={addTransaction} />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/analysis" element={<Analysis transactions={transactions} />} />
            <Route path="/settings" element={<ApiKeySettings />} />
            <Route
              path="/admin"
              element={<ComingSoon title="Admin Module ถูกปิดชั่วคราว" description="โหมด Netlify-only ยังไม่เปิดใช้งานหน้าจัดการผู้ใช้ในเวอร์ชันนี้" />}
            />
            <Route
              path="/reports"
              element={<ComingSoon title="Reports กำลังพัฒนา" description="ตอนนี้สามารถดูภาพรวมผ่าน Dashboard และ Analysis ได้ก่อน" />}
            />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
