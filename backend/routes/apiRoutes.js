const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const { supabase, supabaseAdmin } = require("../config/supabaseClient");
const { authMiddleware } = require("../middleware/authMiddleware");
const { CORE_CAUSES, mergeCoreCauses } = require("../services/causeCatalog");
const { getProgression } = require("../services/gamificationService");

const router = express.Router();

function ensureNgo(req, res, next) {
  if (req.user?.role !== "ngo") return res.status(403).json({ error: "NGO access required" });
  return next();
}

function razorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY;
  const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;
  return { keyId, keySecret, enabled: Boolean(keyId && keySecret) };
}

function razorpayClient() {
  const config = razorpayConfig();
  if (!config.enabled) return null;
  return new Razorpay({ key_id: config.keyId, key_secret: config.keySecret });
}

// ────────────────────────────────────────────────────────────────────────────
//  COMPATIBILITY FORMATTING WRAPPERS
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
    about: dbNgo.description || "",
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
  
  // Custom fallback properties for seeded campaigns
  const presets = {
    "Digital Learning for Rural Students": { icon: "📚", image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=80", impact: "₹500 = 1 Digital Study Kit for a student" },
    "Primary School Tuition Clinic": { icon: "✏️", image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80", impact: "₹250 = 1 month of tuition class support" },
    "Medical Support for Underprivileged Families": { icon: "🏥", image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&auto=format&fit=crop&q=80", impact: "₹1000 = 1 life-saving medical consultation" },
    "Mobile Health Camps in Remote Villages": { icon: "🚐", image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80", impact: "₹200 = 1 basic health checkup & medicine pack" },
    "10000 Meals Initiative": { icon: "🍲", image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&auto=format&fit=crop&q=80", impact: "₹20 = 1 hot nutritious meal served" },
    "Feed the Homeless Daily Drive": { icon: "🍛", image: "https://images.unsplash.com/photo-1593113630400-ea4288922497?w=600&auto=format&fit=crop&q=80", impact: "₹300 = 1 grocery kit containing basic dry rations" },
    "Plant 50000 Trees Mission": { icon: "🌳", image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80", impact: "₹50 = 1 native tree sapling planted & nurtured" },
    "Urban Green Spaces Development": { icon: "🌱", image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&auto=format&fit=crop&q=80", impact: "₹100 = 1 sq ft of community green cover created" },
    "School Kit Distribution Program": { icon: "🎒", image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=80", impact: "₹350 = 1 complete school bag & kit distributed" },
    "Women's Skill Development Initiative": { icon: "👩", image: "https://images.unsplash.com/photo-1579208575657-c595a05383b7?w=600&auto=format&fit=crop&q=80", impact: "₹1500 = 1 week of professional vocational training" },
    "Emergency Flood Support": { icon: "🚨", image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600&auto=format&fit=crop&q=80", impact: "₹500 = 1 emergency survival & hygiene kit" }
  }[dbCamp.title] || { icon: "📚", image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=80", impact: "Verified support" };

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
    icon: presets.icon,
    image: presets.image,
    impactPerRupee: presets.impact,
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
    donationCount: parseInt(dbUser.donation_count) || 0
  };
}

function formatCommunity(dbComm) {
  if (!dbComm) return null;
  return {
    _id: dbComm.id,
    id: dbComm.id,
    name: dbComm.name,
    description: dbComm.description,
    logo: dbComm.logo || "",
    code: dbComm.code || "",
    category: dbComm.category || "Club",
    totalRaised: parseFloat(dbComm.total_donated) || 0,
    impactScore: parseInt(dbComm.rank) || 0,
    members: [],
    supportedNgos: []
  };
}

// ────────────────────────────────────────────────────────────────────────────
//  ENDPOINTS
// ────────────────────────────────────────────────────────────────────────────

router.get("/settings", async (req, res) => {
  return res.json({ key: "global", maintenanceMode: false, version: "2.0-supabase" });
});

router.get("/ngo-site/:slug", async (req, res) => {
  try {
    const { data: ngo, error } = await supabaseAdmin
      .from("ngos")
      .select("*, campaigns(*)")
      .or(`slug.eq.${req.params.slug},id.eq.${req.params.slug}`)
      .eq("verified", true)
      .maybeSingle();

    if (error || !ngo) return res.status(404).json({ error: "Approved NGO site not found" });

    // Fetch NGO donations
    const { data: donations } = await supabaseAdmin
      .from("donations")
      .select("*, campaign:campaigns(title)")
      .eq("ngo_id", ngo.id)
      .in("status", ["completed", "verified"])
      .order("updated_at", { ascending: false })
      .limit(20);

    const formattedNgo = formatNgo(ngo);
    const formattedTasks = (donations || []).map(d => ({
      _id: d.id,
      amount: d.amount,
      updatedAt: d.updated_at,
      cause: d.campaign ? { title: d.campaign.title } : { title: "Transparent Support" }
    }));

    return res.json({
      ngo: formattedNgo,
      tasks: formattedTasks,
      updates: ngo.updates || []
    });
  } catch (err) {
    return res.status(500).json({ error: "Unable to load NGO site" });
  }
});

router.get("/ngo/me", authMiddleware, ensureNgo, async (req, res) => {
  try {
    const { data: ngo } = await supabaseAdmin
      .from("ngos")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (!ngo) return res.status(404).json({ error: "NGO profile not found" });
    return res.json({ ngo: formatNgo(ngo), tasks: ngo.updates || [] });
  } catch (err) {
    return res.status(500).json({ error: "Unable to load NGO dashboard" });
  }
});

router.patch("/ngo/me", authMiddleware, ensureNgo, async (req, res) => {
  try {
    const update = {};
    if (req.body.name !== undefined) update.name = req.body.name;
    if (req.body.location !== undefined) update.address = req.body.location;
    if (req.body.description !== undefined) update.description = req.body.description;
    if (req.body.logoUrl !== undefined) update.logo_url = req.body.logoUrl;

    const { data: ngo } = await supabaseAdmin
      .from("ngos")
      .update(update)
      .eq("id", req.user.id)
      .select()
      .single();

    if (!ngo) return res.status(404).json({ error: "NGO profile not found" });
    return res.json({ message: "NGO profile updated", ngo: formatNgo(ngo) });
  } catch (err) {
    return res.status(400).json({ error: "Unable to update NGO profile" });
  }
});

router.post("/ngo/tasks", authMiddleware, ensureNgo, async (req, res) => {
  try {
    const { data: ngo } = await supabaseAdmin.from("ngos").select("*").eq("id", req.user.id).single();
    if (!ngo) return res.status(404).json({ error: "NGO profile not found" });
    if (!ngo.verified) return res.status(403).json({ error: "Admin approval is required before submitting work" });

    // Fetch any active campaign to link with
    const { data: camp } = await supabaseAdmin.from("campaigns").select("id").eq("ngo_id", ngo.id).limit(1).single();

    const { data: proof, error } = await supabaseAdmin
      .from("proof_uploads")
      .insert({
        campaign_id: camp ? camp.id : null,
        ngo_id: ngo.id,
        youtube_url: req.body.proofUrl,
        description: req.body.note || req.body.description,
        status: "verified" // auto-verify NGO submits for demo
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      message: "Work update published",
      task: { title: req.body.title, note: req.body.description, proofUrl: req.body.proofUrl }
    });
  } catch (err) {
    return res.status(400).json({ error: "Unable to submit work: " + err.message });
  }
});

router.get("/causes", async (req, res) => {
  try {
    const { data: camps, error } = await supabaseAdmin
      .from("campaigns")
      .select("*, ngo:ngos(*)")
      .eq("status", "active");

    if (error) throw error;

    const formatted = (camps || []).map(c => formatCampaign(c, c.ngo));
    return res.json(formatted);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/causes/:id", async (req, res) => {
  try {
    const { data: camp, error } = await supabaseAdmin
      .from("campaigns")
      .select("*, ngo:ngos(*)")
      .eq("id", req.params.id)
      .maybeSingle();

    if (error || !camp) return res.status(404).json({ error: "Cause not found" });
    return res.json(formatCampaign(camp, camp.ngo));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/payments/config", (req, res) => {
  const config = razorpayConfig();
  res.json({ enabled: config.enabled, keyId: config.keyId || "" });
});

router.post("/payments/order", authMiddleware, async (req, res) => {
  try {
    const { causeId, amount } = req.body;
    const safeAmount = Math.floor(Number(amount));
    if (!causeId || !Number.isFinite(safeAmount) || safeAmount < 10) {
      return res.status(400).json({ error: "Cause and minimum amount of Rs 10 required" });
    }

    const { data: cause } = await supabaseAdmin
      .from("campaigns")
      .select("*, ngo:ngos(*)")
      .eq("id", causeId)
      .single();

    if (!cause) {
      return res.status(404).json({ error: "This cause is not available" });
    }

    const client = razorpayClient();
    const config = razorpayConfig();
    if (!client) {
      return res.status(503).json({ error: "Razorpay is not configured on the server" });
    }

    const order = await client.orders.create({
      amount: safeAmount * 100,
      currency: "INR",
      receipt: `servemate_${Date.now()}`,
      notes: {
        causeId: String(cause.id),
        userId: String(req.user.id),
        ngoId: String(cause.ngo_id),
      },
    });

    return res.json({
      keyId: config.keyId,
      orderId: order.id,
      amount: safeAmount,
      currency: "INR",
      cause: { id: cause.id, title: cause.title, ngo: cause.ngo.name },
    });
  } catch (err) {
    console.error("[payments] Order creation failed:", err.message);
    res.status(500).json({ error: "Unable to create payment order" });
  }
});

router.post("/payments/verify", authMiddleware, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, causeId, amount, communityId } = req.body;
    const safeAmount = Math.floor(Number(amount));
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !causeId || !Number.isFinite(safeAmount)) {
      return res.status(400).json({ error: "Payment verification details are incomplete" });
    }

    const client = razorpayClient();
    const { keySecret } = razorpayConfig();
    if (!client || !keySecret) return res.status(503).json({ error: "Razorpay is not configured on the server" });

    const expected = crypto.createHmac("sha256", keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
    if (expected !== razorpay_signature) {
      return res.status(400).json({ error: "Payment signature verification failed" });
    }

    const payment = await client.payments.fetch(razorpay_payment_id);
    if (payment.order_id !== razorpay_order_id || Number(payment.amount) !== safeAmount * 100) {
      return res.status(400).json({ error: "Payment amount or order mismatch" });
    }

    // Record the donation
    const { data: dbCamp } = await supabaseAdmin.from("campaigns").select("*, ngo:ngos(*)").eq("id", causeId).single();
    if (!dbCamp) return res.status(404).json({ error: "Campaign not found" });

    // 1. Insert Donation
    const { data: donation } = await supabaseAdmin
      .from("donations")
      .insert({
        user_id: req.user.id,
        ngo_id: dbCamp.ngo_id,
        campaign_id: causeId,
        community_id: communityId || null,
        amount: safeAmount,
        razorpay_order_id,
        razorpay_payment_id,
        status: "completed"
      })
      .select()
      .single();

    // 2. Increment campaign raised amount
    const nextCampaignRaised = (parseFloat(dbCamp.raised_amount) || 0) + safeAmount;
    await supabaseAdmin.from("campaigns").update({ raised_amount: nextCampaignRaised }).eq("id", causeId);

    // 3. Increment NGO received amount
    const nextNgoReceived = (parseFloat(dbCamp.ngo.total_received) || 0) + safeAmount;
    await supabaseAdmin.from("ngos").update({ total_received: nextNgoReceived }).eq("id", dbCamp.ngo_id);

    // 4. Update user XP and stats
    const { data: dbUser } = await supabaseAdmin.from("users").select("*").eq("id", req.user.id).single();
    const nextXp = (parseInt(dbUser.xp) || 0) + safeAmount;
    const nextDonated = (parseFloat(dbUser.total_donated) || 0) + safeAmount;
    const nextCount = (parseInt(dbUser.donation_count) || 0) + 1;
    const nextLevel = getProgression(nextXp).level;
    const nextTitle = getProgression(nextXp).title;

    const badges = dbUser.badges || [];
    if (nextCount === 1 && !badges.includes("First Donation")) badges.push("First Donation");
    if (nextCount >= 10 && !badges.includes("Consistent Giver")) badges.push("Consistent Giver");
    if (nextCount >= 100 && !badges.includes("Century Club")) badges.push("Century Club");
    if (nextXp >= 5000 && !badges.includes("Impact Creator")) badges.push("Impact Creator");

    const { data: updatedUser } = await supabaseAdmin
      .from("users")
      .update({
        xp: nextXp,
        total_donated: nextDonated,
        donation_count: nextCount,
        level: nextLevel,
        title: nextTitle,
        badges
      })
      .eq("id", req.user.id)
      .select()
      .single();

    // 5. Update community stats if backing with community
    if (communityId) {
      const { data: comm } = await supabaseAdmin.from("communities").select("*").eq("id", communityId).single();
      if (comm) {
        const nextCommRaised = (parseFloat(comm.total_donated) || 0) + safeAmount;
        const impactScore = Math.floor(nextCommRaised * 0.1 + (comm.member_count || 0) * 10);
        await supabaseAdmin.from("communities").update({
          total_donated: nextCommRaised,
          rank: impactScore
        }).eq("id", communityId);
      }
    }

    // Trigger receipt email dispatch asynchronously (non-blocking)
    const { sendReceiptEmail } = require("../utils/receiptGenerator");
    sendReceiptEmail({
      donationId: donation.id,
      userName: updatedUser.name,
      userEmail: updatedUser.email,
      ngoName: dbCamp.ngo.name,
      amount: safeAmount,
      date: donation.created_at || new Date()
    }).catch(err => console.error("[api] Failed to send async receipt email:", err.message));

    return res.status(201).json({
      message: "Payment verified and donation recorded",
      donation: { _id: donation.id, amount: donation.amount, status: donation.status, xpEarned: donation.amount },
      user: formatUser(updatedUser)
    });
  } catch (err) {
    console.error("[payments] Verification failed:", err.message);
    res.status(500).json({ error: "Unable to verify payment" });
  }
});

router.post("/donate", authMiddleware, async (req, res) => {
  return res.status(410).json({ error: "Use Razorpay checkout. Direct donation recording is disabled." });
});

router.get("/donations/history", authMiddleware, async (req, res) => {
  try {
    const { data: donations } = await supabaseAdmin
      .from("donations")
      .select("*, campaign:campaigns(*), ngo:ngos(*)")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    const formatted = (donations || []).map(d => ({
      _id: d.id,
      amount: d.amount,
      createdAt: d.created_at,
      status: d.status,
      cause: formatCampaign(d.campaign, d.ngo),
      ngo: formatNgo(d.ngo)
    }));

    return res.json(formatted);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/transparency", async (req, res) => {
  try {
    const { data: proofs } = await supabaseAdmin
      .from("proof_uploads")
      .select("*, campaign:campaigns(*), ngo:ngos(*)")
      .order("uploaded_at", { ascending: false });

    const formatted = (proofs || []).map(p => ({
      _id: p.id,
      proofVideo: p.youtube_url,
      proofNote: p.description,
      verifiedAt: p.verified_at || p.uploaded_at,
      cause: formatCampaign(p.campaign, p.ngo),
      ngo: formatNgo(p.ngo),
      amount: 1000 // default mock amount representing verification pool
    }));

    return res.json({ logs: formatted, total: formatted.length, page: 1, pages: 1 });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/ngos", async (req, res) => {
  try {
    const { data: ngos } = await supabaseAdmin
      .from("ngos")
      .select("*")
      .eq("verified", true)
      .order("total_received", { ascending: false });

    return res.json((ngos || []).map(formatNgo));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/ngos/:id", async (req, res) => {
  try {
    const { data: ngo } = await supabaseAdmin
      .from("ngos")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();

    if (!ngo) return res.status(404).json({ error: "NGO not found" });

    // Fetch recent transparency logs
    const { data: proofs } = await supabaseAdmin
      .from("proof_uploads")
      .select("*, campaign:campaigns(*), ngo:ngos(*)")
      .eq("ngo_id", ngo.id)
      .limit(5);

    const logs = (proofs || []).map(p => ({
      _id: p.id,
      proofVideo: p.youtube_url,
      proofNote: p.description,
      verifiedAt: p.verified_at || p.uploaded_at,
      cause: formatCampaign(p.campaign, p.ngo)
    }));

    return res.json({ ngo: formatNgo(ngo), recentWork: logs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Alias path
router.get("/ngo/:id", async (req, res) => {
  try {
    const { data: ngo } = await supabaseAdmin
      .from("ngos")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();

    if (!ngo) return res.status(404).json({ error: "NGO not found" });
    return res.json({ ngo: formatNgo(ngo), recentWork: [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/leaderboard/donors", async (req, res) => {
  try {
    const { data: users } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("role", "user")
      .order("xp", { ascending: false })
      .limit(100);

    const formatted = (users || []).map(u => {
      const user = formatUser(u);
      user.progression = getProgression(user.xp);
      return user;
    });

    return res.json(formatted);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/leaderboard/ngos", async (req, res) => {
  try {
    const { data: ngos } = await supabaseAdmin
      .from("ngos")
      .select("*")
      .eq("verified", true)
      .order("trust_rating", { ascending: false })
      .limit(100);

    return res.json((ngos || []).map(formatNgo));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (!user) return res.status(404).json({ error: "User not found" });

    // Fetch joined community IDs
    const { data: memberComms } = await supabaseAdmin
      .from("community_members")
      .select("community_id")
      .eq("user_id", req.user.id);
    const communityIds = (memberComms || []).map(mc => mc.community_id);

    const { data: donations } = await supabaseAdmin
      .from("donations")
      .select("*, campaign:campaigns(*), ngo:ngos(*)")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const formattedDonations = (donations || []).map(d => ({
      _id: d.id,
      amount: d.amount,
      createdAt: d.created_at,
      status: d.status,
      cause: formatCampaign(d.campaign, d.ngo),
      ngo: formatNgo(d.ngo)
    }));

    const progression = getProgression(user.xp || 0);

    const formattedUser = formatUser(user);
    formattedUser.communities = communityIds;

    return res.json({
      user: formattedUser,
      recentDonations: formattedDonations,
      progression,
      nextLevelXp: progression.nextLevelXp,
      xpProgress: progression.progress
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const { data: user } = await supabaseAdmin.from("users").select("*").eq("id", req.user.id).single();
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const { data: memberComms } = await supabaseAdmin
      .from("community_members")
      .select("community_id")
      .eq("user_id", req.user.id);
    const communityIds = (memberComms || []).map(mc => mc.community_id);

    const formatted = formatUser(user);
    formatted.communities = communityIds;
    formatted.progression = getProgression(formatted.xp);
    return res.json(formatted);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch("/profile", authMiddleware, async (req, res) => {
  try {
    const updates = {};
    if (typeof req.body.bio === "string") updates.bio = req.body.bio.slice(0, 500);
    if (typeof req.body.avatar === "string") updates.avatar = req.body.avatar.slice(0, 1000);

    const { data: user } = await supabaseAdmin
      .from("users")
      .update(updates)
      .eq("id", req.user.id)
      .select()
      .single();

    if (!user) return res.status(404).json({ error: "User not found" });

    const { data: memberComms } = await supabaseAdmin
      .from("community_members")
      .select("community_id")
      .eq("user_id", req.user.id);
    const communityIds = (memberComms || []).map(mc => mc.community_id);

    const formatted = formatUser(user);
    formatted.communities = communityIds;
    formatted.progression = getProgression(formatted.xp);
    return res.json(formatted);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/ngos/:id/volunteers", authMiddleware, async (req, res) => {
  try {
    const { data: user } = await supabaseAdmin.from("users").select("*").eq("id", req.user.id).single();
    if (!user) return res.status(404).json({ error: "User not found" });

    const { data: vol, error } = await supabaseAdmin
      .from("volunteers")
      .insert({
        ngo_id: req.params.id,
        name: user.name,
        email: user.email,
        phone: req.body.phone || "",
        status: "requested"
      })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json({ message: "Volunteer request sent", status: "requested" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: "All fields required" });

    await supabaseAdmin.from("contacts").insert({ name, email, message });
    return res.json({ message: "Message sent! We will respond within 24 hours." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/stats", async (req, res) => {
  try {
    // Read total donated
    const { data: donations } = await supabaseAdmin.from("donations").select("amount").in("status", ["completed", "verified"]);
    const totalDonatedVal = (donations || []).reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

    const { data: ngos } = await supabaseAdmin.from("ngos").select("id").eq("verified", true);
    const { data: proofs } = await supabaseAdmin.from("proof_uploads").select("id").eq("status", "verified");

    return res.json({
      totalDonated: totalDonatedVal,
      verifiedTasks: proofs ? proofs.length : 0,
      verifiedNGOs: ngos ? ngos.length : 0,
      totalDonations: donations ? donations.length : 0
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────────────────────────────────
//  AI IMPACT INFERENCE ROUTING
// ────────────────────────────────────────────────────────────────────────────

router.post("/ai/advisor", async (req, res) => {
  try {
    const { amount, category, goal } = req.body;
    if (!amount || !category) return res.status(400).json({ error: "Amount and category are required." });

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "Invalid monthly amount. Must be a positive number." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const annualTotal = numericAmount * 12;
      let planText = `With a contribution of ₹${numericAmount} per month, you can consistently support ${category.toLowerCase()} initiatives throughout the year.\n\n`;
      planText += `Over 12 months, your contribution could reach ₹${annualTotal} and help provide `;
      
      const details = {
        "Education": "learning resources, educational materials, or support programs for students in need.",
        "Healthcare": "medical supplies, essential health checkups, or support services for families in need.",
        "Environment": "native tree saplings, environmental cleanup drives, or green sustainability programs.",
        "Animal Welfare": "nourishing food, vaccinations, or emergency rescue support for stray and shelter animals.",
        "Community Development": "essential infrastructure, sanitation facilities, or skill-development workshops for local communities."
      };
      
      planText += details[category] || "direct aid and resources to community programs.";
      if (goal) planText += ` Specifically, your support can assist towards your goal of: "${goal}".`;
      planText += `\n\nEvery contribution matters. Small Contributions, Big Impact.`;
      
      return res.json({ plan: planText });
    }

    const prompt = `You are the ServeMATE AI Impact Advisor.
Explain how a monthly contribution of ₹${numericAmount} per month can create a meaningful impact in the cause category of "${category}".
${goal ? `The user's specific goal is: "${goal}".` : ''}
Conclude with: "Every contribution matters. Small Contributions, Big Impact."`;

    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 250 }
      })
    });

    const data = await apiResponse.json();
    if (!apiResponse.ok) throw new Error("Gemini API Error");

    const plan = data.candidates?.[0]?.content?.parts?.[0]?.text || "Thank you for supporting this cause!";
    return res.json({ plan: plan.trim() });
  } catch (err) {
    return res.status(500).json({ error: "Unable to generate impact plan." });
  }
});

router.get("/ai/recommendations", authMiddleware, async (req, res) => {
  try {
    const { data: dbCamps } = await supabaseAdmin.from("campaigns").select("*, ngo:ngos(*)").eq("status", "active");
    res.json({
      recommendation: formatCampaign(dbCamps[0], dbCamps[0]?.ngo),
      reason: "Start your journey today with our highlighted community cause and make a difference."
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/ai/community-insights", async (req, res) => {
  try {
    const { data: comms } = await supabaseAdmin.from("communities").select("*").order("total_donated", { ascending: false }).limit(10);
    const text = `Student communities are leading the charge! College Clubs like "${comms?.[0]?.name || "GL Bajaj Clubs"}" represent the most active category on ServeMATE, contributing over 55% of all community-raised funds.`;
    res.json({ insights: text });
  } catch (err) {
    res.json({ insights: "College Club communities are currently leading the national leaderboard." });
  }
});

router.get("/ai/impact-summary", authMiddleware, async (req, res) => {
  try {
    const { data: user } = await supabaseAdmin.from("users").select("*").eq("id", req.user.id).single();
    let sumText = `Monthly Impact Report for ${user.name || "Changemaker"}:\n\n`;
    sumText += `You have supported verified projects, contributing a total of ₹${(user.total_donated || 0).toLocaleString('en-IN')}.\n`;
    sumText += `Your current XP stands at ${user.xp || 0} XP (Level ${user.level || 1}). Thank you for powering social change!`;
    return res.json({ summary: sumText });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────────────────────────────────
//  COMMUNITIES
// ────────────────────────────────────────────────────────────────────────────

router.post("/communities", authMiddleware, async (req, res) => {
  try {
    const { name, description, logo, category } = req.body;
    if (!name || !description || !category) return res.status(400).json({ error: "Name, description, and category are required" });

    let code;
    let codeExists = true;
    while (codeExists) {
      code = crypto.randomBytes(3).toString("hex").toUpperCase();
      const { data: existing } = await supabaseAdmin.from("communities").select("id").eq("code", code).maybeSingle();
      if (!existing) codeExists = false;
    }

    const { data: comm, error } = await supabaseAdmin
      .from("communities")
      .insert({
        name,
        description,
        logo: logo || "",
        code,
        category,
        leader_id: req.user.id,
        member_count: 1,
        total_donated: 0
      })
      .select()
      .single();

    if (error) throw error;

    // Creator joins as first member
    await supabaseAdmin.from("community_members").insert({
      community_id: comm.id,
      user_id: req.user.id
    });

    return res.status(201).json(formatCommunity(comm));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/communities", async (req, res) => {
  try {
    const { search } = req.query;
    let query = supabaseAdmin.from("communities").select("*").order("total_donated", { ascending: false });
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,code.eq.${search.toUpperCase()}`);
    }

    const { data: comms } = await query;
    return res.json((comms || []).map(formatCommunity));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/communities/join", authMiddleware, async (req, res) => {
  try {
    const { code, communityId } = req.body;
    if (!code && !communityId) return res.status(400).json({ error: "Community code or ID is required" });

    let filterQuery = supabaseAdmin.from("communities").select("*");
    if (communityId) filterQuery = filterQuery.eq("id", communityId);
    else filterQuery = filterQuery.eq("code", code.toUpperCase().trim());

    const { data: comm } = await filterQuery.maybeSingle();
    if (!comm) return res.status(444).json({ error: "Community not found" });

    // Check if already a member
    const { data: member } = await supabaseAdmin
      .from("community_members")
      .select("id")
      .eq("community_id", comm.id)
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (member) return res.status(409).json({ error: "You are already a member of this community" });

    // Join community
    await supabaseAdmin.from("community_members").insert({ community_id: comm.id, user_id: req.user.id });

    // Update community member count
    const { data: allMembers } = await supabaseAdmin.from("community_members").select("id").eq("community_id", comm.id);
    const memberCount = allMembers ? allMembers.length : 1;
    
    await supabaseAdmin.from("communities").update({ member_count: memberCount }).eq("id", comm.id);

    return res.json({ message: "Successfully joined the community", community: formatCommunity(comm) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/communities/:id", async (req, res) => {
  try {
    const { data: comm } = await supabaseAdmin.from("communities").select("*").eq("id", req.params.id).maybeSingle();
    if (!comm) return res.status(404).json({ error: "Community not found" });

    // Fetch members profile
    const { data: memberRows } = await supabaseAdmin
      .from("community_members")
      .select("user_id")
      .eq("community_id", comm.id);

    const userIds = (memberRows || []).map(mr => mr.user_id);
    let members = [];
    if (userIds.length > 0) {
      const { data: userProfiles } = await supabaseAdmin.from("users").select("*").in("id", userIds);
      members = (userProfiles || []).map(formatUser);
    }

    // Fetch community donation history
    const { data: donations } = await supabaseAdmin
      .from("donations")
      .select("*, campaign:campaigns(*), user:users(*)")
      .eq("community_id", comm.id)
      .in("status", ["completed", "verified"])
      .order("created_at", { ascending: false })
      .limit(10);

    const activity = (donations || []).map(d => ({
      _id: d.id,
      amount: d.amount,
      createdAt: d.created_at,
      user: { name: d.user ? d.user.name : "Anonymous" },
      cause: { title: d.campaign ? d.campaign.title : "Transparent Support" }
    }));

    // Rank communities
    const { data: allComms } = await supabaseAdmin.from("communities").select("id").order("total_donated", { ascending: false });
    const rank = (allComms || []).findIndex(c => c.id === comm.id) + 1;

    const formattedComm = formatCommunity(comm);
    formattedComm.members = members;

    return res.json({
      community: formattedComm,
      rank: rank || 1,
      activity,
      verificationVideos: []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Volunteer approvals - NGO endpoint
router.patch("/admin/ngos/volunteers/:userId", authMiddleware, ensureNgo, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) return res.status(400).json({ error: "Invalid status" });

    const { data: vol } = await supabaseAdmin
      .from("volunteers")
      .update({ status })
      .eq("ngo_id", req.user.id)
      .eq("email", req.params.userId) // or ID
      .select()
      .single();

    return res.json({ message: `Volunteer request ${status}`, volunteer: vol });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
