import React, { useMemo, useState } from 'react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, INVEST_TYPES } from '../constants';
import { TransactionFormState, TransactionInput, TransactionType, UiFeedback } from '../types';

interface DataEntryProps {
  onAdd: (t: TransactionInput) => Promise<void>;
}

const EMPTY_FORM = (): TransactionFormState => ({
  type: 'income',
  amount: '',
  category: '',
  date: new Date().toISOString().split('T')[0],
  note: '',
});

const QUICK_AMOUNTS = [100, 300, 500, 1000, 2000];

const TYPE_META: Record<TransactionType, { title: string; desc: string; color: string; icon: string }> = {
  income: { title: 'รายรับ', desc: 'บันทึกรายได้ของคุณ', color: 'emerald', icon: 'trending_up' },
  expense: { title: 'รายจ่าย', desc: 'บันทึกค่าใช้จ่ายประจำวัน', color: 'red', icon: 'trending_down' },
  invest: { title: 'การลงทุน', desc: 'บันทึกเงินที่นำไปลงทุน', color: 'blue', icon: 'monitoring' },
};

function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  return date.toISOString().slice(0, 10) === value;
}

const DataEntry: React.FC<DataEntryProps> = ({ onAdd }) => {
  const [form, setForm] = useState<TransactionFormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<UiFeedback | null>(null);

  const categories = useMemo(() => {
    if (form.type === 'income') return INCOME_CATEGORIES;
    if (form.type === 'expense') return EXPENSE_CATEGORIES;
    return INVEST_TYPES;
  }, [form.type]);

  const typeMeta = TYPE_META[form.type];

  const fieldError = useMemo(() => {
    const amount = Number(form.amount);
    if (!form.amount.trim()) return 'กรุณากรอกจำนวนเงิน';
    if (!Number.isFinite(amount) || amount <= 0) return 'จำนวนเงินต้องมากกว่า 0';
    if (!form.category.trim()) return 'กรุณาเลือกหมวดหมู่';
    if (!form.date.trim()) return 'กรุณาเลือกวันที่';
    if (!isValidDateString(form.date)) return 'รูปแบบวันที่ไม่ถูกต้อง';
    if (form.note.length > 500) return 'บันทึกช่วยจำยาวเกิน 500 ตัวอักษร';
    return '';
  }, [form]);

  const handleTypeChange = (type: TransactionType) => {
    setForm((prev) => ({ ...prev, type, category: '' }));
    setFeedback(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (fieldError) {
      setFeedback({ type: 'error', message: fieldError });
      return;
    }

    try {
      setIsSubmitting(true);
      await onAdd({
        type: form.type,
        amount: Number(form.amount),
        category: form.category.trim(),
        date: form.date,
        note: form.note.trim(),
      });

      setFeedback({ type: 'success', message: 'บันทึกรายการสำเร็จแล้ว' });
      setForm((prev) => ({
        ...EMPTY_FORM(),
        type: prev.type,
      }));
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'ไม่สามารถบันทึกข้อมูลได้',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-black">
      <div className="max-w-[920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">บันทึกข้อมูลการเงิน</h1>
            <p className="text-gray-600 dark:text-neutral-400 text-sm">บันทึกทีละรายการให้เร็วขึ้น พร้อมใช้วิเคราะห์ใน Dashboard และ AI</p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 p-1.5">
            {(Object.keys(TYPE_META) as TransactionType[]).map((type) => {
              const active = form.type === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeChange(type)}
                  className={`h-11 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                    active
                      ? 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-700'
                      : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{TYPE_META[type].icon}</span>
                  {TYPE_META[type].title}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6 flex flex-col gap-5 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{typeMeta.title}</h2>
              <p className="text-sm text-gray-500 dark:text-neutral-400">{typeMeta.desc}</p>
            </div>

            {feedback && (
              <div
                className={`rounded-lg border px-3.5 py-2.5 text-sm ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300'
                    : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300'
                }`}
              >
                {feedback.message}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">จำนวนเงิน</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-neutral-500 font-medium">฿</span>
                <input
                  className="block w-full rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white pl-8 pr-3 h-11 placeholder-gray-400 dark:placeholder-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="0.00"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, amount: String(amount) }))}
                    className="h-8 rounded-full border border-gray-300 dark:border-neutral-700 px-3 text-xs font-medium text-gray-600 dark:text-neutral-300 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                  >
                    ฿{amount.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">หมวดหมู่</label>
                <select
                  className="block w-full rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white h-11 px-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                >
                  <option value="" disabled>เลือกหมวดหมู่</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">วันที่</label>
                <input
                  className="block w-full rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white h-11 px-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">บันทึกช่วยจำ (ไม่บังคับ)</label>
              <textarea
                className="block w-full rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white p-3 resize-none h-24 placeholder-gray-400 dark:placeholder-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="รายละเอียดเพิ่มเติม..."
                value={form.note}
                maxLength={500}
                onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
              />
              <p className="text-xs text-gray-500 dark:text-neutral-500 text-right">{form.note.length}/500</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="h-12 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกรายการ'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DataEntry;
