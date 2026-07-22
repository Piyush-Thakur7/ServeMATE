import React from 'react';
import { Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const SLABadge = ({ hoursLeft = 48, status = 'Verified' }) => {
  if (status === 'Verified') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
        <CheckCircle2 className="w-3 h-3" />
        SLA Verified Proof Delivered
      </span>
    );
  }

  const isUrgent = hoursLeft <= 24;

  return (
    <span 
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold ${
        isUrgent
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse'
          : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
      }`}
      title="72-Hour Verification Guarantee: NGO must submit live video proof before countdown expires"
    >
      {isUrgent ? <ShieldAlert className="w-3 h-3 text-amber-400" /> : <Clock className="w-3 h-3 text-cyan-400" />}
      72-Hr SLA: {hoursLeft}h Left
    </span>
  );
};
