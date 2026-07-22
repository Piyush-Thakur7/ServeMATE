import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

import { Home } from './pages/Home';
import { Causes } from './pages/Causes';
import { Communities } from './pages/Communities';
import { ImpactCenter } from './pages/ImpactCenter';
import { Leaderboards } from './pages/Leaderboards';
import { DashboardDonor } from './pages/DashboardDonor';
import { DashboardCommunity } from './pages/DashboardCommunity';
import { DashboardNGO } from './pages/DashboardNGO';
import { DashboardAdmin } from './pages/DashboardAdmin';
import { About } from './pages/About';
import { Contact } from './pages/Contact';

import { DonationModal } from './components/DonationModal';
import { ProofModal } from './components/ProofModal';
import { AIAdvisorDrawer } from './components/AIAdvisorDrawer';

export function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedProof, setSelectedProof] = useState(null);
  const [aiAdvisorOpen, setAiAdvisorOpen] = useState(false);

  const handleSelectCampaign = (campaign) => {
    setSelectedCampaign(campaign);
  };

  const handleSelectProof = (proof) => {
    setSelectedProof(proof);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F17] text-slate-100 selection:bg-emerald-500 selection:text-slate-950 font-sans">
      
      {/* Floating Navigation Header */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        openAIAdvisor={() => setAiAdvisorOpen(true)} 
      />

      {/* Main View Router */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <Home 
            setActiveTab={setActiveTab} 
            onSelectCampaign={handleSelectCampaign} 
            onSelectProof={handleSelectProof} 
          />
        )}
        {activeTab === 'causes' && (
          <Causes onSelectCampaign={handleSelectCampaign} />
        )}
        {activeTab === 'communities' && <Communities />}
        {activeTab === 'impact' && (
          <ImpactCenter onSelectProof={handleSelectProof} />
        )}
        {activeTab === 'leaderboard' && <Leaderboards />}
        
        {/* Role Dashboards */}
        {activeTab === 'dashboard-donor' && (
          <DashboardDonor openAIAdvisor={() => setAiAdvisorOpen(true)} />
        )}
        {activeTab === 'dashboard-community' && <DashboardCommunity />}
        {activeTab === 'dashboard-ngo' && <DashboardNGO />}
        {activeTab === 'dashboard-admin' && <DashboardAdmin />}
        
        {/* Informational Views */}
        {activeTab === 'about' && <About />}
        {activeTab === 'contact' && <Contact />}
      </main>

      {/* Footer */}
      <Footer setActiveTab={setActiveTab} />

      {/* Modals & AI Drawer Layer */}
      {selectedCampaign && (
        <DonationModal 
          campaign={selectedCampaign} 
          onClose={() => setSelectedCampaign(null)} 
        />
      )}

      {selectedProof && (
        <ProofModal 
          proof={selectedProof} 
          onClose={() => setSelectedProof(null)} 
        />
      )}

      <AIAdvisorDrawer 
        isOpen={aiAdvisorOpen} 
        onClose={() => setAiAdvisorOpen(false)} 
        onSelectCampaign={handleSelectCampaign} 
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}
