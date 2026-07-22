import React from 'react';
import { ServeMateLogo } from './ServeMateLogo';
import { Heart, Shield, Lock, ExternalLink, Mail, MapPin } from 'lucide-react';

export const Footer = ({ setActiveTab }) => {
  return (
    <footer className="w-full bg-[#080B11] border-t border-white/10 pt-16 pb-12 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* Brand Story & Mission */}
        <div className="md:col-span-1 space-y-4">
          <ServeMateLogo size="md" />
          <p className="text-xs text-slate-400 leading-relaxed">
            ServeMate by Resence is an AI-powered, community-driven transparency platform enabling student micro-donations to verified NGOs with proof-based accountability.
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Shield className="w-4 h-4" />
            <span>100% Auditable Proof Loop</span>
          </div>
        </div>

        {/* Quick Platform Links */}
        <div>
          <h4 className="font-heading font-bold text-white text-sm mb-4">Navigation</h4>
          <ul className="space-y-2.5 text-xs">
            <li><button onClick={() => setActiveTab('home')} className="hover:text-emerald-400 transition-colors">Home</button></li>
            <li><button onClick={() => setActiveTab('causes')} className="hover:text-emerald-400 transition-colors">Social Causes</button></li>
            <li><button onClick={() => setActiveTab('communities')} className="hover:text-emerald-400 transition-colors">Campus Communities</button></li>
            <li><button onClick={() => setActiveTab('impact')} className="hover:text-emerald-400 transition-colors">Proof Ledger</button></li>
            <li><button onClick={() => setActiveTab('leaderboard')} className="hover:text-emerald-400 transition-colors">National Leaderboard</button></li>
          </ul>
        </div>

        {/* Transparency & SLA Principles */}
        <div>
          <h4 className="font-heading font-bold text-white text-sm mb-4">Trust & Ethics</h4>
          <ul className="space-y-2.5 text-xs">
            <li className="flex items-center gap-2 text-slate-300">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>95% Direct NGO Escrow</span>
            </li>
            <li className="flex items-center gap-2 text-slate-300">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>NITI Aayog Darpan Verified</span>
            </li>
            <li className="flex items-center gap-2 text-slate-300">
              <Heart className="w-3.5 h-3.5 text-amber-400" />
              <span>72-Hour SLA Proof Guarantee</span>
            </li>
            <li><button onClick={() => setActiveTab('about')} className="hover:text-emerald-400 transition-colors">Parent Brand: Resence.in</button></li>
          </ul>
        </div>

        {/* Contact & Campus Info */}
        <div className="space-y-3">
          <h4 className="font-heading font-bold text-white text-sm mb-4">Incubation & Contact</h4>
          <div className="flex items-start gap-2 text-xs">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>GL Bajaj Institute of Management & IT, Greater Noida, UP, India</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
            <a href="mailto:info@resence.in" className="hover:underline text-slate-200">info@resence.in</a>
          </div>
          <div className="pt-2">
            <a 
              href="https://resence.in" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:underline"
            >
              <span>Visit Parent Brand (resence.in)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

      </div>

      {/* Copyright Bar */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
        <div>
          © 2026 ServeMate by Resence. Built by Piyush Singh. All rights reserved.
        </div>
        <div className="flex items-center gap-4 mt-3 sm:mt-0">
          <span>Small Contributions. Real Impact.</span>
        </div>
      </div>
    </footer>
  );
};
