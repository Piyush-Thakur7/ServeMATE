import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { ShieldCheck, CheckCircle2, AlertTriangle, Video, DollarSign, Building2 } from 'lucide-react';

export const DashboardAdmin = () => {
  const { campaigns, donations } = useData();

  const [verifiedNgos, setVerifiedNgos] = useState([
    { id: 'ngo_101', name: 'Pratham Education Foundation', darpanId: 'DARPAN-UP-2024-88491', status: 'Verified' },
    { id: 'ngo_105', name: 'Noida Youth Relief NGO', darpanId: 'DARPAN-UP-2026-10492', status: 'Pending Darpan Check' }
  ]);

  const [pendingProof, setPendingProof] = useState({
    title: 'Stray Animal Medical & Vaccine Care',
    ngoName: 'People For Animals (PFA)',
    volunteerName: 'Rahul Verma (#V-882)',
    gpsLocation: '28.4744° N, 77.5040° E',
    status: 'Pending Audit'
  });

  const [approvedMsg, setApprovedMsg] = useState(null);

  const handleApproveNgo = (id) => {
    setVerifiedNgos((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 'Verified' } : n))
    );
  };

  const handleApproveProof = () => {
    setPendingProof((prev) => ({ ...prev, status: 'Published to YouTube & Ledger' }));
    setApprovedMsg('Proof Approved! Embedded on YouTube, tagged all campaign donors, and sent Inbox Notifications!');
  };

  const totalPlatformFees = donations.reduce((sum, d) => sum + (d.platformFee || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-10">
      
      {/* Admin Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Platform Administrator Desk
            </div>
            <h1 className="text-3xl font-heading font-extrabold text-white">ServeMate Audit & Trust Control</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5 text-xs">
          <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
            <span className="text-slate-500 block text-[10px]">Total Platform 5% Fees Collected:</span>
            <span className="text-xl font-heading font-extrabold text-emerald-400">₹{totalPlatformFees.toFixed(2)}</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
            <span className="text-slate-500 block text-[10px]">Verified NGO Partners:</span>
            <span className="text-xl font-heading font-extrabold text-white">4 Organizations</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
            <span className="text-slate-500 block text-[10px]">Proof Audit SLA Timelines:</span>
            <span className="text-xl font-heading font-extrabold text-cyan-400">100% Met (0 Breaches)</span>
          </div>
        </div>
      </div>

      {/* Proof Audit Queue */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
        <h3 className="font-heading font-extrabold text-white text-lg flex items-center gap-2">
          <Video className="w-5 h-5 text-cyan-400" />
          <span>Proof Video Audit & Verification Queue</span>
        </h3>

        <div className="bg-slate-950 p-6 rounded-2xl border border-white/10 space-y-4 text-xs">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-heading font-bold text-white text-base">{pendingProof.title}</h4>
              <p className="text-slate-400">{pendingProof.ngoName} • Volunteer: {pendingProof.volunteerName}</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
              {pendingProof.status}
            </span>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl font-mono text-[11px] text-slate-300">
            📍 GPS Coordinates: {pendingProof.gpsLocation} | Watermarked In-App Capture Verified
          </div>

          {pendingProof.status === 'Pending Audit' && (
            <div className="flex gap-3">
              <button
                onClick={handleApproveProof}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-heading font-extrabold text-xs flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve, Publish to YouTube & Tag All Donors</span>
              </button>
            </div>
          )}

          {approvedMsg && (
            <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 pt-2">
              <CheckCircle2 className="w-4 h-4" />
              {approvedMsg}
            </p>
          )}
        </div>
      </div>

      {/* NGO Darpan Approvals Queue */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
        <h3 className="font-heading font-extrabold text-white text-lg flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-400" />
          <span>NGO Darpan Government Verification Queue</span>
        </h3>

        <div className="divide-y divide-white/5 text-xs">
          {verifiedNgos.map((ngo) => (
            <div key={ngo.id} className="py-4 flex items-center justify-between">
              <div>
                <h4 className="font-heading font-bold text-white text-sm">{ngo.name}</h4>
                <span className="text-slate-400 text-[11px]">NITI Darpan ID: <strong className="text-cyan-400 font-mono">{ngo.darpanId}</strong></span>
              </div>
              <div>
                {ngo.status === 'Verified' ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30 text-[10px]">
                    Verified Partner
                  </span>
                ) : (
                  <button
                    onClick={() => handleApproveNgo(ngo.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                  >
                    Verify NGO Credentials
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
