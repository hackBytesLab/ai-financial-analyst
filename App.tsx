import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import DataEntry from './components/DataEntry';
import Chat from './components/Chat';
import Login from './components/Login';
import Header from './components/Header';
import Analysis from './components/Analysis';
import { Transaction, Theme } from './types';
import { INITIAL_TRANSACTIONS } from './constants';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [theme, setTheme] = useState<Theme>(Theme.LIGHT);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === Theme.DARK);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT;
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === Theme.DARK);
  };

  const addTransaction = (t: Transaction) => {
    setTransactions(prev => [t, ...prev]);
  };

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-white dark:bg-black">
        <Header theme={theme} onToggleTheme={toggleTheme} />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard transactions={transactions} />} />
            <Route path="/entry" element={<DataEntry onAdd={addTransaction} />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/analysis" element={<Analysis transactions={transactions} />} />
            <Route path="/reports" element={<div className="p-10 text-center text-gray-900 dark:text-white">Reports Page - Coming Soon</div>} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
