
import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, INVEST_TYPES } from '../constants';

interface DataEntryProps {
  onAdd: (t: Transaction) => void;
}

const DataEntry: React.FC<DataEntryProps> = ({ onAdd }) => {
  const [incomeData, setIncomeData] = useState({
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  const [expenseData, setExpenseData] = useState({
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  const [investData, setInvestData] = useState({
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  const handleSubmit = (type: TransactionType, data: any) => {
    if (!data.amount || !data.category) {
      alert("Please fill in amount and category");
      return;
    }

    onAdd({
      id: Math.random().toString(36).substr(2, 9),
      type,
      amount: parseFloat(data.amount),
      category: data.category,
      date: data.date,
      note: data.note
    });

    // Reset only the specific form
    const emptyData = {
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      note: ''
    };

    if (type === 'income') {
      setIncomeData(emptyData);
    } else if (type === 'expense') {
      setExpenseData(emptyData);
    } else if (type === 'invest') {
      setInvestData(emptyData);
    }

    alert("Data saved successfully!");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">บันทึกข้อมูลการเงิน</h1>
          <p className="text-gray-600 dark:text-neutral-400 text-sm font-normal">กรอกข้อมูลรายรับ รายจ่าย และการลงทุนเพื่อการวิเคราะห์ที่แม่นยำ</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8 items-start">
          {/* Income Form */}
          <EntryBox 
            title="รายรับ" 
            subTitle="(Income)" 
            icon="trending_up" 
            color="green" 
            btnText="เพิ่มรายรับ"
            categories={INCOME_CATEGORIES}
            onSave={() => handleSubmit('income', incomeData)}
            formData={incomeData}
            setFormData={setIncomeData}
          />

          {/* Expense Form */}
          <EntryBox 
            title="รายจ่าย" 
            subTitle="(Expenses)" 
            icon="trending_down" 
            color="red" 
            btnText="เพิ่มรายจ่าย"
            categories={EXPENSE_CATEGORIES}
            onSave={() => handleSubmit('expense', expenseData)}
            formData={expenseData}
            setFormData={setExpenseData}
          />

          {/* Investment Form */}
          <EntryBox 
            title="การลงทุน" 
            subTitle="(Invest)" 
            icon="monitoring" 
            color="blue" 
            btnText="บันทึกการลงทุน"
            categories={INVEST_TYPES}
            onSave={() => handleSubmit('invest', investData)}
            formData={investData}
            setFormData={setInvestData}
          />
        </div>

        <div className="sticky bottom-4 z-40 mt-4 flex justify-center w-full">
          <button 
            onClick={() => {
              if (incomeData.amount && incomeData.category) handleSubmit('income', incomeData);
              if (expenseData.amount && expenseData.category) handleSubmit('expense', expenseData);
              if (investData.amount && investData.category) handleSubmit('invest', investData);
            }}
            className="bg-emerald-600 dark:bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-700 text-white rounded-lg h-12 min-w-[280px] px-8 text-base font-bold flex items-center justify-center gap-3 transition-all"
          >
            <span className="material-symbols-outlined">save</span>
            บันทึกทั้งหมด
          </button>
        </div>
      </div>
    </div>
    </div>
  );
};

interface EntryBoxProps {
  title: string;
  subTitle: string;
  icon: string;
  color: string;
  btnText: string;
  categories: string[];
  formData: any;
  setFormData: any;
  onSave: () => void;
}

const EntryBox: React.FC<EntryBoxProps> = ({ title, subTitle, icon, color, btnText, categories, formData, setFormData, onSave }) => {
  const colorStyles: any = {
    green: 'text-emerald-600 dark:text-emerald-500',
    red: 'text-red-600 dark:text-red-500',
    blue: 'text-blue-600 dark:text-blue-500'
  };

  const buttonStyles: any = {
    green: 'border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
    red: 'border-red-600 dark:border-red-500 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10',
    blue: 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10'
  };

  return (
    <div className="group bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-6 flex flex-col gap-6 transition-all">
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-neutral-800 pb-4">
        <div className={`p-2 rounded-lg text-gray-300 dark:text-neutral-700 ${colorStyles[color]}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {title} <span className="text-sm font-medium text-gray-500 dark:text-neutral-500 ml-1">{subTitle}</span>
        </h3>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">จำนวนเงิน (Amount)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-neutral-500 font-medium">฿</span>
            <input 
              className="block w-full rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white pl-8 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 h-10 placeholder-gray-400 dark:placeholder-neutral-600" 
              placeholder="0.00" 
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">หมวดหมู่ (Category)</label>
          <select 
            className="block w-full rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white h-10 px-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            <option value="" disabled className="bg-white dark:bg-neutral-900">เลือกหมวดหมู่</option>
            {categories.map(c => <option key={c} value={c} className="bg-white dark:bg-neutral-900">{c}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">วันที่ (Date)</label>
          <input 
            className="block w-full rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white h-10 px-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">บันทึกช่วยจำ (Note)</label>
          <textarea 
            className="block w-full rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white p-3 resize-none h-20 placeholder-gray-400 dark:placeholder-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
            placeholder="รายละเอียดเพิ่มเติม..."
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          ></textarea>
        </div>
      </div>
      
      <button 
        onClick={onSave}
        className={`mt-auto flex items-center justify-center w-full py-2.5 px-4 rounded-lg border border-dashed text-sm font-semibold transition-all gap-2 ${buttonStyles[color]}`}
      >
        <span className="material-symbols-outlined text-[18px]">add_circle</span>
        {btnText}
      </button>
    </div>
  );
};

export default DataEntry;
