import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Trophy, Users, User, Award, Flame } from 'lucide-react';

export const Leaderboards = () => {
  const { communities } = useData();
  const [activeTab, setActiveTab] = useState('communities'); // communities | donors

  const mockDonors = [
    { rank: 1, name: 'Piyush Singh', college: 'GL Bajaj Institute', score: 450, level: 2, streak: '3 Weeks', icon: '👑' },
    { rank: 2, name: 'Aarav Sharma', college: 'GL Bajaj Institute', score: 380, level: 2, streak: '2 Weeks', icon: '🥈' },
    { rank: 3, name: 'Neha Gupta', college: 'Noida Student Net', score: 310, level: 1, streak: '4 Weeks', icon: '🥉' },
    { rank: 4, name: 'Rohan Verma', college: 'Sharda University', score: 260, level: 1, streak: '1 Week', icon: '✨' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mx-auto">
          <Trophy className="w-3.5 h-3.5" />
          National Participation Rankings
        </div>
        <h1 className="text-4xl font-heading font-extrabold text-white">
          National Impact <span className="text-amber-400">Leaderboards</span>
        </h1>
        <p className="text-xs text-slate-400 max-w-lg mx-auto">
          Recognizing campus communities and student changemakers ranked strictly by participation consistency, volunteer impact, and SLA proof verification.
        </p>
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-white/10 bg-slate-900/60 p-1.5 rounded-2xl max-w-md mx-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('communities')}
          className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
            activeTab === 'communities'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Campus Communities
        </button>
        <button
          onClick={() => setActiveTab('donors')}
          className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
            activeTab === 'donors'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          Individual Donors
        </button>
      </div>

      {/* Leaderboard Ranking Table */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 bg-slate-950/60 border-b border-white/10 flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span>Rank & Entity</span>
          <span>Participation Score</span>
        </div>

        <div className="divide-y divide-white/5">
          {activeTab === 'communities' ? (
            communities.map((c) => (
              <div key={c.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-heading font-extrabold text-sm ${
                    c.rank === 1 ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30' :
                    c.rank === 2 ? 'bg-slate-300 text-slate-950' :
                    c.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    #{c.rank}
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-white text-base">{c.name}</h4>
                    <p className="text-xs text-slate-400">{c.college} • <span className="text-cyan-400 font-mono">Code: {c.code}</span></p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-heading font-extrabold text-emerald-400 text-base">{c.impactScore} pts</div>
                  <div className="text-[10px] text-slate-400">{c.membersCount} Active Members</div>
                </div>
              </div>
            ))
          ) : (
            mockDonors.map((d) => (
              <div key={d.rank} className="p-4 sm:p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-heading font-extrabold text-sm ${
                    d.rank === 1 ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {d.icon}
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-white text-base">{d.name}</h4>
                    <p className="text-xs text-slate-400">{d.college} • <span className="text-amber-400 font-semibold">Lvl {d.level}</span></p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-heading font-extrabold text-amber-400 text-base">{d.score} XP</div>
                  <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                    <Flame className="w-3 h-3 text-amber-400" />
                    <span>{d.streak}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
};
