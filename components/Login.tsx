
import React, { useState } from 'react';
import { api, normalizeAuthError } from '../services/api';

interface LoginProps {
  onLogin: () => void;
  onSwitchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('กรุณากรอกอีเมล');
      return;
    }

    if (!password) {
      setError('กรุณากรอกรหัสผ่าน');
      return;
    }

    try {
      setIsLoading(true);
      await api.login(email, password);
      onLogin();
    } catch (err) {
      setError(normalizeAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 min-h-screen bg-white dark:bg-black">
      <div className="w-full max-w-[480px] bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-8 sm:p-10 flex flex-col gap-6 relative overflow-hidden">
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="size-12 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-emerald-700 dark:text-emerald-400 text-3xl">school</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white text-center">เข้าสู่ระบบ</h1>
          <p className="text-sm text-gray-600 dark:text-neutral-400 text-center">Welcome back, student!</p>
        </div>
        <form className="flex flex-col gap-5 w-full" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-800 rounded-lg p-3 text-red-800 dark:text-red-200 text-sm">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-900 dark:text-white text-sm font-bold leading-normal">Email</label>
            <div className="relative">
              <input 
                className="w-full rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 h-12 px-4 placeholder-gray-500 dark:placeholder-neutral-600" 
                placeholder="name@kkumail.com" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 dark:text-neutral-500">
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-900 dark:text-white text-sm font-bold leading-normal">Password</label>
            <div className="relative">
              <input 
                className="w-full rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 h-12 px-4 placeholder-gray-500 dark:placeholder-neutral-600" 
                placeholder="Enter your password" 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div 
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility' : 'visibility_off'}
                </span>
              </div>
            </div>
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
            className="flex w-full items-center justify-center rounded-lg h-12 px-5 bg-emerald-600 dark:bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-700 transition-colors text-white text-base font-bold mt-2 disabled:opacity-60">
            {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
        <div className="text-xs leading-relaxed text-gray-500 dark:text-neutral-400 rounded-lg bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-800 p-3">
          ระบบนี้ใช้ Netlify Identity: ถ้าสมัครใหม่และระบบบังคับยืนยันอีเมล กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ
        </div>
        <div className="flex items-center justify-between w-full pt-4 mt-2 border-t border-gray-200 dark:border-neutral-800">
          <button
            onClick={onSwitchToRegister}
            className="ml-auto text-sm font-bold text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
          >
            ไม่มีบัญชี? ลงทะเบียน
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
