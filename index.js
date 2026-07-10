require("./backend/instrument.js");
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const compression = require("compression");
const Sentry = require("@sentry/node");

const { ADMIN_EMAIL } = require("./backend/utils/authUtils");
const { router: authRouter } = require("./backend/routes/authRoutes");
const apiRouter = require("./backend/routes/apiRoutes");
const adminRouter = require("./backend/routes/adminRoutes");
const { apiLimiter } = require("./backend/src/middleware/rateLimit");

const app = express();
app.use(compression());
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

// Custom NoSQL Injection Protection Middleware (Express 5 compatible)
function mongoSanitize(req, res, next) {
  const sanitizeObj = (obj) => {
    if (obj && typeof obj === "object") {
      for (const key in obj) {
        if (key.startsWith("$")) {
          delete obj[key];
        } else {
          sanitizeObj(obj[key]);
        }
      }
    }
  };
  if (req.body) sanitizeObj(req.body);
  if (req.query) sanitizeObj(req.query);
  if (req.params) sanitizeObj(req.params);
  next();
}
app.use(mongoSanitize);

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
  const isMongoConnected = mongoose.connection.readyState === 1;
  const isSupabaseConfigured = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
  if (isMongoConnected || isSupabaseConfigured) {
    return next();
  }

  return res.status(503).json({
    error: "Database unavailable",
    message: "The backend is running, but neither MongoDB nor Supabase are connected or configured.",
  });
});

app.use("/api/auth", authRouter);
app.use("/api", apiRouter);
app.use("/api/admin", adminRouter);

// Supabase configuration sharing endpoint
app.get("/api/config", (req, res) => {
  return res.json({
    supabaseUrl: process.env.SUPABASE_URL || "https://placeholder.supabase.co",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "placeholder-anon-key"
  });
});

// Sentry debug route
app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});

app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

// Setup Sentry express error handler (must be after all controllers and before other middlewares)
Sentry.setupExpressErrorHandler(app);

// Lightweight dynamic JS/CSS minification and caching
const fs = require("fs");

function minifyJS(code) {
  // Remove multi-line comments
  code = code.replace(/\/\*[\s\S]*?\*\//g, "");
  // Simple line cleanup: filter out lines starting with // and collapse multiple spaces
  const lines = code.split("\n");
  const cleaned = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith("//")) return "";
    return line;
  });
  return cleaned.filter(line => line.trim().length > 0).join("\n").replace(/[ \t]+/g, " ");
}

function minifyCSS(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([\{\}:;,])\s*/g, "$1")
    .trim();
}

let cachedMinifiedJS = null;
let cachedMinifiedCSS = null;

app.get("/js/app.js", (req, res) => {
  if (!cachedMinifiedJS || process.env.NODE_ENV === "development") {
    try {
      const raw = fs.readFileSync(path.join(__dirname, "frontend", "public", "js", "app.js"), "utf8");
      cachedMinifiedJS = minifyJS(raw);
    } catch (err) {
      console.warn("[minify] Failed to minify app.js, serving raw file:", err.message);
      return res.sendFile(path.join(__dirname, "frontend", "public", "js", "app.js"));
    }
  }
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "public, max-age=31536000"); // 1 year cache
  res.send(cachedMinifiedJS);
});

app.get("/css/style.css", (req, res) => {
  if (!cachedMinifiedCSS || process.env.NODE_ENV === "development") {
    try {
      const raw = fs.readFileSync(path.join(__dirname, "frontend", "public", "css", "style.css"), "utf8");
      cachedMinifiedCSS = minifyCSS(raw);
    } catch (err) {
      console.warn("[minify] Failed to minify style.css, serving raw file:", err.message);
      return res.sendFile(path.join(__dirname, "frontend", "public", "css", "style.css"));
    }
  }
  res.setHeader("Content-Type", "text/css");
  res.setHeader("Cache-Control", "public, max-age=31536000"); // 1 year cache
  res.send(cachedMinifiedCSS);
});

app.use(express.static(path.join(__dirname, "frontend", "public"), {
  maxAge: '31536000000', // 1 year in milliseconds
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    }
  }
}));

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
  return res.sendFile(path.join(__dirname, "frontend", "admin.html"));
});



app.use((req, res, next) => {
  if (req.method !== "GET") {
    return next();
  }
  const host = req.hostname.toLowerCase();
  if (host.startsWith("admin.")) {
    return res.sendFile(path.join(__dirname, "frontend", "admin.html"));
  }
  return res.sendFile(path.join(__dirname, "frontend", "index.html"));
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
  const { User, NGO, Cause } = require("./backend/models/models");
  
  // Remove "Street Animal Care Program" as requested by user
  await Cause.deleteOne({ title: "Street Animal Care Program" });
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
    adminExists.role = "admin";
    await adminExists.save();
    console.log(`[seed] Promoted existing user ${ADMIN_EMAIL} to admin role.`);
  }

  // Delete mock/fake NGOs if they exist
  await NGO.deleteMany({ email: { $in: ["foundation@resence.in", "green@india.org", "help@helpage.org"] } });

  // 1. Seed/Find the authentic Resence Help NGO
  let resenceHelp = await NGO.findOne({ name: "Resence Help" }) || await NGO.findOne({ slug: "resence-help" });
  if (!resenceHelp) {
    const hashed = await bcrypt.hash("ResenceHelp123!", 10);
    resenceHelp = await NGO.create({
      name: "Resence Help",
      email: "help@resence.in",
      password: hashed,
      regNumber: "MOCK-54321-HELP",
      taxStatus: "Both",
      areaOfWork: "Education, Hunger, Environment, Healthcare, Children, Animal Welfare, Women Empowerment, Disaster Relief",
      slug: "resence-help",
      description: "Authentic platform partner facilitating micro-donations and transparency-driven social impact.",
      about: "We Help Humanity. Resence Help connects student communities with transparent, verified social actions across India.",
      location: "Greater Noida, Uttar Pradesh",
      verified: true,
      verifiedAt: new Date(),
      rating: 4.9,
      impactScore: 100,
      tasksCompleted: 5,
      volunteerCount: 2,
      logo: "https://images.unsplash.com/photo-1579208575657-c595a05383b7?w=150&auto=format&fit=crop&q=80",
    });
    console.log(`[seed] Created Resence Help NGO.`);
  } else {
    // Make sure it is verified and has correct authentic properties
    resenceHelp.verified = true;
    resenceHelp.verifiedAt = resenceHelp.verifiedAt || new Date();
    await resenceHelp.save();
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
      image: "https://images.unsplash.com/photo-1593113630400-ea4288922497?w=600&auto=format&fit=crop&q=80",
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
    const ngoId = resenceHelp._id;
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
      // Force update existing cause fields to ensure premium properties and distinct covers
      exists.description = info.description;
      exists.category = info.category;
      exists.goal = info.goal;
      exists.impactPerRupee = info.impactPerRupee;
      exists.image = info.image;
      exists.icon = info.icon;
      exists.assignedNgo = ngoId;
      exists.active = true;
      await exists.save();
      console.log(`[seed] Updated Cause: ${info.title} with premium configuration.`);
    }
  }

  // Deactivate old causes not in the list of 12 premium causes
  const titles = causeData.map(c => c.title);
  await Cause.updateMany({ title: { $nin: titles } }, { active: false });
  console.log(`[seed] Deactivated any other non-premium causes.`);
}

const { seedSupabase } = require("./backend/utils/supabaseSeed");

app.listen(PORT, () => {
  console.log(`[server] ServeMate backend listening on port ${PORT}`);
  console.log(`[server] CORS origins: ${allowedOrigins.join(", ")}`);
});

async function startApp() {
  await connectMongo();
  await seedSupabase();
}
startApp();
