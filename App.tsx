import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
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
import { clearAuthToken, getAuthToken } from './services/authStore';

const App: React.FC = () => {
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

  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsAuthLoading(false);
        return;
      }
      try {
        const me = await api.me();
        setUser(me.user);
        setIsLoggedIn(true);
        const list = await api.listTransactions();
        setTransactions(list.transactions);
      } catch {
        clearAuthToken();
      } finally {
        setIsAuthLoading(false);
      }
    };
    initAuth();
  }, []);

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
    setIsLoggedIn(true);
    setIsRegistering(false);
    try {
      const me = await api.me();
      setUser(me.user);
      const list = await api.listTransactions();
      setTransactions(list.transactions);
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    setIsLoggedIn(false);
    setUser(null);
    setTransactions([]);
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
      <div className="min-h-screen flex flex-col bg-white dark:bg-black">
        <Header theme={theme} onToggleTheme={toggleTheme} onLogout={handleLogout} userEmail={user?.email || ''} />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard transactions={transactions} />} />
            <Route path="/entry" element={<DataEntry onAdd={addTransaction} />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/analysis" element={<Analysis transactions={transactions} />} />
            <Route path="/settings" element={<ApiKeySettings />} />
            <Route path="/reports" element={<div className="p-10 text-center text-gray-900 dark:text-white">Reports Page - Coming Soon</div>} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
