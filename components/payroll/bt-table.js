'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, Users } from 'lucide-react';

export default function BtTable({ rows = [] }) {
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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-blue transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search BT name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-brand-card/50 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-white/20 input-focus-glow transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 bg-brand-blue/10 border border-brand-blue/20 px-4 py-2 rounded-2xl">
          <Users size={16} className="text-brand-cyan shadow-[0_0_10px_rgba(0,210,255,0.5)]" />
          <span className="text-xs font-bold text-white/70 tracking-tight">
            <span className="text-brand-cyan">{filteredRows.length}</span> BTs PROCESSED
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-panel rounded-[2rem] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-white/[0.02] text-[10px] uppercase text-white/40 tracking-[0.2em] border-b border-white/5">
            <tr>
              <th className="p-6 font-black">BT Name</th>
              <th className="p-6 text-right font-black">Regular Pay</th>
              <th className="p-6 text-right font-black">Castback</th>
              <th className="p-6 text-right font-black">Insurance</th>
              <th className="p-6 text-right font-black">Net Pay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredRows.map((row, i) => (
              <React.Fragment key={i}>
                <tr
                  className="hover:bg-brand-blue/[0.03] cursor-pointer transition-colors group"
                  onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                >
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-base group-hover:text-brand-cyan transition-colors">{row.staff}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-md border font-black tracking-tighter ${row.isFullTime ? 'bg-brand-blue/10 border-brand-blue/20 text-brand-blue' : 'bg-white/5 border-white/10 text-white/40'}`}>
                        {row.isFullTime ? 'FT' : 'PT'}
                      </span>
                      {expandedRow === i ? <ChevronUp size={14} className="text-brand-blue" /> : <ChevronDown size={14} className="opacity-10 group-hover:opacity-40" />}
                    </div>
                  </td>
                  <td className="p-6 text-right text-white/60 font-medium">
                    ${row.regularPay}
                    <span className="block text-[10px] opacity-40">{row.breakdown?.regularHours || '0.00'}h</span>
                  </td>
                  <td className="p-6 text-right text-brand-cyan font-bold">
                    ${row.castbackPay || '0.00'}
                    <span className="block text-[10px] opacity-40 font-normal">{row.breakdown?.castbackHours || '0.00'}h</span>
                  </td>
                  <td className="p-6 text-right text-red-400/80 font-medium">-${row.insuranceDeduction}</td>
                  <td className="p-6 text-right">
                    <span className="text-xl font-black tracking-tighter text-gradient leading-none">
                      ${row.total}
                    </span>
                  </td>
                </tr>
                
                {expandedRow === i && (
                  <tr className="bg-brand-blue/[0.02] animate-in slide-in-from-top-2 duration-300">
                    <td colSpan="5" className="p-8 border-y border-white/5">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <StatCard label="Regular Work" val={`${row.breakdown?.regularHours || '0.00'}h`} sub={`$${row.regularPay}`} color="text-brand-blue" />
                        <StatCard label="Castback Adj" val={`${row.breakdown?.castbackHours || '0.00'}h`} sub={`$${row.castbackPay}`} color="text-brand-cyan" />
                        <StatCard label="Total Sessions" val={`${row.breakdown?.totalHours || '0.00'}h`} sub={`${row.breakdown?.appointmentCount || 0} Appointments`} color="text-emerald-400" />
                        <StatCard label="Insurance" val={`-$${row.insuranceDeduction}`} sub={`Rate: $${row.hourlyRate}/hr`} color="text-red-400" />
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
      <div className={`text-2xl font-black tracking-tighter ${color}`}>{val}</div>
      <div className="text-[11px] text-white/40 font-medium mt-1">{sub}</div>
    </div>
  );
}