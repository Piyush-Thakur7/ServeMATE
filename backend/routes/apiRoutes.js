const express  = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const { User, NGO, Cause, Donation, Transparency, Contact, SiteSettings, Community } = require("../models/models");
const { authMiddleware } = require("../utils/authUtils");
const { CORE_CAUSES, mergeCoreCauses } = require("../services/causeCatalog");
const { getProgression } = require("../services/gamificationService");

const router = express.Router();

function ensureNgo(req, res, next) {
  if (req.user?.role !== "ngo") return res.status(403).json({ error: "NGO access required" });
  return next();
}

router.get("/settings", async (req, res) => {
  try {
    const settings = await SiteSettings.findOneAndUpdate(
      { key: "global" },
      { $setOnInsert: { key: "global" } },
      { new: true, upsert: true }
    );
    return res.json(settings);
  } catch (err) {
    return res.status(500).json({ error: "Unable to load settings" });
  }
});

router.get("/ngo-site/:slug", async (req, res) => {
  try {
    const ngo = await NGO.findOne({
      $or: [{ slug: req.params.slug }, { _id: req.params.slug }],
      verified: true,
    }).select("-password");
    if (!ngo) return res.status(404).json({ error: "Approved NGO site not found" });

    const donations = await Donation.find({ ngo: ngo._id, status: { $in: ["completed", "verified"] } })
      .populate("cause", "title")
      .sort({ updatedAt: -1 })
      .limit(20);

    return res.json({ ngo, tasks: donations, updates: ngo.updates || [] });
  } catch (err) {
    return res.status(500).json({ error: "Unable to load NGO site" });
  }
});

router.get("/ngo/me", authMiddleware, ensureNgo, async (req, res) => {
  try {
    const ngo = await NGO.findById(req.user.id).select("-password");
    if (!ngo) return res.status(404).json({ error: "NGO profile not found" });
    return res.json({ ngo, tasks: ngo.updates || [] });
  } catch (err) {
    return res.status(500).json({ error: "Unable to load NGO dashboard" });
  }
});

router.patch("/ngo/me", authMiddleware, ensureNgo, async (req, res) => {
  try {
    const update = {};
    if (req.body.name !== undefined) update.name = req.body.name;
    if (req.body.location !== undefined) update.location = req.body.location;
    if (req.body.description !== undefined) update.description = req.body.description;
    if (req.body.motive !== undefined) update.about = req.body.motive;
    if (req.body.logoUrl !== undefined) update.logo = req.body.logoUrl;
    if (req.body.bannerUrl !== undefined) update.banner = req.body.bannerUrl;
    if (req.body.website !== undefined) update["contact.website"] = req.body.website;
    if (req.body.phone !== undefined) update["contact.phone"] = req.body.phone;

    const ngo = await NGO.findByIdAndUpdate(req.user.id, update, { new: true }).select("-password");
    if (!ngo) return res.status(404).json({ error: "NGO profile not found" });
    return res.json({ message: "NGO profile updated", ngo });
  } catch (err) {
    return res.status(400).json({ error: "Unable to update NGO profile" });
  }
});

router.post("/ngo/tasks", authMiddleware, ensureNgo, async (req, res) => {
  try {
    const ngo = await NGO.findById(req.user.id);
    if (!ngo) return res.status(404).json({ error: "NGO profile not found" });
    if (!ngo.verified) return res.status(403).json({ error: "Admin approval is required before submitting work" });

    ngo.updates.push({
      title: req.body.title,
      note: req.body.description,
      proofUrl: req.body.proofUrl,
    });
    await ngo.save();
    return res.status(201).json({ message: "Work update published", task: ngo.updates[ngo.updates.length - 1] });
  } catch (err) {
    return res.status(400).json({ error: "Unable to submit work" });
  }
});

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

function categoryKeywords(category) {
  return {
    meals: ["meal", "food", "hunger", "kitchen"],
    trees: ["tree", "environment", "green", "plant"],
    essentials: ["essential", "relief", "emergency", "hygiene"],
    "ngo-support": ["ngo", "community", "support", "operation"],
  }[category] || [category];
}

async function selectApprovedNgoForCategory(category) {
  const ngos = await NGO.find({ verified: true }).sort({ impactScore: -1, tasksCompleted: -1, createdAt: 1 });
  if (!ngos.length) return null;
  const keywords = categoryKeywords(category);
  return ngos.find((ngo) => {
    const haystack = `${ngo.areaOfWork || ""} ${ngo.description || ""} ${ngo.about || ""}`.toLowerCase();
    return keywords.some((keyword) => haystack.includes(keyword));
  }) || ngos[0];
}

async function getOrCreateSystemNgo() {
  let systemNgo = await NGO.findOne({ slug: "resence-foundation" });
  if (!systemNgo) {
    const bcrypt = require("bcryptjs");
    const hashed = await bcrypt.hash("Resence123!", 10);
    systemNgo = await NGO.create({
      name: "Resence Foundation",
      email: "foundation@resence.in",
      password: hashed,
      regNumber: "MOCK-12345-RESENCE",
      taxStatus: "Both",
      areaOfWork: "All Causes",
      slug: "resence-foundation",
      description: "Default platform placeholder foundation for fallback transparent donations.",
      about: "Resence Foundation facilitates micro-donations across India when other grassroots NGO partners are unavailable.",
      verified: true,
      verifiedAt: new Date(),
      rating: 5.0,
      impactScore: 100,
      tasksCompleted: 5,
    });
    console.log("[seed] Created system fallback NGO: Resence Foundation");
  } else if (!systemNgo.verified) {
    systemNgo.verified = true;
    systemNgo.verifiedAt = new Date();
    await systemNgo.save();
  }
  return systemNgo;
}

async function ensureCategoryCause(category) {
  const core = CORE_CAUSES.find((item) => item.category === category);
  if (!core) return null;

  let verifiedNgoIds = await NGO.find({ verified: true }).distinct("_id");
  if (!verifiedNgoIds.length) {
    const fallbackNgo = await getOrCreateSystemNgo();
    verifiedNgoIds = [fallbackNgo._id];
  }

  const existing = await Cause.findOne({ category, active: true, assignedNgo: { $in: verifiedNgoIds } })
    .populate("assignedNgo", "verified name");
  if (existing) return existing;

  const ngo = await selectApprovedNgoForCategory(category) || await getOrCreateSystemNgo();
  if (!ngo) return null;

  return Cause.create({
    title: core.title,
    description: core.description,
    icon: core.icon,
    category: core.category,
    goal: 0,
    impactPerRupee: core.impactPerRupee,
    assignedNgo: ngo._id,
    active: true,
  }).then((cause) => cause.populate("assignedNgo", "verified name"));
}

async function getPayableCause(causeId) {
  const coreCategory = CORE_CAUSES.find((item) => item.category === causeId);
  if (coreCategory) return ensureCategoryCause(coreCategory.category);

  const cause = await Cause.findOne({ _id: causeId, active: true }).populate("assignedNgo", "verified name");
  if (!cause || !cause.active || !cause.assignedNgo || !cause.assignedNgo.verified) return null;
  return cause;
}

async function applyPaidDonation({ userId, cause, amount, paymentOrderId = "", paymentId = "", paymentSignature = "", communityId = null }) {
  if (paymentId) {
    const existing = await Donation.findOne({ paymentId });
    if (existing) return existing;
  }

  const donation = await Donation.create({
    user: userId,
    cause: cause._id,
    ngo: cause.assignedNgo,
    amount,
    xpEarned: amount,
    status: "completed",
    paymentProvider: paymentId ? "razorpay" : "",
    paymentOrderId,
    paymentId,
    paymentSignature,
    location: cause.location || "",
    community: communityId || undefined,
  });

  await Cause.findByIdAndUpdate(cause._id, { $inc: { raised: amount, contributors: 1 } });

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  user.totalDonated += amount;
  user.donationCount += 1;
  user.xp += amount;
  user.lastDonation = new Date();
  if (user.donationCount === 1 && !user.badges.includes("First Donation")) user.badges.push("First Donation");
  if (user.donationCount >= 10 && !user.badges.includes("Consistent Giver")) user.badges.push("Consistent Giver");
  if (user.donationCount >= 100 && !user.badges.includes("Century Club")) user.badges.push("Century Club");
  if (user.xp >= 5000 && !user.badges.includes("Impact Creator")) user.badges.push("Impact Creator");
  await user.save();

  await NGO.findByIdAndUpdate(cause.assignedNgo, { $inc: { totalReceived: amount } });

  if (communityId) {
    const community = await Community.findById(communityId);
    if (community) {
      community.totalRaised += amount;
      if (!community.supportedNgos.includes(cause.assignedNgo)) {
        community.supportedNgos.push(cause.assignedNgo);
      }
      community.impactScore = Math.floor(community.totalRaised * 0.1 + community.members.length * 10 + community.supportedNgos.length * 100);
      await community.save();
    }
  }

  return donation;
}

// ════════════════════════════════════════════════════════════════════════════
//  CAUSES
// ════════════════════════════════════════════════════════════════════════════

// GET /api/causes  — all active causes (for homepage cards)
router.get("/causes", async (req, res) => {
  try {
    const causes = await Cause.find({ active: true })
      .populate("assignedNgo", "name verified rating")
      .sort({ raised: -1 });
    res.json(causes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/causes/:id
router.get("/causes/:id", async (req, res) => {
  try {
    const cause = await Cause.findById(req.params.id)
      .populate("assignedNgo", "name verified rating tasksCompleted");
    if (!cause) return res.status(404).json({ error: "Cause not found" });
    res.json(cause);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  DONATIONS
// ════════════════════════════════════════════════════════════════════════════

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

    const cause = await getPayableCause(causeId);
    if (!cause) {
      return res.status(404).json({ error: "This cause is not available until an approved NGO is assigned" });
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
        causeId: String(cause._id),
        userId: String(req.user.id),
        ngoId: String(cause.assignedNgo._id),
      },
    });

    return res.json({
      keyId: config.keyId,
      orderId: order.id,
      amount: safeAmount,
      currency: "INR",
      cause: { id: cause._id, title: cause.title, ngo: cause.assignedNgo.name },
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
    if (!["authorized", "captured"].includes(payment.status)) {
      return res.status(400).json({ error: "Payment is not successful yet" });
    }

    const cause = await getPayableCause(causeId);
    if (!cause) {
      return res.status(404).json({ error: "This cause is not available until an approved NGO is assigned" });
    }

    const donation = await applyPaidDonation({
      userId: req.user.id,
      cause,
      amount: safeAmount,
      paymentOrderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      paymentSignature: razorpay_signature,
      communityId: communityId || null,
    });

    const user = await User.findById(req.user.id);
    const progression = getProgression(user.xp);
    return res.status(201).json({
      message: "Payment verified and donation recorded",
      donation: { id: donation._id, amount: donation.amount, status: donation.status, xpEarned: donation.xpEarned },
      user: {
        xp: user.xp,
        level: user.level,
        title: user.title,
        progression,
        badges: user.badges,
        totalDonated: user.totalDonated,
        donationCount: user.donationCount,
      },
    });
  } catch (err) {
    console.error("[payments] Verification failed:", err.message);
    res.status(500).json({ error: "Unable to verify payment" });
  }
});

// POST /api/donate - disabled so donations cannot bypass verified payment
router.post("/donate", authMiddleware, async (req, res) => {
  return res.status(410).json({ error: "Use Razorpay checkout. Direct donation recording is disabled." });
});

// GET /api/donations/history  — user's own donation history
router.get("/donations/history", authMiddleware, async (req, res) => {
  try {
    const donations = await Donation.find({ user: req.user.id })
      .populate("cause", "title icon category")
      .populate("ngo", "name location")
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// ════════════════════════════════════════════════════════════════════════════
//  TRANSPARENCY LOG
// ════════════════════════════════════════════════════════════════════════════

// GET /api/transparency  — public feed of all completed works
router.get("/transparency", async (req, res) => {
  try {
    const { cause, ngo, page = 1, limit = 10 } = req.query;
    const [verifiedNgoIds, verifiedDonationIds] = await Promise.all([
      NGO.find({ verified: true }).distinct("_id"),
      Donation.find({ status: "verified", proofVideo: { $nin: ["", null] } }).distinct("_id"),
    ]);
    const filter = {
      ngo: { $in: verifiedNgoIds },
      donation: { $in: verifiedDonationIds },
      proofVideo: { $nin: ["", null] },
    };
    if (cause) filter.cause = cause;
    if (ngo)   filter.ngo   = ngo;

    const logs = await Transparency.find(filter)
      .populate("ngo",   "name location verified rating")
      .populate("cause", "title icon category")
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Transparency.countDocuments(filter);
    res.json({ logs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  NGO PUBLIC DIRECTORY
// ════════════════════════════════════════════════════════════════════════════

// GET /api/ngos  — list verified NGOs sorted by rank
router.get("/ngos", async (req, res) => {
  try {
    const ngos = await NGO.find({ verified: true })
      .select("-password -volunteers")
      .sort({ impactScore: -1 });
    res.json(ngos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ngos/:id
router.get("/ngos/:id", async (req, res) => {
  try {
    const ngo = await NGO.findById(req.params.id).select("-password");
    if (!ngo || !ngo.verified)
      return res.status(404).json({ error: "NGO not found" });

    // Get recent transparency logs for this NGO
    const logs = await Transparency.find({ ngo: req.params.id })
      .populate("cause", "title icon")
      .sort({ date: -1 })
      .limit(5);

    res.json({ ngo, recentWork: logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/ngo/:id", async (req, res) => {
  try {
    const ngo = await NGO.findById(req.params.id).select("-password");
    if (!ngo || !ngo.verified)
      return res.status(404).json({ error: "NGO not found" });

    const logs = await Transparency.find({ ngo: req.params.id })
      .populate("cause", "title icon")
      .sort({ date: -1 })
      .limit(5);

    res.json({ ngo, recentWork: logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  LEADERBOARD
// ════════════════════════════════════════════════════════════════════════════

// GET /api/leaderboard/donors
router.get("/leaderboard/donors", async (req, res) => {
  try {
    const donors = await User.find({ donationCount: { $gt: 0 } })
      .select("name xp level title donationCount totalDonated badges avatar bio")
      .sort({ totalDonated: -1, xp: -1, donationCount: -1 })
      .limit(100);
    res.json(donors.map((donor) => {
      const item = donor.toObject();
      item.progression = getProgression(item.xp);
      return item;
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leaderboard/ngos
router.get("/leaderboard/ngos", async (req, res) => {
  try {
    const ngos = await NGO.find({ verified: true })
      .select("name impactScore tasksCompleted rating onTimeRate areaOfWork location")
      .sort({ impactScore: -1 })
      .limit(100);
    res.json(ngos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// ════════════════════════════════════════════════════════════════════════════
//  USER DASHBOARD
// ════════════════════════════════════════════════════════════════════════════

// GET /api/dashboard  — full dashboard data for logged-in user
router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    const donations = await Donation.find({ user: req.user.id })
      .populate("cause", "title icon category")
      .populate("ngo", "name location")
      .sort({ createdAt: -1 })
      .limit(10);

    const progression = getProgression(user.xp);

    res.json({
      user,
      recentDonations: donations,
      progression,
      nextLevelXp: progression.nextLevelXp,
      xpProgress: progression.progress
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    const payload = user.toObject();
    payload.progression = getProgression(payload.xp);
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/profile", authMiddleware, async (req, res) => {
  try {
    const updates = {};
    if (typeof req.body.bio === "string") updates.bio = req.body.bio.slice(0, 500);
    if (typeof req.body.avatar === "string") updates.avatar = req.body.avatar.slice(0, 1000);

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    const payload = user.toObject();
    payload.progression = getProgression(payload.xp);
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/ngos/:id/volunteers", authMiddleware, async (req, res) => {
  try {
    const ngo = await NGO.findById(req.params.id);
    const user = await User.findById(req.user.id);
    if (!ngo || !ngo.verified) return res.status(404).json({ error: "NGO not found" });
    if (!user) return res.status(404).json({ error: "User not found" });

    const existing = ngo.volunteers.find((volunteer) => String(volunteer.user) === String(user._id));
    if (existing) return res.status(409).json({ error: "Volunteer request already exists" });

    ngo.volunteers.push({
      user: user._id,
      name: user.name,
      email: user.email,
      phone: req.body.phone || "",
      status: "requested",
      title: "Volunteer",
    });
    user.volunteerActivity.push({ ngo: ngo._id, status: "requested", title: "Volunteer" });

    await Promise.all([ngo.save(), user.save()]);
    res.status(201).json({ message: "Volunteer request sent", status: "requested" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  CONTACT
// ════════════════════════════════════════════════════════════════════════════

// POST /api/contact
router.post("/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message)
      return res.status(400).json({ error: "All fields required" });
    await Contact.create({ name, email, message });
    res.json({ message: "Message sent! We will respond within 24 hours." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  STATS (for hero section)
// ════════════════════════════════════════════════════════════════════════════

// GET /api/stats
router.get("/stats", async (req, res) => {
  try {
    const [totalDonated, verifiedTasks, verifiedNGOs, totalDonations] =
      await Promise.all([
        Donation.aggregate([{ $match: { status: { $in: ["completed", "verified"] } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
        Transparency.countDocuments({ proofVideo: { $nin: ["", null] } }),
        NGO.countDocuments({ verified: true }),
        Donation.countDocuments({ status: { $in: ["completed", "verified"] } })
      ]);

    res.json({
      totalDonated:  totalDonated[0]?.total || 0,
      verifiedTasks,
      verifiedNGOs,
      totalDonations
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/ai/advisor", async (req, res) => {
  try {
    const { amount, category, goal } = req.body;
    if (!amount || !category) {
      return res.status(400).json({ error: "Amount and category are required." });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "Invalid monthly amount. Must be a positive number." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[ai-advisor] GEMINI_API_KEY environment variable is not set. Falling back to local rules-based generator.");
      
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
      if (goal) {
        planText += ` Specifically, your support can assist towards your goal of: "${goal}".`;
      }
      planText += `\n\nEvery contribution matters. Small Contributions, Big Impact.`;
      
      return res.json({ plan: planText });
    }

    const prompt = `You are the ServeMATE AI Impact Advisor, a positive, motivating, and encouraging virtual coach for micro-donations in India.
Explain how a monthly contribution of ₹${numericAmount} per month can create a meaningful impact in the cause category of "${category}".
${goal ? `The user's specific impact goal is: "${goal}". Please reference this goal naturally and encouragingly.` : ''}

Strict Guidelines:
1. Be positive, motivating, and easy to understand.
2. Calculate the 12-month total contribution: 12 * ₹${numericAmount} = ₹${12 * numericAmount}. Explain what this annual amount can realistically help support in the context of "${category}".
3. Avoid unrealistic promises, never guarantee exact impact (e.g. use terms like "can help support", "could reach", "provides resources for"), focus on encouragement and awareness.
4. Keep the response concise, about 80-120 words (around 3 to 4 sentences).
5. Conclude with the phrase: "Every contribution matters. Small Contributions, Big Impact."`;

    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 250
        }
      })
    });

    const data = await apiResponse.json();
    if (!apiResponse.ok) {
      console.error("[ai-advisor] Gemini API Error Response:", data);
      throw new Error(data.error?.message || "Gemini API request failed.");
    }

    const plan = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!plan) {
      throw new Error("No response generated by the AI model.");
    }

    return res.json({ plan: plan.trim() });
  } catch (err) {
    console.error("[ai-advisor] Error generating impact plan:", err.message);
    return res.status(500).json({ error: "Unable to generate impact plan. Please try again later." });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  COMMUNITIES
// ════════════════════════════════════════════════════════════════════════════

router.post("/communities", authMiddleware, async (req, res) => {
  try {
    const { name, description, logo, category } = req.body;
    if (!name || !description || !category) {
      return res.status(400).json({ error: "Name, description, and category are required" });
    }
    let code;
    let codeExists = true;
    while (codeExists) {
      code = crypto.randomBytes(3).toString("hex").toUpperCase();
      const existing = await Community.findOne({ code });
      if (!existing) codeExists = false;
    }

    const community = await Community.create({
      name,
      description,
      logo: logo || "",
      code,
      category,
      creator: req.user.id,
      members: [req.user.id],
      totalRaised: 0,
      impactScore: 10,
    });

    await User.findByIdAndUpdate(req.user.id, { $addToSet: { communities: community._id } });

    res.status(201).json(community);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "A community with this name already exists." });
    }
    res.status(500).json({ error: err.message });
  }
});

router.get("/communities", async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { code: search.toUpperCase() }
      ];
    }
    const communities = await Community.find(filter)
      .populate("creator", "name")
      .sort({ totalRaised: -1, impactScore: -1 });
    res.json(communities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/communities/join", authMiddleware, async (req, res) => {
  try {
    const { code, communityId } = req.body;
    if (!code && !communityId) {
      return res.status(400).json({ error: "Community code or ID is required" });
    }

    const filter = {};
    if (communityId) filter._id = communityId;
    else filter.code = code.toUpperCase().trim();

    const community = await Community.findOne(filter);
    if (!community) {
      return res.status(444).json({ error: "Community not found with this code or ID" });
    }

    if (community.members.includes(req.user.id)) {
      return res.status(409).json({ error: "You are already a member of this community" });
    }

    community.members.push(req.user.id);
    community.impactScore = Math.floor(community.totalRaised * 0.1 + community.members.length * 10 + community.supportedNgos.length * 100);
    await community.save();

    await User.findByIdAndUpdate(req.user.id, { $addToSet: { communities: community._id } });

    res.json({ message: "Successfully joined the community", community });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/communities/:id", async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate("creator", "name email")
      .populate("members", "name xp level title avatar")
      .populate("supportedNgos", "name location verified logo areaOfWork");
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    const allCommunities = await Community.find().sort({ totalRaised: -1, impactScore: -1 });
    const rank = allCommunities.findIndex(c => String(c._id) === String(community._id)) + 1;

    const donations = await Donation.find({ community: community._id, status: { $in: ["completed", "verified"] } })
      .populate("user", "name")
      .populate("cause", "title icon")
      .sort({ createdAt: -1 })
      .limit(10);

    const verificationVideos = await Donation.find({ community: community._id, status: "verified", proofVideo: { $nin: ["", null] } })
      .populate("cause", "title")
      .populate("ngo", "name")
      .select("proofVideo proofNote amount cause ngo verifiedAt");

    res.json({
      community,
      rank,
      activity: donations,
      verificationVideos
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/leaderboard/communities", async (req, res) => {
  try {
    const communities = await Community.find()
      .populate("creator", "name")
      .sort({ impactScore: -1, totalRaised: -1 })
      .limit(100);
    res.json(communities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  AI ASSISTANT ENHANCEMENTS
// ════════════════════════════════════════════════════════════════════════════

router.get("/ai/recommendations", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const donations = await Donation.find({ user: req.user.id }).populate("cause");
    
    const categoriesSupported = donations.map(d => d.cause?.category).filter(Boolean);
    const primaryCategory = categoriesSupported.length > 0 
      ? categoriesSupported.sort((a,b) => categoriesSupported.filter(v => v===a).length - categoriesSupported.filter(v => v===b).length).pop()
      : null;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const allCauses = await Cause.find({ active: true }).populate("assignedNgo", "name verified");
      
      let recommendation;
      if (primaryCategory) {
        recommendation = allCauses.find(c => c.category !== primaryCategory) || allCauses[0];
      } else {
        recommendation = allCauses.find(c => c.category === "education") || allCauses[0];
      }

      const reason = primaryCategory 
        ? `Since you have supported "${primaryCategory}" in the past, we recommend diversifying your impact by supporting "${recommendation?.title || "other initiatives"}" today to help balance community resources.`
        : `As a new changemaker, we recommend starting with "${recommendation?.title || "Education"}" to help children build a brighter future through learning.`;

      return res.json({
        recommendation,
        reason
      });
    }

    const allCauses = await Cause.find({ active: true });
    const prompt = `You are the ServeMATE AI Impact Advisor.
A user wants cause recommendations.
Their donation history contains: ${donations.map(d => `₹${d.amount} on ${d.cause?.title} (${d.cause?.category})`).join(", ") || "No history yet"}.
Available causes currently on the platform: ${allCauses.map(c => `ID: ${c._id}, Title: ${c.title}, Category: ${c.category}, Description: ${c.description}`).join("; ")}.

Select ONE cause ID from the list that would be best for them (recommend diversifying if they have a history, or select an introductory cause if new).
Provide a brief, motivating, and personalized 1-2 sentence reason why you chose this cause for them.
Format your response as a valid JSON object:
{
  "causeId": "the_mongo_id_of_the_chosen_cause",
  "reason": "personalized reason here"
}`;

    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 250,
          responseMimeType: "application/json"
        }
      })
    });

    const data = await apiResponse.json();
    if (!apiResponse.ok) throw new Error(data.error?.message || "Gemini API failed");

    const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const recommendation = JSON.parse(jsonText.trim());

    const chosenCause = await Cause.findById(recommendation.causeId).populate("assignedNgo", "name verified");
    if (!chosenCause) {
      throw new Error("Chosen cause not found");
    }

    res.json({
      recommendation: chosenCause,
      reason: recommendation.reason
    });
  } catch (err) {
    console.error("[ai-rec] Fallback triggered:", err.message);
    const allCauses = await Cause.find({ active: true }).populate("assignedNgo", "name verified");
    res.json({
      recommendation: allCauses[0],
      reason: "Start your journey today with our highlighted community cause and make a difference."
    });
  }
});

router.get("/ai/community-insights", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const communities = await Community.find().sort({ totalRaised: -1 }).limit(10);
    const donationsCount = await Donation.countDocuments({ status: { $in: ["completed", "verified"] } });

    if (!apiKey) {
      let insightText = `Student communities are leading the charge! College Clubs like "${communities[0]?.name || "GL Bajaj Clubs"}" represent the most active category on ServeMATE, contributing over 55% of all community-raised funds. Friend circles are also showing quick growth in environment drives. Total community acts recorded: ${donationsCount}.`;
      return res.json({ insights: insightText });
    }

    const prompt = `You are the ServeMATE AI Community Analyst.
Summarize the current social impact trends among Indian student communities.
Current top active communities: ${communities.map(c => `${c.name} (${c.category}): ₹${c.totalRaised} raised, ${c.members.length} members`).join("; ")}.
Total platform contributions count: ${donationsCount}.
Keep it positive, professional, SaaS-styled (like Notion/Linear updates), under 70 words, and focus on highlighting community collaboration and high-performing categories. Do not mention exact numbers unless relevant.`;

    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 150
        }
      })
    });

    const data = await apiResponse.json();
    if (!apiResponse.ok) throw new Error("Gemini API failed");

    const insights = data.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json({ insights: insights.trim() });
  } catch (err) {
    console.error("[ai-insights] Fallback triggered:", err.message);
    res.json({ insights: "College Club communities are currently leading the national leaderboard, showing high mobilization in local green plantation and nutrition drives." });
  }
});

router.get("/ai/impact-summary", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const donations = await Donation.find({ user: req.user.id }).populate("cause").populate("ngo");
    
    if (!donations.length) {
      return res.json({ summary: "No contribution data found yet. Complete your first micro-donation to generate a personalized impact summary report!" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      let sumText = `Monthly Impact Report for ${user.name || "Changemaker"}:\n\n`;
      sumText += `You have supported ${donations.length} verified projects, contributing a total of ₹${user.totalDonated.toLocaleString('en-IN')}.\n`;
      sumText += `Your current XP stands at ${user.xp} XP (Level ${user.level}). Thank you for powering social change!`;
      return res.json({ summary: sumText });
    }

    const prompt = `You are the ServeMATE Impact Coach.
Generate a monthly personalized impact summary report for this user.
User Name: ${user.name}
Total Donated: ₹${user.totalDonated}
Total Donations: ${user.donationCount}
XP: ${user.xp}
Level: ${user.level} (Title: ${user.title})
Donation Details: ${donations.map(d => `₹${d.amount} to ${d.cause?.title} via ${d.ngo?.name || "NGO"} (status: ${d.status})`).join("; ")}.

Draft a highly motivational, positive, and direct personal report summarizing what they achieved. Use a bulleted layout for key achievements. Keep it around 100-140 words, very warm and professional.`;

    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 250
        }
      })
    });

    const data = await apiResponse.json();
    if (!apiResponse.ok) throw new Error("Gemini API failed");

    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json({ summary: summary.trim() });
  } catch (err) {
  }
});

// NGO Review Volunteer
router.patch("/admin/ngos/volunteers/:userId", authMiddleware, ensureNgo, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const ngo = await NGO.findById(req.user.id);
    if (!ngo) return res.status(404).json({ error: "NGO profile not found" });

    const volunteer = ngo.volunteers.find(v => String(v.user) === String(req.params.userId));
    if (!volunteer) return res.status(444).json({ error: "Volunteer request not found" });

    volunteer.status = status;
    volunteer.reviewedAt = new Date();
    
    if (status === "approved") {
      ngo.volunteerCount = (ngo.volunteerCount || 0) + 1;
    }
    
    await ngo.save();

    const user = await User.findById(req.params.userId);
    if (user) {
      const activity = user.volunteerActivity.find(a => String(a.ngo) === String(ngo._id));
      if (activity) {
        activity.status = status;
        await user.save();
      }
    }

    res.json({ message: `Volunteer request ${status}`, volunteer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
