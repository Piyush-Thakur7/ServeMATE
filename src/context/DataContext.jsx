import React, { createContext, useContext, useState } from 'react';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  // 1. Social Impact Campaigns
  const [campaigns, setCampaigns] = useState([
    {
      id: 'cmp_1',
      title: 'Classroom Textbook & Stationery Kits',
      ngoName: 'Pratham Education Foundation',
      ngoId: 'ngo_101',
      ngoVerified: true,
      category: 'Education',
      location: 'Greater Noida, UP',
      targetAmount: 15000,
      raisedAmount: 11250,
      beneficiaries: 150,
      minDonation: 10,
      description: 'Providing essential textbooks, notebooks, and writing materials for underprivileged primary students.',
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
      slaHoursLeft: 42,
      proofStatus: 'Verified'
    },
    {
      id: 'cmp_2',
      title: 'Warm Meal Kits for Night Shelters',
      ngoName: 'Feeding India Trust',
      ngoId: 'ngo_102',
      ngoVerified: true,
      category: 'Food',
      location: 'Delhi NCR',
      targetAmount: 20000,
      raisedAmount: 18400,
      beneficiaries: 400,
      minDonation: 10,
      description: 'Distributing warm, nutritious meal boxes to nightly street shelter inhabitants.',
      image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80',
      slaHoursLeft: 18,
      proofStatus: 'Verified'
    },
    {
      id: 'cmp_3',
      title: 'Stray Animal Medical & Vaccine Care',
      ngoName: 'People For Animals (PFA)',
      ngoId: 'ngo_103',
      ngoVerified: true,
      category: 'Animal Welfare',
      location: 'Noida Sector 62, UP',
      targetAmount: 10000,
      raisedAmount: 6500,
      beneficiaries: 85,
      minDonation: 10,
      description: 'Emergency anti-rabies vaccination and wound care for community dogs and street animals.',
      image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80',
      slaHoursLeft: 64,
      proofStatus: 'Pending Proof'
    },
    {
      id: 'cmp_4',
      title: 'Clean Campus Tree Plantation Drive',
      ngoName: 'Green Earth Brigade',
      ngoId: 'ngo_104',
      ngoVerified: true,
      category: 'Environment',
      location: 'Greater Noida Campus Area',
      targetAmount: 8000,
      raisedAmount: 5200,
      beneficiaries: 500,
      minDonation: 10,
      description: 'Planting 250 native shade trees across educational institutions and public parks.',
      image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
      slaHoursLeft: 55,
      proofStatus: 'Verified'
    }
  ]);

  // 2. Student & College Communities (The Big Differentiator)
  const [communities, setCommunities] = useState([
    {
      id: 'comm_1',
      name: 'GL Bajaj AI Club',
      code: 'GLBAJAJ',
      college: 'GL Bajaj Institute of Management & IT',
      membersCount: 142,
      totalRaised: 8450,
      impactScore: 980,
      rank: 1,
      category: 'Technology & AI',
      leader: 'Piyush Singh',
      description: 'Official student AI community pooling micro-donations to support educational & tech literacy causes.'
    },
    {
      id: 'comm_2',
      name: 'BCA Batch of 2029',
      code: 'BCA2029',
      college: 'GL Bajaj Institute of Management',
      membersCount: 98,
      totalRaised: 5200,
      impactScore: 740,
      rank: 2,
      category: 'Classroom Group',
      leader: 'Aarav Sharma',
      description: 'First year BCA student collective supporting local hunger relief drives.'
    },
    {
      id: 'comm_3',
      name: 'Coding Club Noida',
      code: 'CCN2026',
      college: 'Delhi NCR Student Network',
      membersCount: 86,
      totalRaised: 4100,
      impactScore: 610,
      rank: 3,
      category: 'Coding & Open Source',
      leader: 'Neha Gupta',
      description: 'Developers uniting to fund medical care for stray animals and street safety.'
    }
  ]);

  // 3. Real-World Proof Ledger (Impact Center)
  const [proofs, setProofs] = useState([
    {
      id: 'prf_101',
      campaignId: 'cmp_1',
      campaignTitle: 'Classroom Textbook & Stationery Kits',
      ngoName: 'Pratham Education Foundation',
      volunteerName: 'Rahul Verma (ID: #V-882)',
      youtubeEmbedId: 'dQw4w9WgXcQ',
      date: '2026-07-20',
      gpsLocation: '28.4744° N, 77.5040° E (Greater Noida Sector 4)',
      description: 'Distributed 150 textbook and stationery packs to primary students. Watch the live field delivery footage.',
      taggedDonorsCount: 42,
      verified: true
    },
    {
      id: 'prf_102',
      campaignId: 'cmp_2',
      campaignTitle: 'Warm Meal Kits for Night Shelters',
      ngoName: 'Feeding India Trust',
      volunteerName: 'Ananya Roy (ID: #V-904)',
      youtubeEmbedId: 'dQw4w9WgXcQ',
      date: '2026-07-18',
      gpsLocation: '28.5355° N, 77.3910° E (Noida Sector 18)',
      description: 'Handed out 400 warm dinner boxes at Sector 18 shelter site. Timestamp verified on-scene.',
      taggedDonorsCount: 88,
      verified: true
    }
  ]);

  // 4. User Donation Logs
  const [donations, setDonations] = useState([
    {
      id: 'tx_8941',
      campaignTitle: 'Classroom Textbook & Stationery Kits',
      ngoName: 'Pratham Education Foundation',
      amount: 20,
      ngoAmount: 19.00,
      platformFee: 1.00,
      date: '2026-07-21',
      communityCode: 'GLBAJAJ',
      proofStatus: 'Verified',
      proofId: 'prf_101'
    },
    {
      id: 'tx_8940',
      campaignTitle: 'Warm Meal Kits for Night Shelters',
      ngoName: 'Feeding India Trust',
      amount: 50,
      ngoAmount: 47.50,
      platformFee: 2.50,
      date: '2026-07-15',
      communityCode: 'GLBAJAJ',
      proofStatus: 'Verified',
      proofId: 'prf_102'
    }
  ]);

  // Helper: Process Micro-Donation
  const processDonation = (campaignId, amount, communityCode = 'GLBAJAJ') => {
    const targetCampaign = campaigns.find((c) => c.id === campaignId);
    if (!targetCampaign) return null;

    const ngoAmount = amount * 0.95;
    const platformFee = amount * 0.05;
    const newTxId = `tx_${Math.floor(1000 + Math.random() * 9000)}`;

    const newDonation = {
      id: newTxId,
      campaignTitle: targetCampaign.title,
      ngoName: targetCampaign.ngoName,
      amount: Number(amount),
      ngoAmount: Number(ngoAmount.toFixed(2)),
      platformFee: Number(platformFee.toFixed(2)),
      date: new Date().toISOString().split('T')[0],
      communityCode,
      proofStatus: 'Pending Verification',
      proofId: null
    };

    // Update Campaign Raised Amount
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId ? { ...c, raisedAmount: c.raisedAmount + Number(amount) } : c
      )
    );

    // Update Community Total Raised
    setCommunities((prev) =>
      prev.map((comm) =>
        comm.code === communityCode
          ? {
              ...comm,
              totalRaised: comm.totalRaised + Number(amount),
              impactScore: comm.impactScore + Math.floor(amount * 2)
            }
          : comm
      )
    );

    // Add to Donation History
    setDonations((prev) => [newDonation, ...prev]);

    return newDonation;
  };

  return (
    <DataContext.Provider value={{ campaigns, communities, proofs, donations, processDonation }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
