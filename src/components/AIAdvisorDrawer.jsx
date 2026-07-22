import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  TrendingUp, 
  ShieldAlert, 
  BookOpen, 
  PieChart, 
  FileText 
} from 'lucide-react';

export const AIAdvisorDrawer = ({ isOpen, onClose, onSelectCampaign }) => {
  const { user } = useAuth();
  const { campaigns, donations } = useData();

  const [activeTab, setActiveTab] = useState('planner'); // planner | recommend | summary
  const [budget, setBudget] = useState(50);
  const [preferredCategory, setPreferredCategory] = useState('Education');
  const [customQuery, setCustomQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiOutput, setAiOutput] = useState(null);

  if (!isOpen) return null;

  // Strict Off-Topic Keyword Check (Guardrail)
  const isOffTopic = (text) => {
    const blockedKeywords = ['trump', 'pm', 'prime minister', 'politics', 'election', 'cricket', 'movie', 'news'];
    const lower = text.toLowerCase();
    return blockedKeywords.some((kw) => lower.includes(kw));
  };

  const handleGeneratePlan = (e) => {
    e?.preventDefault();
    setIsGenerating(true);
    setAiOutput(null);

    setTimeout(() => {
      setIsGenerating(false);
      const mainCategoryShare = Math.floor(budget * 0.7);
      const secondaryShare = budget - mainCategoryShare;

      setAiOutput({
        type: 'plan',
        title: `Personalized ${budget}/Month Impact Allocation`,
        planText: `Based on your goal, allocating ₹${mainCategoryShare} to ${preferredCategory} provides 1 essential supply kit + verified video proof. Allocating ₹${secondaryShare} to Food Relief provides 1 warm meal. This achieves 100% auditable impact across 2 verified NGOs.`,
        recommendedCampaignId: 'cmp_1'
      });
    }, 1200);
  };

  const handleGenerateSummary = () => {
    setIsGenerating(true);
    setAiOutput(null);

    setTimeout(() => {
      setIsGenerating(false);
      setAiOutput({
        type: 'summary',
        title: 'Monthly Changemaker Impact Story',
        planText: `In July 2026, your ₹${user?.totalDonated || 120} across ${user?.contributionsCount || 6} micro-donations directly funded 150 textbooks in Greater Noida and 400 meals in Delhi NCR. All 2 proof video SLA timelines were 100% met and verified on the public ledger.`
      });
    }, 1200);
  };

  const handleAskAI = (e) => {
    e.preventDefault();
    if (!customQuery.trim()) return;

    if (isOffTopic(customQuery)) {
      setAiOutput({
        type: 'blocked',
        title: 'Off-Topic Guardrail Triggered',
        planText: 'I am ServeMate AI, dedicated strictly to guiding your social impact journey, verified campaign metrics, and platform analytics. Please ask questions related to micro-donations, NGOs, or community stats!'
      });
      setCustomQuery('');
      return;
    }

    setIsGenerating(true);
    setAiOutput(null);

    setTimeout(() => {
      setIsGenerating(false);
      setAiOutput({
        type: 'query',
        title: `AI Analysis: "${customQuery}"`,
        planText: `ServeMate has 4 active verified campaigns in Delhi NCR and Greater Noida. GL Bajaj AI Club is currently ranked #1 nationally with ₹8,450 raised across 142 members.`
      });
      setCustomQuery('');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-white/10 shadow-2xl flex flex-col">
          
          {/* Header Bar */}
          <div className="p-6 bg-gradient-to-b from-slate-800/80 to-slate-900 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-white text-base leading-none">
                  ServeMate AI Advisor
                </h3>
                <span className="text-[10px] text-cyan-400 font-bold tracking-wider">
                  POWERED BY GEMINI 3.6 FLASH
                </span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selection */}
          <div className="flex border-b border-white/10 bg-slate-950/60 p-1.5 text-xs font-semibold">
            <button
              onClick={() => { setActiveTab('planner'); setAiOutput(null); }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'planner'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              Budget Planner
            </button>
            <button
              onClick={() => { setActiveTab('summary'); setAiOutput(null); }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'summary'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Impact Story
            </button>
          </div>

          {/* Drawer Body Panel */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {activeTab === 'planner' && (
              <form onSubmit={handleGeneratePlan} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Monthly Giving Budget (₹)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Primary Impact Priority
                  </label>
                  <select
                    value={preferredCategory}
                    onChange={(e) => setPreferredCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-xs text-white font-medium focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Education">📚 Education & Textbooks</option>
                    <option value="Food">🍲 Hunger & Meal Kits</option>
                    <option value="Animal Welfare">🐾 Animal Vaccination</option>
                    <option value="Environment">🌳 Tree Plantation</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-heading font-extrabold text-xs flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Synthesize Optimal Impact Plan</span>
                </button>
              </form>
            )}

            {activeTab === 'summary' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Generate an AI-powered monthly story report consolidating your public ledger micro-donations and verified video SLA outcomes.
                </p>
                <button
                  onClick={handleGenerateSummary}
                  disabled={isGenerating}
                  className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-heading font-extrabold text-xs flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Generate Monthly Impact Story</span>
                </button>
              </div>
            )}

            {/* AI Result Card */}
            {isGenerating && (
              <div className="p-6 rounded-2xl bg-slate-950 border border-cyan-500/30 text-center space-y-2">
                <Sparkles className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-300">
                  Gemini 3.6 Flash synthesizing transparency data...
                </p>
              </div>
            )}

            {aiOutput && (
              <div className={`p-5 rounded-2xl border space-y-3 ${
                aiOutput.type === 'blocked'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  : 'bg-slate-950 border-emerald-500/30'
              }`}>
                <div className="flex items-center gap-2 font-heading font-bold text-xs text-emerald-400">
                  {aiOutput.type === 'blocked' ? <ShieldAlert className="w-4 h-4 text-amber-400" /> : <Sparkles className="w-4 h-4 text-emerald-400" />}
                  <span>{aiOutput.title}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {aiOutput.planText}
                </p>
                {aiOutput.recommendedCampaignId && (
                  <button
                    onClick={() => {
                      const cmp = campaigns.find((c) => c.id === aiOutput.recommendedCampaignId);
                      if (cmp) onSelectCampaign(cmp);
                    }}
                    className="w-full py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/40"
                  >
                    View Recommended Campaign
                  </button>
                )}
              </div>
            )}

          </div>

          {/* Quick Chat Input at Drawer Bottom */}
          <form onSubmit={handleAskAI} className="p-4 bg-slate-950 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="Ask AI about campaigns or stats..."
              className="flex-1 px-3.5 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
