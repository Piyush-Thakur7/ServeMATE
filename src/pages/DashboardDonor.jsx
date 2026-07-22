import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { 
  User, 
  Award, 
  Heart, 
  TrendingUp, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  FileText, 
  ExternalLink 
} from 'lucide-react';

export const DashboardDonor = ({ openAIAdvisor }) => {
  const { user } = useAuth();
  const { donations } = useData();

  const xpCurrent = user?.xp || 450;
  const xpTarget = 1000;
  const xpPercent = Math.min(100, Math.floor((xpCurrent / xpTarget) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-10">
      
      {/* Header Profile Summary */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center font-heading font-black text-slate-950 text-2xl shadow-xl shadow-emerald-500/20">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'PS'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-heading font-extrabold text-white">{user?.name || 'Piyush Singh'}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                  {user?.levelTitle || 'Active Changemaker'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {user?.college} • Member of <strong className="text-cyan-400">{user?.communityName}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={openAIAdvisor}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center gap-2 hover:scale-105 transition-transform self-stretch sm:self-auto justify-center"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Launch AI Advisor</span>
          </button>
        </div>

        {/* XP Level Progression Bar */}
        <div className="space-y-2 pt-4 border-t border-white/5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-300">Level {user?.level || 1} ➔ Level {(user?.level || 1) + 1} Progression</span>
            <span className="text-emerald-400 font-mono">{xpCurrent} / {xpTarget} XP</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden p-0.5 border border-white/10">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-1000"
              style={{ width: `${xpPercent}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-500">
            {xpTarget - xpCurrent} XP remaining to unlock Level {(user?.level || 1) + 1} Badge & Impact Title
          </p>
        </div>
      </div>

      {/* Badges & Titles Grid */}
      <div className="space-y-4">
        <h3 className="font-heading font-extrabold text-white text-xl flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          <span>Earned Social Badges & Recognition</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {user?.badges?.map((b) => (
            <div key={b.id} className="glass-panel p-4 rounded-2xl flex items-center gap-3">
              <span className="text-3xl">{b.icon}</span>
              <div>
                <h4 className="font-heading font-bold text-white text-sm">{b.name}</h4>
                <span className="text-[10px] text-slate-400">Awarded on {b.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Public Ledger Transactions Table */}
      <div className="space-y-4">
        <h3 className="font-heading font-extrabold text-white text-xl flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-400" />
          <span>My Micro-Give Activity History</span>
        </h3>

        <div className="glass-panel rounded-3xl overflow-hidden">
          <div className="p-4 bg-slate-950/60 border-b border-white/10 grid grid-cols-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="col-span-2">Campaign & Partner NGO</span>
            <span>Micro-Given</span>
            <span>Date</span>
            <span className="text-right">SLA Proof Status</span>
          </div>

          <div className="divide-y divide-white/5 text-xs">
            {donations.map((tx) => (
              <div key={tx.id} className="p-4 grid grid-cols-5 items-center hover:bg-white/5 transition-colors">
                <div className="col-span-2">
                  <h5 className="font-heading font-bold text-white">{tx.campaignTitle}</h5>
                  <span className="text-[10px] text-slate-400">{tx.ngoName}</span>
                </div>
                <div className="font-bold text-emerald-400">
                  ₹{tx.amount}.00
                </div>
                <div className="text-slate-400">
                  {tx.date}
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Video Proof
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
