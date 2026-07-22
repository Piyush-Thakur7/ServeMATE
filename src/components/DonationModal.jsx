import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { 
  X, 
  Heart, 
  ShieldCheck, 
  CheckCircle2, 
  Printer, 
  Sparkles, 
  Users, 
  CreditCard 
} from 'lucide-react';

export const DonationModal = ({ campaign, onClose }) => {
  const { user, addXP } = useAuth();
  const { processDonation, communities } = useData();

  const [amount, setAmount] = useState(20);
  const [selectedCommunity, setSelectedCommunity] = useState(user?.communityCode || 'GLBAJAJ');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const presetAmounts = [10, 20, 50, 100];
  const ngoAmount = (amount * 0.95).toFixed(2);
  const platformFee = (amount * 0.05).toFixed(2);

  const handleSimulatedDonate = () => {
    if (!amount || amount < 10) return;
    setIsProcessing(true);

    // Simulate 1.5s Razorpay payment callback
    setTimeout(() => {
      const generatedReceipt = processDonation(campaign.id, amount, selectedCommunity);
      addXP(Math.floor(amount)); // Award XP equal to donation amount
      setIsProcessing(false);
      setReceipt(generatedReceipt);
    }, 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {!receipt ? (
          /* STEP 1: MICRO-DONATION CHECKOUT FORM */
          <div className="p-6 md:p-8 space-y-6">
            
            {/* Header Title */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified NGO Micro-Donation
              </div>
              <h3 className="text-xl font-heading font-extrabold text-white leading-snug">
                {campaign.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Partner: <span className="text-slate-200 font-semibold">{campaign.ngoName}</span>
              </p>
            </div>

            {/* Micro-Donation Amount Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select Micro-Give Amount (Starts at ₹10)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset)}
                    className={`py-3 rounded-xl font-heading font-extrabold text-sm transition-all ${
                      amount === preset
                        ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 scale-105'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    ₹{preset}
                  </button>
                ))}
              </div>
              
              {/* Custom Amount Input */}
              <div className="mt-2 relative">
                <span className="absolute left-4 top-3 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min="10"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-800/80 border border-white/10 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="Custom Amount (Min ₹10)"
                />
              </div>
            </div>

            {/* 95/5 Transparent Fee Breakdown */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>95% Direct NGO Escrow:</span>
                <span className="font-bold text-emerald-400">₹{ngoAmount}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>5% Platform Technology Fee:</span>
                <span>₹{platformFee}</span>
              </div>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-white/5 flex items-center gap-1">
                <span>⚡ 0% UPI Merchant Gateway Charges</span>
              </div>
            </div>

            {/* Community Attribution Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                Attribute to Campus Community
              </label>
              <select
                value={selectedCommunity}
                onChange={(e) => setSelectedCommunity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-white/10 rounded-xl text-xs text-white font-medium focus:outline-none focus:border-cyan-500"
              >
                {communities.map((c) => (
                  <option key={c.code} value={c.code} className="bg-slate-900">
                    {c.name} ({c.code}) - {c.college}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Payment Trigger */}
            <button
              onClick={handleSimulatedDonate}
              disabled={isProcessing || !amount || amount < 10}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-heading font-extrabold text-base shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Sparkles className="w-5 h-5 animate-spin" />
                  <span>Processing Secure UPI Micro-Give...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Give ₹{amount} Micro-Donation Now</span>
                </>
              )}
            </button>
            
            <p className="text-[11px] text-center text-slate-500">
              V1 Sandbox Mode • 3-Day SLA Verified Video Guarantee
            </p>
          </div>
        ) : (
          /* STEP 2: INSTANT DIGITAL IMPACT RECEIPT MODAL (V1 PRINTABLE) */
          <div className="p-6 md:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-heading font-extrabold text-white">
                Micro-Donation Confirmed!
              </h3>
              <p className="text-xs text-slate-400">
                You earned <span className="font-bold text-amber-400">+{amount} XP</span> toward Level {user?.level || 1}!
              </p>
            </div>

            {/* Official Digital Impact Receipt Box */}
            <div id="printable-receipt" className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-slate-400">RECEIPT NO:</span>
                <span className="text-emerald-400 font-bold">{receipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">DATE:</span>
                <span className="text-slate-200">{receipt.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">CAMPAIGN:</span>
                <span className="text-slate-200 font-semibold text-right max-w-[200px] truncate">{receipt.campaignTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">NGO PARTNER:</span>
                <span className="text-slate-200">{receipt.ngoName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">COMMUNITY:</span>
                <span className="text-cyan-400 font-bold">{receipt.communityCode}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 text-sm">
                <span className="text-slate-300 font-bold">TOTAL GIVEN:</span>
                <span className="text-emerald-400 font-bold">₹{receipt.amount}.00</span>
              </div>
              <div className="text-[10px] text-slate-500 pt-2 border-t border-white/5 text-center font-sans">
                🔒 Verified by ServeMate Public Ledger • 72-Hour SLA Video Proof Alert Active
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              >
                Done & View Proof Ledger
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
