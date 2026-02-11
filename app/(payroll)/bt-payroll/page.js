'use client';

import React, { useState, useEffect } from 'react';
import { runPayrollAction, getPayrollDatesAction } from '@/lib/payroll-actions';
import BtTable from '@/components/payroll/bt-table';

export default function BtPayrollPage() {
  const [results, setResults] = useState(null);
  const [dates, setDates] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getPayrollDatesAction().then(setDates);
  }, []);

  const onUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!selectedPeriod) {
      alert("Please select a Payroll Period before uploading the CSV.");
      e.target.value = null;
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const res = await runPayrollAction(event.target.result, 'BT', selectedPeriod);
        setResults(res);
      } catch (err) {
        alert("Error processing BT payroll.");
      } finally {
        setIsLoading(false);
        e.target.value = null;
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-8 font-sans">
      <header className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-gradient leading-none">
            BT Payroll
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
              Operations / Payroll
            </p>
            {isLoading && (
              <span className="w-1 h-1 rounded-full bg-brand-blue animate-ping" />
            )}
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <select 
            onChange={(e) => setSelectedPeriod(dates[e.target.value])}
            className="bg-brand-card border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-white/70 focus:outline-none focus:border-brand-blue/50 transition-all cursor-pointer appearance-none"
          >
            <option value="" className="bg-brand-dark">Select Period</option>
            {dates.map((d, i) => (
              <option key={i} value={i} className="bg-brand-dark">{d.label}</option>
            ))}
          </select>

          <label className={`glow-button px-8 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer ${isLoading ? 'opacity-50' : ''}`}>
            {isLoading ? 'Processing...' : 'Upload BT CSV'}
            <input type="file" className="hidden" onChange={onUpload} accept=".csv" disabled={isLoading} />
          </label>
        </div>
      </header>

      {results ? (
        <BtTable rows={results.rows} />
      ) : (
        <div className="h-64 glass-panel rounded-[2rem] flex flex-col items-center justify-center gap-4 text-white/10">
          <div className="w-12 h-12 border border-white/5 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-brand-blue rounded-full animate-pulse shadow-[0_0_10px_#3B82F6]" />
          </div>
          <span className="uppercase tracking-[0.4em] font-black text-[10px]">
            Waiting for BT CSV Upload
          </span>
        </div>
      )}
    </div>
  );
}