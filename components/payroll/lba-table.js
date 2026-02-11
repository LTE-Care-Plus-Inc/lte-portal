'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, Users } from 'lucide-react';

export default function LbaTable({ rows = [] }) {
  const [expandedRow, setExpandedRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRows = rows.filter(row =>
    row.staff.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Search & Stats Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between px-2">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-pink transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search LBA name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-brand-card/50 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:border-brand-pink/50 focus:ring-4 focus:ring-brand-pink/10 transition-all outline-none"
          />
        </div>
        
        <div className="flex items-center gap-2 bg-brand-pink/10 border border-brand-pink/20 px-4 py-2 rounded-2xl">
          <Users size={16} className="text-brand-pink" />
          <span className="text-xs font-bold text-white/70 tracking-tight">
            <span className="text-brand-pink">{filteredRows.length}</span> RECORDS FOUND
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-panel rounded-[2rem] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-white/[0.02] text-[10px] uppercase text-white/40 tracking-[0.2em] border-b border-white/5">
            <tr>
              <th className="p-6 font-black">LBA Name</th>
              <th className="p-6 text-right font-black">Billable</th>
              <th className="p-6 text-right font-black">Overtime</th>
              <th className="p-6 text-right font-black text-brand-pink/80">Castback</th>
              <th className="p-6 text-right font-black">Insurance</th>
              <th className="p-6 text-right font-black">Net Pay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredRows.map((row, i) => (
              <React.Fragment key={i}>
                <tr
                  className="hover:bg-brand-pink/[0.03] cursor-pointer transition-colors group"
                  onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                >
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-base group-hover:text-brand-pink transition-colors">{row.staff}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-md border border-white/10 text-white/40 font-black tracking-tighter">
                        {row.isFullTime ? 'FT' : 'PT'}
                      </span>
                      {expandedRow === i ? <ChevronUp size={14} className="text-brand-pink" /> : <ChevronDown size={14} className="opacity-10 group-hover:opacity-40" />}
                    </div>
                  </td>
                  <td className="p-6 text-right text-white/60 font-medium">${row.billablePay}</td>
                  <td className="p-6 text-right text-amber-400 font-bold leading-tight">
                    ${row.overtimePay}
                    <span className="block text-[10px] opacity-40 font-normal">{row.breakdown.supervision.otAmount}h</span>
                  </td>
                  <td className="p-6 text-right text-brand-pink font-bold">${row.castbackPay}</td>
                  <td className="p-6 text-right text-red-400/80 font-medium">-${row.insuranceDeduction}</td>
                  <td className="p-6 text-right">
                    <span className="text-xl font-black tracking-tighter text-gradient leading-none">
                      ${row.total}
                    </span>
                  </td>
                </tr>
                
                {expandedRow === i && (
                  <tr className="bg-brand-pink/[0.02] animate-in zoom-in-95 duration-300">
                    <td colSpan="6" className="p-8 border-y border-white/5">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
                        <StatCard label="Supervision" val={`$${row.breakdown.supervision.pay}`} sub={`${row.breakdown.supervision.hours}h`} color="text-brand-blue" />
                        <StatCard label="Assessment" val={`$${row.breakdown.assessment.pay}`} sub={`${row.breakdown.assessment.hours}h`} color="text-emerald-400" />
                        <StatCard label="Parent Trng" val={`$${row.breakdown.parentTraining.pay}`} sub={`${row.breakdown.parentTraining.hours}h`} color="text-purple-400" />
                        <StatCard label="Castback" val={`$${row.castbackPay}`} sub={`${row.breakdown.castback.details.supHours}s | ${row.breakdown.castback.details.ptHours}p`} color="text-brand-pink" />
                        <StatCard label="Non-Bill" val={`$${row.breakdown.nonBillable.pay}`} sub={`${row.breakdown.nonBillable.hours}h`} color="text-orange-400" />
                        <StatCard label="Insurance" val={`-$${row.insuranceDeduction}`} sub="Deduction" color="text-red-400" />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, val, sub, color }) {
  return (
    <div className="bg-white/[0.03] border border-white/5 p-5 rounded-2xl">
      <div className="text-[10px] uppercase font-black tracking-[0.1em] text-white/20 mb-1">{label}</div>
      <div className={`text-xl font-black tracking-tighter ${color}`}>{val}</div>
      <div className="text-[11px] text-white/40 font-medium mt-1 leading-none">{sub}</div>
    </div>
  );
}