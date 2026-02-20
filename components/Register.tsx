import React, { useState } from 'react';
import { api, normalizeAuthError } from '../services/api';

interface RegisterProps {
  onRegister: () => void;
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      await api.register(email, password);
      onRegister();
    } catch (err) {
      const message = normalizeAuthError(err);
      if (message === 'Email not confirmed') {
        setError('สมัครสำเร็จแล้ว แต่ยังต้องยืนยันอีเมลก่อนเข้าสู่ระบบ');
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 min-h-screen bg-white dark:bg-black">
      <div className="w-full max-w-[480px] bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-8 sm:p-10 flex flex-col gap-6 relative overflow-hidden">
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="size-12 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-emerald-700 dark:text-emerald-400 text-3xl">person_add</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white text-center">สร้างบัญชี</h1>
          <p className="text-sm text-gray-600 dark:text-neutral-400 text-center">Create your account</p>
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
                placeholder="name@example.com"
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
                placeholder="Create a password"
                type={showPassword ? 'text' : 'password'}
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
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-900 dark:text-white text-sm font-bold leading-normal">Confirm Password</label>
            <div className="relative">
              <input
                className="w-full rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 h-12 px-4 placeholder-gray-500 dark:placeholder-neutral-600"
                placeholder="Repeat password"
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center rounded-lg h-12 px-5 bg-emerald-600 dark:bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-700 transition-colors text-white text-base font-bold mt-2 disabled:opacity-60"
          >
            {isLoading ? 'Creating...' : 'Create account'}
          </button>
        </form>

        <div className="flex items-center justify-between w-full pt-4 mt-2 border-t border-gray-200 dark:border-neutral-800">
          <button
            onClick={onSwitchToLogin}
            className="text-sm font-bold text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
          >
            มีบัญชีแล้ว? เข้าสู่ระบบ
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
