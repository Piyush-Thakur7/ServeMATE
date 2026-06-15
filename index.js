require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const { ADMIN_EMAIL } = require("./authUtils");
const { router: authRouter } = require("./authRoutes");
const apiRouter = require("./apiRoutes");
const adminRouter = require("./adminRoutes");
const { apiLimiter } = require("./src/middleware/rateLimit");

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5000;

const defaultCorsOrigins = [
  "https://www.resence.in",
  "https://resence.in",
  "https://serve-matemobile.vercel.app",
];

const allowedOrigins = (process.env.CORS_ORIGINS || defaultCorsOrigins.join(","))
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/api", apiLimiter);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    version: "v3-premium-causes-seeded",
    time: new Date().toISOString(),
  });
});

app.use("/api", (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  return res.status(503).json({
    error: "Database unavailable",
    message: "The backend is running, but MongoDB is not connected.",
  });
});

app.use("/api/auth", authRouter);
app.use("/api", apiRouter);
app.use("/api/admin", adminRouter);

app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send([
    "User-agent: *",
    "Allow: /",
    "Sitemap: https://resence.in/sitemap.xml",
  ].join("\n"));
});

app.get("/sitemap.xml", (req, res) => {
  return res.sendFile(path.join(__dirname, "sitemap.xml"));
});

app.get("/admin", (req, res) => {
  return res.sendFile(path.join(__dirname, "admin.html"));
});



app.use((req, res, next) => {
  if (req.method !== "GET") {
    return next();
  }
  const host = req.hostname.toLowerCase();
  if (host.startsWith("admin.")) {
    return res.sendFile(path.join(__dirname, "admin.html"));
  }
  return res.sendFile(path.join(__dirname, "index.html"));
});

app.use((err, req, res, next) => {
  console.error("[server] Unhandled request error:", err.message);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(500).json({ error: "Internal server error" });
});

async function connectMongo() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn("[mongo] MONGO_URI or MONGODB_URI is not set. Server will start without database connectivity.");
    return;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 10000,
      maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 10,
    });
    console.log("[mongo] Connected to MongoDB");
    
    // Dynamic Index Audit & Cleanup to prevent E11000 duplicate key errors on old removed schema fields
    try {
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      const hasUsers = collections.some(c => c.name === 'users');
      if (hasUsers) {
        console.log("[mongo] Auditing users collection indexes...");
        const indexes = await db.collection('users').indexes();
        console.log("[mongo] Current indexes:", indexes.map(i => i.name));
        for (const idx of indexes) {
          if (idx.name !== '_id_' && idx.name !== 'email_1' && idx.name !== 'email_1_lowercase_1') {
            console.log(`[mongo] Dropping legacy unique index: ${idx.name}`);
            await db.collection('users').dropIndex(idx.name).catch(() => {});
          }
        }
      }
    } catch (idxErr) {
      console.warn("[mongo] Index auditing skipped or failed:", idxErr.message);
    }

    await seedDatabase();
  } catch (err) {
    console.error("[mongo] Initial connection failed:", err.message);
  }
}

mongoose.connection.on("disconnected", () => {
  console.warn("[mongo] MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("[mongo] MongoDB reconnected");
});

async function seedDatabase() {
  const { User, NGO, Cause } = require("./models");
  const bcrypt = require("bcryptjs");

  const adminExists = await User.findOne({ email: ADMIN_EMAIL });
  if (!adminExists) {
    if (!process.env.ADMIN_PASSWORD) {
      console.warn(
        `[seed] ADMIN_PASSWORD is not set. Admin user ${ADMIN_EMAIL} was not auto-created.`
      );
    } else {
      const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      await User.create({
        name: "Admin",
        email: ADMIN_EMAIL,
        password: hashed,
        role: "admin",
      });
      console.log(`[seed] Admin user created: ${ADMIN_EMAIL}`);
    }
  } else if (adminExists.role !== "admin") {
    console.warn(
      `[seed] ${ADMIN_EMAIL} exists but is not an admin. Update this user role manually before using admin APIs.`
    );
  }

  // 1. Seed the 3 mock NGOs
  const ngoData = [
    {
      name: "Resence Foundation",
      email: "foundation@resence.in",
      password: "Resence123!",
      regNumber: "MOCK-12345-RESENCE",
      taxStatus: "Both",
      areaOfWork: "All Causes",
      slug: "resence-foundation",
      description: "Default platform partner foundation facilitating micro-donations across India.",
      about: "Resence Foundation connects student groups with grassroots transparency-driven charity actions.",
      location: "New Delhi, Delhi",
      verified: true,
      verifiedAt: new Date(),
      rating: 4.9,
      impactScore: 4200,
      tasksCompleted: 15,
      volunteerCount: 8,
      logo: "https://images.unsplash.com/photo-1579208575657-c595a05383b7?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Green India Trust",
      email: "green@india.org",
      password: "Green123!",
      regNumber: "MOCK-9999-GREEN",
      taxStatus: "Both",
      areaOfWork: "Environment & Trees",
      slug: "green-india-trust",
      description: "Dedicated to tree planting, animal care, and environmental cleanups across India.",
      about: "Green India Trust mobilizes volunteers to restore ecosystems and nurture street animals.",
      location: "Bengaluru, Karnataka",
      verified: true,
      verifiedAt: new Date(),
      rating: 4.8,
      impactScore: 3500,
      tasksCompleted: 12,
      volunteerCount: 6,
      logo: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "HelpAge India",
      email: "help@helpage.org",
      password: "Help123!",
      regNumber: "MOCK-8888-HELP",
      taxStatus: "Both",
      areaOfWork: "Healthcare & Education",
      slug: "helpage-india",
      description: "Providing life-saving healthcare and primary learning support for underprivileged families.",
      about: "HelpAge India provides medical assistance, tuition clinics, and disaster support packs.",
      location: "Mumbai, Maharashtra",
      verified: true,
      verifiedAt: new Date(),
      rating: 4.9,
      impactScore: 4800,
      tasksCompleted: 18,
      volunteerCount: 11,
      logo: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=150&auto=format&fit=crop&q=80",
    }
  ];

  const ngos = {};
  for (const info of ngoData) {
    let ngo = await NGO.findOne({ email: info.email });
    if (!ngo) {
      const hashed = await bcrypt.hash(info.password, 10);
      ngo = await NGO.create({
        ...info,
        password: hashed
      });
      console.log(`[seed] Created NGO: ${info.name}`);
    } else {
      if (!ngo.verified) {
        ngo.verified = true;
        ngo.verifiedAt = new Date();
        await ngo.save();
      }
    }
    ngos[info.slug] = ngo._id;
  }

  // 2. Seed the 12 premium causes
  const causeData = [
    {
      title: "Digital Learning for Rural Students",
      description: "Equip village schools with modern digital tablets, internet connectivity, and interactive educational content.",
      category: "education",
      goal: 1000000,
      impactPerRupee: "₹500 = 1 Digital Study Kit for a student",
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=80",
      icon: "📚",
      assignedNgoSlug: "resence-foundation"
    },
    {
      title: "Primary School Tuition Clinic",
      description: "Support after-school learning centers providing free tuition, notebooks, and pencils to slum children.",
      category: "education",
      goal: 300000,
      impactPerRupee: "₹250 = 1 month of tuition class support",
      image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80",
      icon: "✏️",
      assignedNgoSlug: "helpage-india"
    },
    {
      title: "Medical Support for Underprivileged Families",
      description: "Fund essential operations, chronic illnesses treatment, and doctor fees for low-income households.",
      category: "healthcare",
      goal: 1000000,
      impactPerRupee: "₹1000 = 1 life-saving medical consultation",
      image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&auto=format&fit=crop&q=80",
      icon: "🏥",
      assignedNgoSlug: "helpage-india"
    },
    {
      title: "Mobile Health Camps in Remote Villages",
      description: "Deploy mobile vans with doctors, nurses, and free medicines to remote, healthcare-deprived areas.",
      category: "healthcare",
      goal: 1200000,
      impactPerRupee: "₹200 = 1 basic health checkup & medicine pack",
      image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80",
      icon: "🚐",
      assignedNgoSlug: "resence-foundation"
    },
    {
      title: "10000 Meals Initiative",
      description: "Cook and deliver hygienic, fresh, nutritious warm meals to daily wage laborers and homeless shelters.",
      category: "food",
      goal: 1000000,
      impactPerRupee: "₹20 = 1 hot nutritious meal served",
      image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&auto=format&fit=crop&q=80",
      icon: "🍲",
      assignedNgoSlug: "green-india-trust"
    },
    {
      title: "Feed the Homeless Daily Drive",
      description: "Provide monthly grocery survival kits (rice, pulses, oil, spices) to families living under flyovers.",
      category: "food",
      goal: 150000,
      impactPerRupee: "₹300 = 1 grocery kit containing basic dry rations",
      image: "https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=600&auto=format&fit=crop&q=80",
      icon: "🍛",
      assignedNgoSlug: "resence-foundation"
    },
    {
      title: "Plant 50000 Trees Mission",
      description: "Plant native tree saplings across deforested urban and rural zones to fight air pollution and heatwaves.",
      category: "environment",
      goal: 1000000,
      impactPerRupee: "₹50 = 1 native tree sapling planted & nurtured",
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80",
      icon: "🌳",
      assignedNgoSlug: "green-india-trust"
    },
    {
      title: "Urban Green Spaces Development",
      description: "Restore dried lakes and construct green community micro-forests to restore local bio-diversity.",
      category: "environment",
      goal: 600000,
      impactPerRupee: "₹100 = 1 sq ft of community green cover created",
      image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&auto=format&fit=crop&q=80",
      icon: "🌱",
      assignedNgoSlug: "green-india-trust"
    },
    {
      title: "School Kit Distribution Program",
      description: "Distribute premium school bags containing books, stationery, and steel water bottles to school kids.",
      category: "children",
      goal: 400000,
      impactPerRupee: "₹350 = 1 complete school bag & kit distributed",
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=80",
      icon: "🎒",
      assignedNgoSlug: "resence-foundation"
    },
    {
      title: "Women's Skill Development Initiative",
      description: "Empower women through professional vocational training in sewing, handicrafts, and computer basics.",
      category: "women-empowerment",
      goal: 600000,
      impactPerRupee: "₹1500 = 1 week of professional vocational training",
      image: "https://images.unsplash.com/photo-1579208575657-c595a05383b7?w=600&auto=format&fit=crop&q=80",
      icon: "👩",
      assignedNgoSlug: "helpage-india"
    },
    {
      title: "Street Animal Care Program",
      description: "Provide ambulance support, vaccination, and food to injured street dogs, cats, and rescue shelters.",
      category: "animal-welfare",
      goal: 250000,
      impactPerRupee: "₹150 = 1 street animal vaccinated and fed",
      image: "https://images.unsplash.com/photo-1548824226-f50f926ff5ba?w=600&auto=format&fit=crop&q=80",
      icon: "🐾",
      assignedNgoSlug: "green-india-trust"
    },
    {
      title: "Emergency Flood Support",
      description: "Distribute emergency survival packs containing tarpaulins, dry foods, water purification tablets, and first aid.",
      category: "disaster-relief",
      goal: 1500000,
      impactPerRupee: "₹500 = 1 emergency survival & hygiene kit",
      image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600&auto=format&fit=crop&q=80",
      icon: "🚨",
      assignedNgoSlug: "resence-foundation"
    }
  ];

  for (const info of causeData) {
    const ngoId = ngos[info.assignedNgoSlug] || Object.values(ngos)[0];
    const exists = await Cause.findOne({ title: info.title });
    if (!exists) {
      await Cause.create({
        title: info.title,
        description: info.description,
        category: info.category,
        goal: info.goal,
        impactPerRupee: info.impactPerRupee,
        image: info.image,
        icon: info.icon,
        assignedNgo: ngoId,
        raised: 0,
        contributors: 0,
        active: true
      });
      console.log(`[seed] Created Cause: ${info.title}`);
    } else {
      // Keep it active and update image if missing
      exists.active = true;
      if (!exists.image || exists.image.startsWith("/")) {
        exists.image = info.image;
        await exists.save();
      }
    }
  }

  // Deactivate old causes not in the list of 12 premium causes
  const titles = causeData.map(c => c.title);
  await Cause.updateMany({ title: { $nin: titles } }, { active: false });
  console.log(`[seed] Deactivated any other non-premium causes.`);
}

app.listen(PORT, () => {
  console.log(`[server] ServeMate backend listening on port ${PORT}`);
  console.log(`[server] CORS origins: ${allowedOrigins.join(", ")}`);
});

connectMongo();
