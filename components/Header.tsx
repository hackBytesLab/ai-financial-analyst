
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
    { name: 'วิเคราะห์', path: '/analysis' },
    ...(userRole === 'ADMIN' ? [{ name: 'Users', path: '/admin' }] : []),
    { name: 'รายงาน', path: '/reports' },
    { name: 'AI Chat', path: '/chat', icon: 'chat_bubble' },
    { name: 'API Key', path: '/settings', icon: 'key' },
  ];

  const mobileTabs = [
    { name: 'หลัก', path: '/', icon: 'dashboard' },
    { name: 'บันทึก', path: '/entry', icon: 'edit_square' },
    { name: 'วิเคราะห์', path: '/analysis', icon: 'monitoring' },
    { name: 'แชต', path: '/chat', icon: 'chat' },
    { name: 'ตั้งค่า', path: '/settings', icon: 'settings' },
  ];

  const initials = userEmail
    ? userEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'U'
    : 'U';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-neutral-800 bg-white/95 dark:bg-black/95 backdrop-blur-sm">
        <div className="px-4 sm:px-6 lg:px-10 py-3.5 max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <span className="material-symbols-outlined text-[22px]">analytics</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-gray-900 dark:text-white truncate">AI Financial Analyst</h2>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors flex items-center gap-2 relative ${
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold after:content-[""] after:absolute after:-bottom-[18px] after:left-0 after:w-full after:h-0.5 after:bg-emerald-600 dark:after:bg-emerald-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                  }`}
                >
                  {link.icon && <span className="material-symbols-outlined text-[19px]">{link.icon}</span>}
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              className="size-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-white hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-all"
              onClick={onToggleTheme}
              title="เปลี่ยนธีม"
            >
              <span className="material-symbols-outlined">{theme === Theme.LIGHT ? 'dark_mode' : 'light_mode'}</span>
            </button>
            <div className="hidden lg:flex items-center gap-2 text-xs text-gray-600 dark:text-neutral-400 max-w-[180px]">
              <span className="material-symbols-outlined text-[18px]">person</span>
              <span className="truncate">{userEmail}</span>
            </div>
            <button
              onClick={onLogout}
              className="size-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-white hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
              title="ออกจากระบบ"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
            <div className="size-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center text-xs font-bold border border-white/30">
              {initials}
            </div>
          </div>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-neutral-800 bg-white/95 dark:bg-black/95 backdrop-blur-sm">
        <div className="grid grid-cols-5">
          {mobileTabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`h-16 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-gray-500 dark:text-neutral-400'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                <span>{tab.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Header;
