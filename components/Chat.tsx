import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { chatWithAI } from '../services/geminiService';
import { ChatMessage } from '../types';

const INITIAL_MESSAGE: ChatMessage = {
  role: 'model',
  text: 'สวัสดีครับ ผมช่วยวิเคราะห์การเงินส่วนบุคคลได้ เช่น งบรายเดือน, การออม และการควบคุมรายจ่าย',
  timestamp: new Date(),
};

const SUGGESTED_PROMPTS = [
  'ฉันใช้จ่ายเกินไปไหม?',
  'ควรออมเงินกี่เปอร์เซ็นต์ของรายได้ดี?',
  'ช่วยวางงบรายสัปดาห์ให้หน่อย',
];

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input.trim(), timestamp: new Date() };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);
    setApiError('');

    const history = nextMessages.map((m) => ({ role: m.role, parts: [{ text: m.text }] }));

    try {
      const response = await chatWithAI(userMessage.text, history);
      setMessages((prev) => [...prev, { role: 'model', text: response || 'No response', timestamp: new Date() }]);
    } catch (error) {
      if (error instanceof Error && error.message.includes('GEMINI_API_KEY_MISSING')) {
        setApiError('กรุณาตั้งค่า Gemini API Key ก่อนใช้งาน AI Chat');
      } else {
        setApiError('ไม่สามารถเชื่อมต่อกับ AI ได้ในขณะนี้');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const showWelcome = messages.length <= 1;

  return (
    <div className="w-full min-h-screen bg-white dark:bg-black">
      <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-4 md:py-6 flex flex-col h-[calc(100vh-76px)] md:h-[calc(100vh-84px)]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 pb-4">
          {apiError && (
            <div className="rounded-lg border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950 p-4 text-sm text-yellow-800 dark:text-yellow-200">
              <div className="font-semibold mb-1">ต้องตั้งค่า API Key</div>
              <div className="flex items-center gap-2">
                <span>{apiError}</span>
                <Link to="/settings" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700">
                  ไปตั้งค่า
                </Link>
              </div>
            </div>
          )}

          {showWelcome && (
            <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 p-5">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">เริ่มถามคำถามการเงินได้เลย</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-neutral-400">ตัวอย่าง: ตรวจรายจ่ายเกินจำเป็น, ตั้งเป้าออม, วางแผนงบรายเดือน</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="h-9 rounded-full border border-gray-300 dark:border-neutral-700 px-4 text-xs font-medium text-gray-700 dark:text-neutral-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex items-start gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
              {m.role === 'model' && (
                <div className="bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center rounded-full w-9 h-9 shrink-0 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                </div>
              )}
              <div className={`flex flex-col gap-1 max-w-[88%] md:max-w-[70%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-3.5 rounded-2xl border ${
                  m.role === 'user'
                    ? 'bg-emerald-600 text-white border-emerald-600 rounded-tr-none'
                    : 'bg-gray-100 dark:bg-neutral-900 text-gray-900 dark:text-white border-gray-200 dark:border-neutral-800 rounded-tl-none'
                } text-sm leading-relaxed`}>
                  {m.text}
                </div>
                <span className="text-[10px] text-gray-500 dark:text-neutral-500">
                  {m.timestamp.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 animate-pulse">
              <span className="material-symbols-outlined">more_horiz</span>
              <span className="text-xs">AI กำลังพิมพ์...</span>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gradient-to-t from-white via-white dark:from-black dark:via-black pt-3 pb-2 md:pb-4">
          <div className="relative flex items-center bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 focus-within:ring-2 focus-within:ring-emerald-500/50 transition-all p-2">
            <input
              className="flex-1 bg-transparent border-none outline-none text-sm md:text-base px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-neutral-500"
              placeholder="ถามคำถามเกี่ยวกับการเงินของคุณ..."
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg p-2 md:px-4 md:py-2 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
              <span className="hidden md:inline text-sm font-semibold">ส่ง</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
