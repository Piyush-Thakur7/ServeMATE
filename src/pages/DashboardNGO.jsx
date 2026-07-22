import React, { useState } from 'react';
import { Building2, ShieldCheck, PlusCircle, Video, MapPin, CheckCircle2, Clock } from 'lucide-react';

export const DashboardNGO = () => {
  const [createdMsg, setCreatedMsg] = useState(null);
  const [proofSubmitted, setProofSubmitted] = useState(false);

  // New Campaign State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Education');
  const [targetAmount, setTargetAmount] = useState(10000);
  const [description, setDescription] = useState('');

  // Proof Submission State
  const [proofTitle, setProofTitle] = useState('');
  const [volunteerName, setVolunteerName] = useState('');
  const [gpsLocation, setGpsLocation] = useState('28.4744° N, 77.5040° E (Greater Noida Sector 4)');

  const handleCreateCampaign = (e) => {
    e.preventDefault();
    if (!title || !description) return;

    setCreatedMsg(`Campaign "${title}" submitted to Admin Verification Queue!`);
    setTitle('');
    setDescription('');
  };

  const handleSubmitProof = (e) => {
    e.preventDefault();
    setProofSubmitted(true);
    setTimeout(() => setProofSubmitted(false), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-10">
      
      {/* NGO Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black text-2xl">
              🏢
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-heading font-extrabold text-white">Pratham Education Foundation</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  NITI Darpan Verified
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Reg No: #DARPAN-UP-2024-88491 • Location: Greater Noida & Delhi NCR</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-white/5">
            <span className="text-slate-500 block text-[10px]">Total Allocated Escrow:</span>
            <span className="text-xl font-heading font-extrabold text-emerald-400">₹11,250.00</span>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-xl border border-white/5">
            <span className="text-slate-500 block text-[10px]">Active Campaigns:</span>
            <span className="text-xl font-heading font-extrabold text-white">2 Campaigns</span>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-xl border border-white/5">
            <span className="text-slate-500 block text-[10px]">Assigned Volunteers:</span>
            <span className="text-xl font-heading font-extrabold text-cyan-400">12 Active Workers</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Create Campaign + Upload Proof */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 1. Create New Campaign Form */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
          <h3 className="font-heading font-extrabold text-white text-lg flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-400" />
            <span>Create Social Impact Campaign</span>
          </h3>

          <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-300 font-bold block mb-1">Campaign Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g. Classroom Stationery Kits for Primary School"
                className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none"
                >
                  <option value="Education">Education</option>
                  <option value="Food">Food Relief</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Environment">Environment</option>
                  <option value="Animal Welfare">Animal Welfare</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 font-bold block mb-1">Target Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">Impact Description</label>
              <textarea
                required
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the project scope and how micro-donations will be utilized..."
                className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-heading font-extrabold text-xs"
            >
              Submit Campaign for Admin Approval
            </button>
          </form>

          {createdMsg && (
            <p className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {createdMsg}
            </p>
          )}
        </div>

        {/* 2. Mandatory In-App Video Proof Submission */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
          <div className="space-y-1">
            <h3 className="font-heading font-extrabold text-white text-lg flex items-center gap-2">
              <Video className="w-5 h-5 text-cyan-400" />
              <span>In-App Live Proof Video Submission</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Volunteers record directly in-app. Auto-stamped with GPS & Timestamp, sent to ServeMate Admin queue.
            </p>
          </div>

          <form onSubmit={handleSubmitProof} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-300 font-bold block mb-1">Select Active Campaign</label>
              <select className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none">
                <option>Classroom Textbook & Stationery Kits (Target: ₹15,000)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">Assigned Field Volunteer Name</label>
              <input
                type="text"
                required
                value={volunteerName}
                onChange={(e) => setVolunteerName(e.target.value)}
                placeholder="Rahul Verma (ID: #V-882)"
                className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none"
              />
            </div>

            {/* In-App Live Camera Record Simulation Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                <Video className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-200">
                Mandatory Live In-App Camera Recording
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                📍 {gpsLocation} | ⏰ {new Date().toISOString().slice(0,10)}
              </p>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold hover:bg-cyan-500/30"
              >
                🔴 Tap to Record Live Field Video (In-App Camera)
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-heading font-extrabold text-xs"
            >
              Submit Live Proof to ServeMate Admin Queue
            </button>
          </form>

          {proofSubmitted && (
            <p className="text-xs text-cyan-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Proof Video uploaded to Supabase Storage & sent to Admin Audit Queue!
            </p>
          )}
        </div>

      </div>

    </div>
  );
};
