import React, { useState } from 'react';
import { BookOpen, Globe, Info } from 'lucide-react';

export default function CompanyOverview({ stockDetails }) {
  const [expanded, setExpanded] = useState(false);

  const summary = stockDetails?.longBusinessSummary ?? 'A high-performance market leader delivering core technology frameworks, enterprise SaaS architectures, and cloud optimization products worldwide.';
  const sector = stockDetails?.sector ?? 'Technology';
  const industry = stockDetails?.industry ?? 'Software - Applications';
  const beta = stockDetails?.beta ?? 1.14;
  const marketCap = stockDetails?.marketCap ?? 15200000000000;
  const employees = stockDetails?.fullTimeEmployees ?? 0;
  const website = stockDetails?.website ?? 'https://www.example.com';

  return (
    <div className="bg-[#101827] border border-white/[0.06] rounded-xl p-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all hover:border-[#00d4ff]/20">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="text-[#00d4ff]" size={18} />
        <h3 className="font-sans font-bold text-[#dbe4ff] text-sm uppercase tracking-wider">Company Profile Overview</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: Business Summary (7/12 width) */}
        <div className="lg:col-span-7 space-y-4 font-sans text-xs">
          <span className="text-[10px] font-black uppercase text-[#7c8db5] tracking-wider block font-mono">Profile Summary</span>
          <p className={`text-[#7c8db5] leading-relaxed transition-all duration-300 ${expanded ? '' : 'line-clamp-4'}`}>
            {summary}
          </p>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-cyan-400 hover:text-cyan-300 font-bold uppercase text-[9px] cursor-pointer flex items-center gap-0.5 font-mono"
          >
            {expanded ? 'Collapse Summary ▲' : 'Expand Full Profile ▼'}
          </button>
        </div>

        {/* RIGHT: Corporate Attributes (5/12 width) */}
        <div className="lg:col-span-5 bg-[#0b1120] p-6 rounded-lg border border-white/[0.04] font-mono text-xs">
          <span className="text-[10px] font-black uppercase text-[#7c8db5] tracking-wider block border-b border-white/5 pb-2 mb-3">Corporate Specifications</span>
          <table className="w-full">
            <tbody>
              <tr className="border-b border-white/5"><td className="py-2 text-slate-500">Sector Group</td><td className="text-right text-white font-bold">{sector}</td></tr>
              <tr className="border-b border-white/5"><td className="py-2 text-slate-500">Industry Group</td><td className="text-right text-white font-bold">{industry}</td></tr>
              <tr className="border-b border-white/5"><td className="py-2 text-slate-500">Beta Coeff (5Y)</td><td className="text-right text-white font-bold">{Number(beta).toFixed(2)}</td></tr>
              <tr className="border-b border-white/5"><td className="py-2 text-slate-500">Market Capital</td><td className="text-right text-white font-bold">₹{(Number(marketCap) / 1e12).toFixed(2)}T</td></tr>
              <tr className="border-b border-white/5"><td className="py-2 text-slate-500">Headcount Size</td><td className="text-right text-white font-bold">{employees ? Number(employees).toLocaleString() : '—'}</td></tr>
              <tr><td className="py-2 text-slate-500">Corporate Portal</td><td className="text-right text-white font-bold">
                {website ? (
                  <a href={website} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline inline-flex items-center gap-1 font-sans font-bold">
                    <Globe size={11} /> Visit Site
                  </a>
                ) : '—'}
              </td></tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
