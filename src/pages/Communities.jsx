import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Users, Search, Award, TrendingUp, PlusCircle, CheckCircle2 } from 'lucide-react';

export const Communities = () => {
  const { communities } = useData();
  const [searchCode, setSearchCode] = useState('');
  const [joinedMsg, setJoinedMsg] = useState(null);

  const handleJoinByCode = (e) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    const matched = communities.find((c) => c.code.toLowerCase() === searchCode.toLowerCase());
    if (matched) {
      setJoinedMsg(`Successfully joined ${matched.name} (${matched.code})!`);
      setSearchCode('');
    } else {
      setJoinedMsg(`No community found for code "${searchCode}". Try "GLBAJAJ".`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
          <Users className="w-3.5 h-3.5" />
          The Big Differentiator
        </div>
        <h1 className="text-4xl font-heading font-extrabold text-white">
          Student & Campus <span className="text-cyan-400">Communities</span>
        </h1>
        <p className="text-xs text-slate-400 max-w-xl">
          Pool micro-donations with your college club or class group. Rank nationally on participation and genuine impact—never on money flexing.
        </p>
      </div>

      {/* Join By Code Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
        <h3 className="font-heading font-extrabold text-white text-lg">
          Join a Campus Community by Code
        </h3>
        <form onSubmit={handleJoinByCode} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            placeholder="Enter Code (e.g. GLBAJAJ, BCA2029)"
            className="flex-1 px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 uppercase font-mono font-bold"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-heading font-extrabold text-xs shrink-0"
          >
            Join Community
          </button>
        </form>
        {joinedMsg && (
          <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            {joinedMsg}
          </p>
        )}
      </div>

      {/* Communities Directory Grid */}
      <div className="space-y-4">
        <h3 className="font-heading font-extrabold text-white text-xl">
          Active Student Communities
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {communities.map((comm) => (
            <div key={comm.id} className="glass-panel glass-panel-hover p-6 rounded-3xl space-y-4 flex flex-col justify-between">
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold">
                    Code: {comm.code}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-heading font-extrabold">
                    Rank #{comm.rank}
                  </span>
                </div>

                <div>
                  <h4 className="font-heading font-extrabold text-white text-lg">{comm.name}</h4>
                  <p className="text-xs text-slate-400">{comm.college}</p>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {comm.description}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-white/5">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-white/5">
                    <span className="text-slate-500 block text-[10px]">Members:</span>
                    <span className="font-bold text-slate-200">{comm.membersCount} Students</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-white/5">
                    <span className="text-slate-500 block text-[10px]">Total Pooled:</span>
                    <span className="font-bold text-emerald-400">₹{comm.totalRaised}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 text-[11px]">Leader: <strong className="text-slate-200">{comm.leader}</strong></span>
                  <span className="text-cyan-400 font-bold text-[11px]">Score: {comm.impactScore} pts</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
