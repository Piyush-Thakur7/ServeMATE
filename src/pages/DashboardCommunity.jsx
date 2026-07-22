import React from 'react';
import { useData } from '../context/DataContext';
import { Users, Trophy, TrendingUp, ShieldCheck, Share2 } from 'lucide-react';

export const DashboardCommunity = () => {
  const { communities, donations } = useData();
  const myCommunity = communities[0]; // GL Bajaj AI Club

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-10">
      
      {/* Community Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold mb-2">
              <Users className="w-3.5 h-3.5" />
              Community Leader Workspace
            </div>
            <h1 className="text-3xl font-heading font-extrabold text-white">{myCommunity.name}</h1>
            <p className="text-xs text-slate-400 mt-1">
              {myCommunity.college} • Invite Code: <strong className="text-cyan-400 font-mono">{myCommunity.code}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-heading font-extrabold text-sm">
              National Rank #{myCommunity.rank}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5">
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5">
            <span className="text-xs text-slate-500 block">Total Campus Members:</span>
            <span className="text-2xl font-heading font-extrabold text-white">{myCommunity.membersCount} Students</span>
          </div>
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5">
            <span className="text-xs text-slate-500 block">Total Micro-Pooled:</span>
            <span className="text-2xl font-heading font-extrabold text-emerald-400">₹{myCommunity.totalRaised}</span>
          </div>
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5">
            <span className="text-xs text-slate-500 block">Community Impact Score:</span>
            <span className="text-2xl font-heading font-extrabold text-cyan-400">{myCommunity.impactScore} pts</span>
          </div>
        </div>
      </div>

      {/* Roster & Recent Pooled Micro-Gives */}
      <div className="space-y-4">
        <h3 className="font-heading font-extrabold text-white text-xl">
          Recent Pooled Member Contributions
        </h3>

        <div className="glass-panel rounded-3xl overflow-hidden">
          <div className="p-4 bg-slate-950/60 border-b border-white/10 grid grid-cols-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Student Member</span>
            <span>Campaign</span>
            <span>Micro-Given</span>
            <span className="text-right">Date</span>
          </div>

          <div className="divide-y divide-white/5 text-xs">
            {donations.map((tx) => (
              <div key={tx.id} className="p-4 grid grid-cols-4 items-center hover:bg-white/5 transition-colors">
                <div className="font-bold text-white">Piyush Singh</div>
                <div className="text-slate-300 truncate">{tx.campaignTitle}</div>
                <div className="font-bold text-emerald-400">₹{tx.amount}.00</div>
                <div className="text-right text-slate-400">{tx.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
