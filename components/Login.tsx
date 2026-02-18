
import React, { useState } from 'react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email');
      return;
    }

    if (!email.endsWith('@kkumail.com')) {
      setError('Only @kkumail.com emails are allowed');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    onLogin();
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
            className="flex w-full items-center justify-center rounded-lg h-12 px-5 bg-emerald-600 dark:bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-700 transition-colors text-white text-base font-bold mt-2">
            Log in
          </button>
        </form>
        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-gray-300 dark:border-neutral-700"></div>
          <span className="flex-shrink-0 mx-4 text-xs font-medium text-gray-500 dark:text-neutral-500 uppercase">Or continue with</span>
          <div className="flex-grow border-t border-gray-300 dark:border-neutral-700"></div>
        </div>
        <div className="flex flex-col gap-3 w-full">
          <button className="flex w-full items-center justify-center gap-3 rounded-lg h-12 px-4 border border-gray-300 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800 bg-white dark:bg-transparent transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4"></path>
              <path d="M12.24 24.0008C15.4765 24.0008 18.2058 22.9382 20.1945 21.1039L16.3275 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.24 24.0008Z" fill="#34A853"></path>
              <path d="M5.50253 14.3003C5.00309 12.8099 5.00309 11.1961 5.50253 9.70575V6.61481H1.5166C-0.18551 10.0056 -0.18551 14.0004 1.5166 17.3912L5.50253 14.3003Z" fill="#FBBC05"></path>
              <path d="M12.24 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.24 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.61481L5.50253 9.70575C6.45064 6.86173 9.10947 4.74966 12.24 4.74966Z" fill="#EA4335"></path>
            </svg>
            <span className="text-sm font-semibold text-gray-700 dark:text-neutral-300">Log in with Google</span>
          </button>
        </div>
        <div className="flex items-center justify-between w-full pt-4 mt-2 border-t border-gray-200 dark:border-neutral-800">
          <a className="text-sm font-medium text-gray-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" href="#">ลืมรหัสผ่าน?</a>
          <a className="text-sm font-bold text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors" href="#">ไม่มีบัญชี? ลงทะเบียน</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
