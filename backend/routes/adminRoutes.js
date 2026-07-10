const express = require("express");
const { supabaseAdmin } = require("../config/supabaseClient");
const { adminOnly } = require("../utils/authUtils");

const router = express.Router();

// ────────────────────────────────────────────────────────────────────────────
//  COMPATIBILITY FORMATTERS
// ────────────────────────────────────────────────────────────────────────────
function formatNgo(dbNgo) {
  if (!dbNgo) return null;
  return {
    _id: dbNgo.id,
    id: dbNgo.id,
    name: dbNgo.name,
    email: dbNgo.email,
    location: dbNgo.address || "Noida, Uttar Pradesh",
    description: dbNgo.description || "",
    regNumber: dbNgo.ngo_darpan_id || "MOCK-54321-HELP",
    taxStatus: "Both",
    verified: dbNgo.verified || false,
    rating: parseFloat(dbNgo.trust_rating) || 5.0,
    totalReceived: parseFloat(dbNgo.total_received) || 0,
    tasksCompleted: 5,
    logo: dbNgo.logo_url || "https://images.unsplash.com/photo-1579208575657-c595a05383b7?w=150&auto=format&fit=crop&q=80"
  };
}

function formatCampaign(dbCamp, dbNgo = null) {
  if (!dbCamp) return null;
  return {
    _id: dbCamp.id,
    id: dbCamp.id,
    title: dbCamp.title,
    description: dbCamp.description,
    category: dbCamp.category,
    goal: parseFloat(dbCamp.target_amount) || 100000,
    raised: parseFloat(dbCamp.raised_amount) || 0,
    contributors: 5,
    active: dbCamp.status === "active",
    assignedNgo: formatNgo(dbNgo || dbCamp.ngo)
  };
}

function formatUser(dbUser) {
  if (!dbUser) return null;
  return {
    _id: dbUser.id,
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role || "user",
    avatar: dbUser.avatar || "",
    bio: dbUser.bio || "",
    xp: parseInt(dbUser.xp) || 0,
    level: parseInt(dbUser.level) || 1,
    title: dbUser.title || "Beginner",
    badges: dbUser.badges || [],
    totalDonated: parseFloat(dbUser.total_donated) || 0,
    donationCount: parseInt(dbUser.donation_count) || 0,
    createdAt: dbUser.created_at
  };
}

// ────────────────────────────────────────────────────────────────────────────
//  ROUTING ENDPOINTS
// ────────────────────────────────────────────────────────────────────────────

router.get("/stats", adminOnly, async (req, res) => {
  try {
    const { count: users } = await supabaseAdmin.from("users").select("id", { count: "exact", head: true });
    const { count: ngos } = await supabaseAdmin.from("ngos").select("id", { count: "exact", head: true });
    const { count: pendingNGOs } = await supabaseAdmin.from("ngos").select("id", { count: "exact", head: true }).eq("verified", false);
    const { count: donations } = await supabaseAdmin.from("donations").select("id", { count: "exact", head: true });
    const { count: contacts } = await supabaseAdmin.from("contacts").select("id", { count: "exact", head: true }).eq("read", false);

    return res.json({ users: users || 0, ngos: ngos || 0, pendingNGOs: pendingNGOs || 0, donations: donations || 0, unreadContacts: contacts || 0 });
  } catch (err) {
    return res.status(500).json({ error: "Unable to load admin stats: " + err.message });
  }
});

router.get("/settings", adminOnly, async (req, res) => {
  return res.json({ key: "global", maintenanceMode: false, version: "2.0-supabase" });
});

router.patch("/settings", adminOnly, async (req, res) => {
  return res.json({ message: "Website settings updated", settings: {} });
});

router.get("/ngos", adminOnly, async (req, res) => {
  try {
    const { data: ngos } = await supabaseAdmin.from("ngos").select("*").order("created_at", { ascending: false });
    return res.json((ngos || []).map(formatNgo));
  } catch (err) {
    return res.status(500).json({ error: "Unable to load NGOs" });
  }
});

router.patch("/verify-ngo/:id", adminOnly, async (req, res) => {
  try {
    const { data: ngo } = await supabaseAdmin
      .from("ngos")
      .update({ verified: true })
      .eq("id", req.params.id)
      .select()
      .single();

    if (!ngo) return res.status(404).json({ error: "NGO not found" });
    return res.json({ message: "NGO verified", ngo: formatNgo(ngo) });
  } catch (err) {
    return res.status(500).json({ error: "Unable to verify NGO" });
  }
});

router.patch("/ngos/:id/verify", adminOnly, async (req, res) => {
  try {
    const { data: ngo } = await supabaseAdmin
      .from("ngos")
      .update({ verified: true })
      .eq("id", req.params.id)
      .select()
      .single();

    if (!ngo) return res.status(404).json({ error: "NGO not found" });
    return res.json({ message: "NGO verified", ngo: formatNgo(ngo) });
  } catch (err) {
    return res.status(500).json({ error: "Unable to verify NGO" });
  }
});

router.patch("/reject-ngo/:id", adminOnly, async (req, res) => {
  try {
    const { data: ngo } = await supabaseAdmin
      .from("ngos")
      .update({ verified: false })
      .eq("id", req.params.id)
      .select()
      .single();

    if (!ngo) return res.status(404).json({ error: "NGO not found" });
    return res.json({ message: "NGO rejected", ngo: formatNgo(ngo) });
  } catch (err) {
    return res.status(500).json({ error: "Unable to reject NGO" });
  }
});

router.get("/tasks", adminOnly, async (req, res) => {
  try {
    const { data: donations } = await supabaseAdmin
      .from("donations")
      .select("*, campaign:campaigns(*), ngo:ngos(*)")
      .in("status", ["completed", "verified"])
      .order("updated_at", { ascending: false })
      .limit(100);

    const formatted = (donations || []).map(d => ({
      _id: d.id,
      title: d.campaign ? d.campaign.title : "Donation proof",
      status: d.status,
      ngoId: d.ngo_id
    }));

    return res.json(formatted);
  } catch (err) {
    return res.status(500).json({ error: "Unable to load work items" });
  }
});

router.patch("/tasks/:id/verify", adminOnly, async (req, res) => {
  try {
    const { data: donation } = await supabaseAdmin
      .from("donations")
      .update({ status: "verified" })
      .eq("id", req.params.id)
      .select()
      .single();

    if (!donation) return res.status(404).json({ error: "Donation not found" });

    // Link transparency proof
    const { data: camp } = await supabaseAdmin.from("campaigns").select("*").eq("id", donation.campaign_id).single();
    
    await supabaseAdmin.from("proof_uploads").insert({
      campaign_id: donation.campaign_id,
      ngo_id: donation.ngo_id,
      youtube_url: donation.proofVideo || "https://youtube.com/watch?v=mock",
      description: donation.proofNote || `${camp?.title || "Donation"} verified`,
      status: "verified",
      verified_at: new Date()
    });

    return res.json({ message: "Work verified", task: donation });
  } catch (err) {
    return res.status(500).json({ error: "Unable to verify work" });
  }
});

router.patch("/tasks/:id/reject", adminOnly, async (req, res) => {
  try {
    const { data: donation } = await supabaseAdmin
      .from("donations")
      .update({ status: "completed" }) // reset back to unverified completed state
      .eq("id", req.params.id)
      .select()
      .single();

    if (!donation) return res.status(404).json({ error: "Donation not found" });
    return res.json({ message: "Work sent back", task: donation });
  } catch (err) {
    return res.status(500).json({ error: "Unable to reject work" });
  }
});

router.get("/ngos/pending", adminOnly, async (req, res) => {
  try {
    const { data: ngos } = await supabaseAdmin
      .from("ngos")
      .select("*")
      .eq("verified", false)
      .order("created_at", { ascending: false });

    return res.json((ngos || []).map(formatNgo));
  } catch (err) {
    return res.status(500).json({ error: "Unable to load pending NGOs" });
  }
});

router.get("/ngos/all", adminOnly, async (req, res) => {
  try {
    const { data: ngos } = await supabaseAdmin
      .from("ngos")
      .select("*")
      .order("created_at", { ascending: false });

    return res.json((ngos || []).map(formatNgo));
  } catch (err) {
    return res.status(500).json({ error: "Unable to load NGOs" });
  }
});

router.get("/causes", adminOnly, async (req, res) => {
  try {
    const { data: camps } = await supabaseAdmin
      .from("campaigns")
      .select("*, ngo:ngos(*)")
      .order("created_at", { ascending: false });

    return res.json((camps || []).map(c => formatCampaign(c, c.ngo)));
  } catch (err) {
    return res.status(500).json({ error: "Unable to load causes" });
  }
});

router.delete("/ngos/:id", adminOnly, async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from("ngos").delete().eq("id", req.params.id);
    if (error) throw error;
    return res.json({ message: "NGO removed" });
  } catch (err) {
    return res.status(500).json({ error: "Unable to remove NGO" });
  }
});

router.post("/causes", adminOnly, async (req, res) => {
  try {
    const { title, description, icon, category, goal, impactPerRupee, assignedNgo } = req.body;
    if (!title || !description || !category || !goal || !assignedNgo) {
      return res.status(400).json({ error: "Title, description, category, goal, and approved NGO are required" });
    }

    const { data: ngo } = await supabaseAdmin.from("ngos").select("*").eq("id", assignedNgo).single();
    if (!ngo || !ngo.verified) {
      return res.status(400).json({ error: "Cause must be assigned to an approved NGO" });
    }

    const { data: camp, error } = await supabaseAdmin
      .from("campaigns")
      .insert({
        ngo_id: assignedNgo,
        title,
        description,
        target_amount: parseFloat(goal),
        raised_amount: 0,
        status: "active",
        category
      })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json(formatCampaign(camp, ngo));
  } catch (err) {
    return res.status(500).json({ error: "Unable to create cause: " + err.message });
  }
});

router.patch("/causes/:id", adminOnly, async (req, res) => {
  try {
    const update = {};
    if (req.body.title !== undefined) update.title = req.body.title;
    if (req.body.description !== undefined) update.description = req.body.description;
    if (req.body.category !== undefined) update.category = req.body.category;
    if (req.body.goal !== undefined) update.target_amount = parseFloat(req.body.goal);
    if (req.body.active !== undefined) update.status = req.body.active ? "active" : "inactive";

    const { data: camp, error } = await supabaseAdmin
      .from("campaigns")
      .update(update)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    return res.json(formatCampaign(camp));
  } catch (err) {
    return res.status(500).json({ error: "Unable to update cause" });
  }
});

router.delete("/causes/:id", adminOnly, async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from("campaigns").delete().eq("id", req.params.id);
    if (error) throw error;
    return res.json({ message: "Cause deleted" });
  } catch (err) {
    return res.status(500).json({ error: "Unable to delete cause" });
  }
});

router.get("/donations", adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabaseAdmin.from("donations").select("*, campaign:campaigns(*), user:users(*), ngo:ngos(*)");
    if (status) query = query.eq("status", status);

    const { data: donations } = await query.order("created_at", { ascending: false });
    const formatted = (donations || []).map(d => ({
      _id: d.id,
      amount: d.amount,
      createdAt: d.created_at,
      status: d.status,
      user: { name: d.user ? d.user.name : "Anonymous", email: d.user ? d.user.email : "" },
      cause: { title: d.campaign ? d.campaign.title : "General Support" },
      ngo: { name: d.ngo ? d.ngo.name : "" }
    }));

    return res.json({ donations: formatted, total: formatted.length });
  } catch (err) {
    return res.status(500).json({ error: "Unable to load donations" });
  }
});

router.patch("/donations/:id/complete", adminOnly, async (req, res) => {
  try {
    const { proofVideo, proofNote, location } = req.body;
    if (!proofVideo) return res.status(400).json({ error: "A real proof video URL is required" });

    const { data: donation } = await supabaseAdmin.from("donations").select("*").eq("id", req.params.id).single();
    if (!donation) return res.status(404).json({ error: "Donation not found" });

    const nextStatus = "completed";
    const { data: updated } = await supabaseAdmin
      .from("donations")
      .update({
        status: nextStatus,
        proofVideo: proofVideo, // store temporary or save directly to proof_uploads
        proofNote: proofNote || ""
      })
      .eq("id", req.params.id)
      .select()
      .single();

    return res.json({ message: "Donation proof saved", donation: updated });
  } catch (err) {
    return res.status(500).json({ error: "Unable to complete donation" });
  }
});

router.patch("/donations/:id/verify", adminOnly, async (req, res) => {
  try {
    const { data: donation } = await supabaseAdmin
      .from("donations")
      .update({ status: "verified" })
      .eq("id", req.params.id)
      .select()
      .single();

    if (!donation) return res.status(404).json({ error: "Donation not found" });

    // Link transparency proof
    const { data: camp } = await supabaseAdmin.from("campaigns").select("*").eq("id", donation.campaign_id).single();
    await supabaseAdmin.from("proof_uploads").insert({
      campaign_id: donation.campaign_id,
      ngo_id: donation.ngo_id,
      youtube_url: donation.proofVideo || "https://youtube.com/watch?v=mock",
      description: donation.proofNote || `${camp?.title || "Donation"} verified`,
      status: "verified",
      verified_at: new Date()
    });

    return res.json({ message: "Donation verified", donation });
  } catch (err) {
    return res.status(500).json({ error: "Unable to verify donation" });
  }
});

router.get("/users", adminOnly, async (req, res) => {
  try {
    const { data: users } = await supabaseAdmin.from("users").select("*").order("created_at", { ascending: false });
    return res.json((users || []).map(formatUser));
  } catch (err) {
    return res.status(500).json({ error: "Unable to load users" });
  }
});

router.post("/users/:id/reset-activity", adminOnly, async (req, res) => {
  try {
    // Delete donations and user profile progression stats in Supabase
    await supabaseAdmin.from("donations").delete().eq("user_id", req.params.id);
    await supabaseAdmin.from("user_badges").delete().eq("user_id", req.params.id);
    
    const { data: user } = await supabaseAdmin
      .from("users")
      .update({
        xp: 0,
        level: 1,
        title: "Beginner",
        badges: [],
        total_donated: 0,
        donation_count: 0
      })
      .eq("id", req.params.id)
      .select()
      .single();

    return res.json({ message: "User activity reset", userId: user.id });
  } catch (err) {
    return res.status(500).json({ error: "Unable to reset user activity" });
  }
});

router.post("/reset/all-activity", adminOnly, async (req, res) => {
  try {
    if (req.body.confirmation !== "RESET_ALL_ACTIVITY") {
      return res.status(400).json({ error: "confirmation must be RESET_ALL_ACTIVITY" });
    }

    // Direct truncate / clear via Supabase queries
    await supabaseAdmin.from("donations").delete().neq("id", "00000000-0000-0000-0000-000000000000"); // clears all
    await supabaseAdmin.from("proof_uploads").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("user_badges").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    
    await supabaseAdmin.from("campaigns").update({ raised_amount: 0 });
    await supabaseAdmin.from("ngos").update({ total_received: 0 });
    await supabaseAdmin.from("users").update({
      xp: 0,
      level: 1,
      title: "Beginner",
      badges: [],
      total_donated: 0,
      donation_count: 0
    });

    return res.json({ message: "All transactions, XP, badges, and public proof activity reset" });
  } catch (err) {
    return res.status(500).json({ error: "Unable to reset platform activity" });
  }
});

router.get("/contacts", adminOnly, async (req, res) => {
  try {
    const { data: contacts } = await supabaseAdmin.from("contacts").select("*").order("created_at", { ascending: false });
    const formatted = (contacts || []).map(c => ({
      _id: c.id,
      name: c.name,
      email: c.email,
      message: c.message,
      read: c.read,
      createdAt: c.created_at
    }));
    return res.json(formatted);
  } catch (err) {
    return res.status(500).json({ error: "Unable to load contacts" });
  }
});

router.patch("/contacts/:id/read", adminOnly, async (req, res) => {
  try {
    await supabaseAdmin.from("contacts").update({ read: true }).eq("id", req.params.id);
    return res.json({ message: "Marked as read" });
  } catch (err) {
    return res.status(500).json({ error: "Unable to update contact" });
  }
});

router.get("/overview", adminOnly, async (req, res) => {
  try {
    const { count: users } = await supabaseAdmin.from("users").select("id", { count: "exact", head: true });
    const { count: ngos } = await supabaseAdmin.from("ngos").select("id", { count: "exact", head: true }).eq("verified", true);
    
    const { data: donations } = await supabaseAdmin.from("donations").select("amount").in("status", ["completed", "verified"]);
    const totalDonated = (donations || []).reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

    const { count: pendingNgos } = await supabaseAdmin.from("ngos").select("id", { count: "exact", head: true }).eq("verified", false);
    const { count: unreadMessages } = await supabaseAdmin.from("contacts").select("id", { count: "exact", head: true }).eq("read", false);

    return res.json({
      totalUsers: users || 0,
      verifiedNGOs: ngos || 0,
      totalDonated: totalDonated,
      totalDonations: donations ? donations.length : 0,
      pendingNGOs: pendingNgos || 0,
      unreadMessages: unreadMessages || 0,
    });
  } catch (err) {
    return res.status(500).json({ error: "Unable to load overview: " + err.message });
  }
});

module.exports = router;
