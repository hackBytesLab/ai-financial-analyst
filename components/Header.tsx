
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Theme } from '../types';

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  onLogout: () => void;
  userEmail: string;
  userRole?: string | null;
}

const Header: React.FC<HeaderProps> = ({ theme, onToggleTheme, onLogout, userEmail, userRole }) => {
  const location = useLocation();

  const navLinks = [
    { name: 'Dashboard', path: '/' },
    { name: 'บันทึกข้อมูล', path: '/entry' },
    ...(userRole === 'ADMIN' ? [{ name: 'Users', path: '/admin' }] : []),
    { name: 'รายงาน', path: '/reports' },
    { name: 'AI Chat', path: '/chat', icon: 'chat_bubble' },
    { name: 'API Key', path: '/settings', icon: 'key' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-neutral-800 bg-white/95 dark:bg-black/95 backdrop-blur-sm">
      <div className="px-6 lg:px-10 py-4 max-w-[1440px] mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>analytics</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">AI Financial Analyst</h2>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors flex items-center gap-2 relative ${
                  isActive 
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold after:content-[""] after:absolute after:-bottom-5 after:left-0 after:w-full after:h-0.5 after:bg-emerald-600 dark:after:bg-emerald-400' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                {link.icon && <span className="material-symbols-outlined text-[20px]">{link.icon}</span>}
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <button 
            className="size-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-white hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-all"
            onClick={onToggleTheme}
          >
            <span className="material-symbols-outlined">{theme === Theme.LIGHT ? 'dark_mode' : 'light_mode'}</span>
          </button>
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-600 dark:text-neutral-400">
            <span className="material-symbols-outlined text-[18px]">person</span>
            <span>{userEmail}</span>
          </div>
          <button
            onClick={onLogout}
            className="size-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-white hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
            title="Log out"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
          <div className="size-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 dark:from-emerald-600 dark:to-emerald-800 overflow-hidden border border-white dark:border-white/20 ml-2">
            <img 
              alt="User" 
              src="https://picsum.photos/100/100?random=1" 
              className="w-full h-full object-cover" 
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
