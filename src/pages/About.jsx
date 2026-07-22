import React from 'react';
import { ShieldCheck, Heart, Users, Sparkles, ExternalLink, Award } from 'lucide-react';

export const About = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-12 space-y-12">
      
      {/* Title */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mx-auto">
          <Sparkles className="w-3.5 h-3.5" />
          Parent Brand: Resence.in
        </div>
        <h1 className="text-4xl sm:text-5xl font-heading font-extrabold text-white leading-tight">
          About <span className="text-emerald-400">ServeMate</span>
        </h1>
        <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Building India's digital trust infrastructure for student micro-donations and proof-based social accountability.
        </p>
      </div>

      {/* Core Principles Glass Box */}
      <div className="glass-panel p-8 sm:p-10 rounded-3xl space-y-6 text-sm text-slate-300 leading-relaxed">
        
        <h3 className="text-xl font-heading font-extrabold text-white border-b border-white/10 pb-3">
          Our Core Mission
        </h3>

        <p>
          ServeMate is a community-powered social impact platform built under the parent brand <strong>Resence</strong> (<a href="https://resence.in" target="_blank" rel="noreferrer" className="text-cyan-400 font-bold hover:underline inline-flex items-center gap-0.5">resence.in <ExternalLink className="w-3 h-3" /></a>).
        </p>

        <p>
          We believe giving should not be a silent, opaque event. By connecting **Verified NGOs, Student Communities, and Gamified Levels**, we create a trusted social layer where young people can pool micro-contributions starting at ₹10, track real-world impact through live video proof, and get recognized for their consistency.
        </p>

        {/* 4 Stage Flow Visual Diagram */}
        <div className="pt-6 border-t border-white/10 space-y-4">
          <h4 className="font-heading font-extrabold text-white text-base">The Core Transparency Flow</h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 space-y-1">
              <div className="text-2xl">💳</div>
              <div className="font-bold text-white">1. Micro-Give</div>
              <div className="text-[10px] text-slate-400">₹10+ via 0% MDR UPI</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 space-y-1">
              <div className="text-2xl">🤝</div>
              <div className="font-bold text-cyan-400">2. Campus Pool</div>
              <div className="text-[10px] text-slate-400">GL Bajaj AI Club</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 space-y-1">
              <div className="text-2xl">🏢</div>
              <div className="font-bold text-amber-400">3. Field Action</div>
              <div className="text-[10px] text-slate-400">NGO Volunteer</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 space-y-1">
              <div className="text-2xl">🎥</div>
              <div className="font-bold text-emerald-400">4. Video Proof</div>
              <div className="text-[10px] text-slate-400">In-App Live Camera</div>
            </div>
          </div>
        </div>

      </div>

      {/* Incubation & Founder Info */}
      <div className="glass-panel p-8 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
            Founder & Incubator Alignment
          </span>
          <h4 className="font-heading font-extrabold text-white text-lg">Piyush Singh</h4>
          <p className="text-xs text-slate-400">GL Bajaj Institute of Management & IT • Greater Noida, UP</p>
        </div>
        <a
          href="https://www.linkedin.com/in/piyush-singh2007"
          target="_blank"
          rel="noreferrer"
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 shrink-0"
        >
          <span>Connect on LinkedIn</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

    </div>
  );
};
