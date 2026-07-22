import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { SLABadge } from '../components/SLABadge';
import { 
  ShieldCheck, 
  Lock, 
  Clock, 
  FileText, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  MapPin,
  Building2,
  Video,
  DollarSign,
  AlertCircle
} from 'lucide-react';

export const Home = ({ setActiveTab, onSelectCampaign, onSelectProof }) => {
  const { campaigns, proofs } = useData();
  const { user } = useAuth();
  const [calcAmount, setCalcAmount] = useState(20);

  return (
    <div className="space-y-16 pb-20 max-w-7xl mx-auto px-4 lg:px-8 pt-8">
      
      {/* HIGH-TRUST SAAS HERO SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        
        {/* Left Column: Mission & Trust Value Proposition */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            NITI Aayog Darpan Verified NGO Ecosystem
          </div>

          <h1 className="text-4xl sm:text-5xl font-heading font-extrabold text-white tracking-tight leading-[1.15]">
            Institutional-Grade <span className="text-gradient-emerald">Transparency</span> for Micro-Giving.
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
            Every <strong className="text-emerald-400">₹10 student micro-donation</strong> is held in a protected 95% Escrow account and governed by a strict <strong className="text-cyan-400">72-Hour Video Proof SLA</strong> before NGO fund release.
          </p>

          {/* Core Governance Badges */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 text-center">
              <div className="text-xl font-heading font-extrabold text-emerald-400">95%</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Protected Escrow</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 text-center">
              <div className="text-xl font-heading font-extrabold text-cyan-400">72-Hour</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Proof SLA Guarantee</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 text-center">
              <div className="text-xl font-heading font-extrabold text-amber-400">₹0 Fee</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">UPI Student MDR</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => setActiveTab('causes')}
              className="btn-hero-primary px-7 py-4 rounded-2xl font-heading font-black text-xs transition-all hover:scale-105 flex items-center gap-2"
            >
              <span>Explore Verified NGO Causes</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
            <button
              onClick={() => setActiveTab('impact')}
              className="btn-hero-secondary px-7 py-4 rounded-2xl font-heading font-extrabold text-xs transition-all hover:scale-105 flex items-center gap-2"
            >
              <Video className="w-4 h-4 text-cyan-400" />
              <span>Inspect Proof Vault</span>
            </button>
          </div>
        </div>

        {/* Right Column: ESCROW & CALCULATOR MONITOR */}
        <div className="lg:col-span-5">
          <div className="app-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  Live Escrow Ledger Simulator
                </div>
                <div className="text-[11px] text-slate-400">Calculate 95/5 escrow split & proof guarantee</div>
              </div>
              <span className="text-[10px] font-black text-cyan-400 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30">
                Auto-Disbursal
              </span>
            </div>

            {/* Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-300 font-bold">Micro-Give Amount:</span>
                <span className="text-3xl font-heading font-extrabold text-emerald-400">₹{calcAmount}</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="10"
                value={calcAmount}
                onChange={(e) => setCalcAmount(Number(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>₹10 (Student Min)</span>
                <span>₹50</span>
                <span>₹100</span>
                <span>₹200</span>
              </div>
            </div>

            {/* Financial Ledger Breakdown Table */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-3">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Financial Breakdown:</div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-300">Protected Escrow Amount (95%):</span>
                  <span className="text-emerald-400 font-black">₹{(calcAmount * 0.95).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Platform Maintenance Fee (5%):</span>
                  <span className="text-slate-400 font-bold">₹{(calcAmount * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10">
                  <span className="text-slate-300">SLA Proof Deadline:</span>
                  <span className="text-cyan-400 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    72 Hours Post-Target
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectCampaign(campaigns[0])}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-heading font-black text-xs transition-all shadow-lg shadow-emerald-500/20"
            >
              Initiate Micro-Give ₹{calcAmount} (95% Protected)
            </button>
          </div>
        </div>

      </section>

      {/* REAL-TIME ESCROW & DISBURSAL TRANSPARENCY LEDGER */}
      <section className="app-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-2xl font-heading font-extrabold text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-400" />
              Live Escrow & SLA Disbursal Audit Ledger
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Immutable log of micro-donations, escrow locking, and volunteer video verification.
            </p>
          </div>
          <span className="text-[10px] font-black text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 self-start sm:self-auto">
            100% Audit Guarantee
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Campaign & Partner NGO</th>
                <th className="py-3 px-4">Darpan ID</th>
                <th className="py-3 px-4">Fund Raised</th>
                <th className="py-3 px-4">Escrow Status</th>
                <th className="py-3 px-4">72h SLA Clock</th>
                <th className="py-3 px-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-4 font-bold text-white">
                    <div>{c.title}</div>
                    <div className="text-[11px] text-slate-400 font-normal">{c.ngoName}</div>
                  </td>
                  <td className="py-4 px-4 font-mono text-cyan-400">{c.darpanId}</td>
                  <td className="py-4 px-4 text-emerald-400 font-bold">₹{c.raisedAmount.toLocaleString()}</td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                      95% Locked
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <SLABadge hoursLeft={c.slaHoursLeft} status={c.proofStatus} />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => onSelectCampaign(c)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 text-[11px] font-bold transition-all"
                    >
                      Audit Details →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* VERIFIED NGO CAUSES DIRECTORY */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-heading font-extrabold text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-cyan-400" />
              NITI Aayog Verified NGO Causes
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Active campaigns backed by verified partner credentials and 80G tax status.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('causes')}
            className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>View Full Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {campaigns.map((campaign) => {
            const percent = Math.min(100, Math.floor((campaign.raisedAmount / campaign.targetAmount) * 100));
            return (
              <div key={campaign.id} className="app-card overflow-hidden flex flex-col justify-between">
                <div className="relative h-44 w-full overflow-hidden">
                  <img src={campaign.image} alt={campaign.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full bg-slate-950/90 border border-emerald-500/40 text-[10px] font-bold text-emerald-300">
                      Darpan Verified
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <SLABadge hoursLeft={campaign.slaHoursLeft} status={campaign.proofStatus} />
                  </div>
                </div>

                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 text-cyan-400 font-mono">{campaign.darpanId}</span>
                      <span className="text-emerald-400 font-bold">Trust Score: {campaign.trustScore}</span>
                    </div>
                    <h3 className="font-heading font-extrabold text-white text-base leading-snug">
                      {campaign.title}
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-emerald-400">₹{campaign.raisedAmount.toLocaleString()} Raised</span>
                      <span className="text-slate-400">{percent}% of Target</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectCampaign(campaign)}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-heading font-black text-xs transition-all shadow-md"
                  >
                    Micro-Give ₹10 & Track Escrow
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};
