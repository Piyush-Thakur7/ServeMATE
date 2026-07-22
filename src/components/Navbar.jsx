import React, { useState } from 'react';
import { ServeMateLogo } from './ServeMateLogo';
import { useAuth } from '../context/AuthContext';
import { 
  Heart, 
  Users, 
  Video, 
  Trophy, 
  Sparkles, 
  User, 
  Menu, 
  X, 
  ShieldCheck 
} from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab, openAIAdvisor }) => {
  const { user, switchRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home', icon: Sparkles },
    { id: 'causes', label: 'Causes', icon: Heart },
    { id: 'communities', label: 'Communities', icon: Users },
    { id: 'impact', label: 'Impact Center', icon: Video },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full px-4 lg:px-8 py-3 bg-slate-950 border-b border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Transparent Brand Logo */}
        <div onClick={() => handleNavClick('home')}>
          <ServeMateLogo size="md" />
        </div>

        {/* Desktop Navigation Links - Explicit Dark Pill Styling */}
        <nav className="hidden md:flex items-center gap-1.5 p-1.5 rounded-full bg-slate-900 border border-white/10">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  isActive ? 'nav-pill-active' : 'nav-pill-inactive'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-emerald-400'}`} />
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          
          {/* AI Advisor Trigger Button */}
          <button
            onClick={openAIAdvisor}
            style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#67E8F9', borderColor: 'rgba(6, 182, 212, 0.4)' }}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-extrabold transition-all hover:scale-105"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Advisor</span>
          </button>

          {/* Role Tester Dropdown - High Contrast Dark Styling */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              style={{ backgroundColor: '#0F172A', color: '#F8FAFC', borderColor: 'rgba(16, 185, 129, 0.3)' }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-extrabold shadow-md"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="capitalize">{user?.role || 'donor'} View</span>
            </button>

            {roleDropdownOpen && (
              <div 
                style={{ backgroundColor: '#020617', color: '#F8FAFC', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                className="absolute right-0 mt-2 w-52 border rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1"
              >
                <div className="px-3 py-1.5 text-[10px] font-black text-emerald-400 uppercase tracking-wider border-b border-white/10 mb-1">
                  Test Role Perspectives
                </div>
                
                <button
                  onClick={() => { switchRole('donor'); setRoleDropdownOpen(false); setActiveTab('dashboard-donor'); }}
                  style={{ backgroundColor: user?.role === 'donor' ? '#10B981' : 'transparent', color: user?.role === 'donor' ? '#020617' : '#F8FAFC' }}
                  className="w-full text-left px-3 py-2.5 rounded-xl font-bold flex items-center justify-between transition-colors"
                >
                  <span>👤 Student Donor</span>
                  {user?.role === 'donor' && <span className="w-2 h-2 rounded-full bg-slate-950"></span>}
                </button>

                <button
                  onClick={() => { switchRole('leader'); setRoleDropdownOpen(false); setActiveTab('dashboard-community'); }}
                  style={{ backgroundColor: user?.role === 'leader' ? '#06B6D4' : 'transparent', color: user?.role === 'leader' ? '#020617' : '#F8FAFC' }}
                  className="w-full text-left px-3 py-2.5 rounded-xl font-bold flex items-center justify-between transition-colors"
                >
                  <span>👥 Community Leader</span>
                  {user?.role === 'leader' && <span className="w-2 h-2 rounded-full bg-slate-950"></span>}
                </button>

                <button
                  onClick={() => { switchRole('ngo'); setRoleDropdownOpen(false); setActiveTab('dashboard-ngo'); }}
                  style={{ backgroundColor: user?.role === 'ngo' ? '#F59E0B' : 'transparent', color: user?.role === 'ngo' ? '#020617' : '#F8FAFC' }}
                  className="w-full text-left px-3 py-2.5 rounded-xl font-bold flex items-center justify-between transition-colors"
                >
                  <span>🏢 NGO Partner</span>
                  {user?.role === 'ngo' && <span className="w-2 h-2 rounded-full bg-slate-950"></span>}
                </button>

                <button
                  onClick={() => { switchRole('admin'); setRoleDropdownOpen(false); setActiveTab('dashboard-admin'); }}
                  style={{ backgroundColor: user?.role === 'admin' ? '#A855F7' : 'transparent', color: user?.role === 'admin' ? '#020617' : '#F8FAFC' }}
                  className="w-full text-left px-3 py-2.5 rounded-xl font-bold flex items-center justify-between transition-colors"
                >
                  <span>🛡️ Platform Admin</span>
                  {user?.role === 'admin' && <span className="w-2 h-2 rounded-full bg-slate-950"></span>}
                </button>
              </div>
            )}
          </div>

          {/* User Profile Avatar Pill */}
          <button
            onClick={() => {
              if (user?.role === 'leader') setActiveTab('dashboard-community');
              else if (user?.role === 'ngo') setActiveTab('dashboard-ngo');
              else if (user?.role === 'admin') setActiveTab('dashboard-admin');
              else setActiveTab('dashboard-donor');
            }}
            style={{ backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.1)' }}
            className="flex items-center gap-2 pl-2 pr-3.5 py-1.5 rounded-full border hover:border-emerald-400 transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-black text-slate-950">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'PS'}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-white leading-none">{user?.name || 'Piyush'}</span>
              <span className="text-[10px] text-emerald-400 font-extrabold leading-tight">Lvl {user?.level || 1} • {user?.xp || 0} XP</span>
            </div>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ color: '#F8FAFC' }}
            className="md:hidden p-2"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

        </div>
      </div>

      {/* Mobile Nav Menu */}
      {mobileMenuOpen && (
        <div style={{ backgroundColor: '#020617', borderColor: 'rgba(255, 255, 255, 0.1)' }} className="md:hidden mt-3 p-4 border rounded-2xl flex flex-col gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold ${
                  isActive ? 'nav-pill-active' : 'nav-pill-inactive'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
