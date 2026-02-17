import React, { useEffect, useState } from 'react';
import { clearGeminiKey, getGeminiKey, setGeminiKey } from '../services/apiKeyStore';

const ApiKeySettings: React.FC = () => {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<'set' | 'empty'>('empty');
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = getGeminiKey();
    if (stored) {
      setStatus('set');
      setValue(stored);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!value.trim()) {
      setError('กรุณากรอก Gemini API Key ก่อนบันทึก');
      return;
    }
    setGeminiKey(value);
    setStatus('set');
  };

  const handleClear = () => {
    clearGeminiKey();
    setValue('');
    setStatus('empty');
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-black">
      <div className="w-full max-w-[900px] mx-auto px-4 sm:px-6 lg:px-10 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Key Settings</h1>
          <p className="text-sm text-gray-500 dark:text-neutral-400">ตั้งค่า Gemini API Key สำหรับใช้งาน AI บนเว็บนี้</p>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full ${
              status === 'set'
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                : 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400'
            }`}>
              {status === 'set' ? 'Configured' : 'Not configured'}
            </span>
            <span className="text-xs text-gray-500 dark:text-neutral-400">
              คีย์ถูกเก็บในเบราว์เซอร์ของคุณเท่านั้น
            </span>
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-800 rounded-lg p-3 text-red-800 dark:text-red-200 text-sm">
              {error}
            </div>
          )}

          <form className="flex flex-col gap-4" onSubmit={handleSave}>
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-900 dark:text-white text-sm font-bold leading-normal">Gemini API Key</label>
              <input
                className="w-full rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 h-12 px-4 placeholder-gray-500 dark:placeholder-neutral-600"
                placeholder="paste your API key here"
                type="password"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="flex items-center justify-center rounded-lg h-11 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors"
              >
                Save Key
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center justify-center rounded-lg h-11 px-5 border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 text-sm font-bold transition-colors"
              >
                Clear Key
              </button>
            </div>
          </form>

          <div className="text-xs text-gray-500 dark:text-neutral-400">
            เหตุผลด้านความปลอดภัย: เว็บนี้ถูก deploy แบบ public จึงไม่สามารถฝัง API key ของเจ้าของโปรเจกต์ไว้ในโค้ดได้
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeySettings;
