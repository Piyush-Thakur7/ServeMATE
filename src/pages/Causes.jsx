import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { SLABadge } from '../components/SLABadge';
import { Heart, ShieldCheck, Search, Filter } from 'lucide-react';

export const Causes = ({ onSelectCampaign }) => {
  const { campaigns } = useData();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Education', 'Food', 'Healthcare', 'Environment', 'Animal Welfare'];

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.ngoName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-4xl font-heading font-extrabold text-white">
          Social Impact <span className="text-emerald-400">Causes</span>
        </h1>
        <p className="text-xs text-slate-400 max-w-xl">
          Browse verified campaigns led by Darpan-checked NGO partners. Give micro-donations starting at ₹10 and track proof.
        </p>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-white/10">
        
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cause or NGO name..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampaigns.map((campaign) => {
          const percent = Math.min(100, Math.floor((campaign.raisedAmount / campaign.targetAmount) * 100));
          return (
            <div key={campaign.id} className="glass-panel glass-panel-hover rounded-3xl overflow-hidden flex flex-col justify-between">
              
              <div className="relative h-48 w-full overflow-hidden">
                <img src={campaign.image} alt={campaign.title} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 rounded-full bg-slate-950/80 border border-white/10 text-[10px] font-bold text-emerald-400">
                    {campaign.category}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <SLABadge hoursLeft={campaign.slaHoursLeft} status={campaign.proofStatus} />
                </div>
              </div>

              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{campaign.ngoName}</span>
                  </div>
                  <h3 className="font-heading font-extrabold text-white text-base leading-snug">
                    {campaign.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {campaign.description}
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-emerald-400">₹{campaign.raisedAmount.toLocaleString()} Raised</span>
                    <span className="text-slate-400">{percent}% of ₹{campaign.targetAmount.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full" style={{ width: `${percent}%` }}></div>
                  </div>
                </div>

                <button
                  onClick={() => onSelectCampaign(campaign)}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-heading font-extrabold text-xs transition-all flex items-center justify-center gap-2"
                >
                  <span>Give ₹10 Micro-Donation</span>
                  <Heart className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
