import React from 'react';
import { X, ShieldCheck, MapPin, Calendar, Users, Video } from 'lucide-react';

export const ProofModal = ({ proof, onClose }) => {
  if (!proof) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Video Player Header */}
        <div className="p-6 md:p-8 space-y-4">
          
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified In-App Live Video Proof
            </span>
          </div>

          <h3 className="text-xl font-heading font-extrabold text-white leading-snug">
            {proof.campaignTitle}
          </h3>

          {/* YouTube Video Player Embed Container */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-white/10 shadow-xl">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${proof.youtubeEmbedId}?autoplay=1`}
              title="Verified Field Proof Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>

          {/* Metadata Bar (GPS, Timestamp, Volunteer) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950/70 border border-white/5 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">{proof.gpsLocation}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Timestamp: {proof.date}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Volunteer: <strong className="text-slate-100">{proof.volunteerName}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Users className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Tagged Donors: <strong className="text-emerald-400">{proof.taggedDonorsCount} Donors</strong></span>
            </div>
          </div>

          {/* Proof Notes */}
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-4 rounded-xl border border-white/5">
            "{proof.description}"
          </p>

          {/* Bottom Action */}
          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              Close Ledger View
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
