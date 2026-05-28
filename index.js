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
    version: "v2-reg-fix-forced",
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

app.get("/ngo-dashboard", (req, res) => {
  return res.sendFile(path.join(__dirname, "ngo-dashboard.html"));
});

app.use((req, res, next) => {
  if (req.method !== "GET") {
    return next();
  }
  const host = req.hostname.toLowerCase();
  if (host.startsWith("admin.")) {
    return res.sendFile(path.join(__dirname, "admin.html"));
  }
  if (host.endsWith("resence.in") && !["resence.in", "www.resence.in"].includes(host)) {
    return res.sendFile(path.join(__dirname, "ngo.html"));
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
  const { User } = require("./models");
  const bcrypt = require("bcryptjs");

  const adminExists = await User.findOne({ email: ADMIN_EMAIL });
  if (!adminExists) {
    if (!process.env.ADMIN_PASSWORD) {
      console.warn(
        `[seed] ADMIN_PASSWORD is not set. Admin user ${ADMIN_EMAIL} was not auto-created.`
      );
      return;
    }

    const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    await User.create({
      name: "Admin",
      email: ADMIN_EMAIL,
      password: hashed,
      role: "admin",
    });
    console.log(`[seed] Admin user created: ${ADMIN_EMAIL}`);
  } else if (adminExists.role !== "admin") {
    console.warn(
      `[seed] ${ADMIN_EMAIL} exists but is not an admin. Update this user role manually before using admin APIs.`
    );
  }
}

app.listen(PORT, () => {
  console.log(`[server] ServeMate backend listening on port ${PORT}`);
  console.log(`[server] CORS origins: ${allowedOrigins.join(", ")}`);
});

connectMongo();
