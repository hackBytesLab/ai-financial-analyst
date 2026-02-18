
import React, { useState, useRef, useEffect } from 'react';
import { chatWithAI } from '../services/geminiService';
import { ChatMessage } from '../types';

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'สวัสดีครับ! วันนี้มีเรื่องการเงินอะไรให้ผมช่วยไหม? ผมสามารถช่วยวิเคราะห์รายรับรายจ่าย หรือแนะนำการออมเบื้องต้นได้นะครับ', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const history = [...messages, userMessage].map(m => ({ role: m.role, parts: [{ text: m.text }] }));
    const response = await chatWithAI(input, history);

    setMessages(prev => [...prev, { role: 'model', text: response || 'No response', timestamp: new Date() }]);
    setIsLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col relative w-full max-w-5xl mx-auto h-[calc(100vh-80px)] overflow-hidden bg-white dark:bg-black">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-10 py-6 space-y-8 scrollbar-hide pb-32">
        <div className="flex justify-center my-4">
          <span className="text-xs font-medium text-gray-600 dark:text-neutral-500 bg-gray-100 dark:bg-neutral-900 px-3 py-1 rounded-full">
            วันนี้, {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
          </span>
        </div>

        {messages.map((m, i) => (
          <div key={i} className={`flex items-start gap-4 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'model' && (
              <div className="bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center aspect-square rounded-full w-10 h-10 shrink-0 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              </div>
            )}
            <div className={`flex flex-col gap-1 max-w-[85%] md:max-w-[70%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              {m.role === 'model' && <span className="text-emerald-600 dark:text-emerald-500 text-xs font-semibold mb-1">AI Analyst</span>}
              <div className={`p-4 rounded-2xl shadow-sm border ${
                m.role === 'user' 
                  ? 'bg-emerald-600 dark:bg-emerald-600 text-white rounded-tr-none' 
                  : 'bg-gray-100 dark:bg-neutral-900 text-gray-900 dark:text-white border-gray-200 dark:border-neutral-800 rounded-tl-none'
              } text-sm md:text-base leading-relaxed`}>
                {m.text}
              </div>
              <span className="text-[10px] text-gray-500 dark:text-neutral-500 font-medium mt-1 mr-1">
                {m.timestamp.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
              </span>
            </div>
            {m.role === 'user' && (
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-200 dark:border-neutral-800">
                <img alt="User" className="w-full h-full object-cover" src="https://picsum.photos/100/100?random=2" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 animate-pulse">
            <span className="material-symbols-outlined">more_horiz</span>
            <span className="text-xs">AI กำลังพิมพ์...</span>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white dark:from-black dark:via-black pt-10 pb-6 px-4 md:px-10 z-10">
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <PromptChip text="ฉันใช้จ่ายเกินไปไหม?" icon="trending_up" onClick={() => setInput("ฉันใช้จ่ายเกินไปไหม?")} />
            <PromptChip text="ควรออมเท่าไหร่?" onClick={() => setInput("ควรออมเงินกี่เปอร์เซ็นต์ของรายได้ดี?")} />
            <PromptChip text="แนะนำกองทุนรวมให้หน่อย" onClick={() => setInput("แนะนำกองทุนรวมสำหรับนักศึกษาหน่อยครับ")} />
          </div>
          <div className="relative flex items-center bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-800 focus-within:ring-2 focus-within:ring-emerald-500/50 transition-all p-2">
            <button className="p-2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors rounded-lg">
              <span className="material-symbols-outlined">add_circle</span>
            </button>
            <input 
              className="flex-1 bg-transparent border-none outline-none text-sm md:text-base px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-neutral-500" 
              placeholder="ถามคำถามเกี่ยวกับการเงินของคุณ..." 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-400 transition-colors rounded-lg mr-1">
              <span className="material-symbols-outlined">mic</span>
            </button>
            <button 
              onClick={handleSend}
              disabled={isLoading}
              className="bg-emerald-600 dark:bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-700 text-white rounded-lg p-2 md:px-4 md:py-2 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
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

const PromptChip: React.FC<{ text: string; icon?: string; onClick: () => void }> = ({ text, icon, onClick }) => (
  <button 
    onClick={onClick}
    className="whitespace-nowrap flex h-9 items-center justify-center gap-x-2 rounded-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-emerald-600 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 px-4 transition-all"
  >
    {icon && <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-emerald-500">{icon}</span>}
    <p className="text-gray-700 dark:text-neutral-300 text-xs font-medium">{text}</p>
  </button>
);

export default Chat;
