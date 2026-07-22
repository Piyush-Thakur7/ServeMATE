import React from 'react';
import { useData } from '../context/DataContext';
import { Video, ShieldCheck, MapPin, Calendar, Users, Play } from 'lucide-react';

export const ImpactCenter = ({ onSelectProof }) => {
  const { proofs } = useData();

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          100% Auditable Proof Loop
        </div>
        <h1 className="text-4xl font-heading font-extrabold text-white">
          Real Proof <span className="text-emerald-400">Ledger</span>
        </h1>
        <p className="text-xs text-slate-400 max-w-xl">
          Watch verified live video proof recorded by assigned NGO volunteers using our mandatory in-app camera. Geotagged & timestamped.
        </p>
      </div>

      {/* Proof Video Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {proofs.map((proof) => (
          <div key={proof.id} className="glass-panel glass-panel-hover rounded-3xl overflow-hidden space-y-4 p-6 flex flex-col justify-between">
            
            <div className="space-y-3">
              {/* Video Thumbnail Box with Play Trigger */}
              <div 
                onClick={() => onSelectProof(proof)}
                className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-white/10 group cursor-pointer"
              >
                <img 
                  src={`https://img.youtube.com/vi/${proof.youtubeEmbedId}/hqdefault.jpg`} 
                  alt={proof.campaignTitle}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-all flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/90 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 fill-current ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-[10px] font-bold text-white bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <ShieldCheck className="w-3 h-3" />
                    Live Camera Verified
                  </span>
                  <span>{proof.date}</span>
                </div>
              </div>

              {/* Title & Metadata */}
              <div>
                <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  <span>{proof.ngoName}</span>
                </div>
                <h3 className="font-heading font-extrabold text-white text-lg leading-snug">
                  {proof.campaignTitle}
                </h3>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400 bg-slate-950/60 p-3.5 rounded-xl border border-white/5 font-mono">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{proof.gpsLocation}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>{proof.taggedDonorsCount} Donors Tagged in Proof</span>
                </div>
              </div>
            </div>

            {/* Watch Proof Button */}
            <button
              onClick={() => onSelectProof(proof)}
              className="w-full py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-heading font-extrabold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Video className="w-4 h-4" />
              <span>Watch Video Proof & Audit Details</span>
            </button>

          </div>
        ))}
      </div>

    </div>
  );
};
