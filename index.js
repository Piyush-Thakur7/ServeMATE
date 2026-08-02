require("./backend/instrument.js");
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const compression = require("compression");
const fs = require("fs");
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
      if (!origin) return callback(null, true);
      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.includes("resence.in") ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1");

      if (isAllowed) {
        return callback(null, true);
      }
      // Permissive fallback so dynamic Vercel previews never block API requests
      return callback(null, true);
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
  const isSupabaseConfigured = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
  res.json({
    status: "ok",
    database: isSupabaseConfigured ? "supabase_active" : "supabase_pending",
    version: "v4-100-percent-supabase-database",
    time: new Date().toISOString(),
  });
});

app.use("/api", (req, res, next) => {
  const isSupabaseConfigured = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
  if (isSupabaseConfigured) {
    return next();
  }

  return res.status(503).json({
    error: "Database unavailable",
    message: "The backend is running, but SUPABASE_URL or SUPABASE_ANON_KEY environment variables are missing.",
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

// Setup Sentry express error handler
Sentry.setupExpressErrorHandler(app);

// Lightweight dynamic JS/CSS minification and caching
function minifyJS(code) {
  code = code.replace(/\/\*[\s\S]*?\*\//g, "");
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
  try {
    const filePath = path.join(__dirname, "frontend", "public", "js", "app.js");
    const raw = fs.readFileSync(filePath, "utf8");
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    res.send(minifyJS(raw));
  } catch (err) {
    console.warn("[serve] Fallback serving raw app.js:", err.message);
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    return res.sendFile(path.join(__dirname, "frontend", "public", "js", "app.js"));
  }
});

app.get("/css/style.css", (req, res) => {
  try {
    const filePath = path.join(__dirname, "frontend", "public", "css", "style.css");
    const raw = fs.readFileSync(filePath, "utf8");
    res.setHeader("Content-Type", "text/css");
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    res.send(minifyCSS(raw));
  } catch (err) {
    console.warn("[serve] Fallback serving raw style.css:", err.message);
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    return res.sendFile(path.join(__dirname, "frontend", "public", "css", "style.css"));
  }
});

app.use(express.static(path.join(__dirname, "frontend", "public"), {
  maxAge: 0,
  setHeaders: (res, filePath) => {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  }
}));

app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send([
    "User-agent: *",
    "Allow: /",
    "Sitemap: https://resence.in/sitemap.xml",
  ].join("\n"));
});

function serveHtml(res, filename) {
  const possiblePaths = [
    path.join(__dirname, "frontend", filename),
    path.join(process.cwd(), "frontend", filename),
    path.join(__dirname, filename),
    path.join(process.cwd(), filename)
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(fs.readFileSync(p, "utf8"));
    }
  }
  return res.status(404).send("HTML file not found");
}

app.get("/sitemap.xml", (req, res) => {
  const p = path.join(__dirname, "sitemap.xml");
  if (fs.existsSync(p)) {
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    return res.send(fs.readFileSync(p, "utf8"));
  }
  return res.status(404).send("Sitemap not found");
});

app.get("/", (req, res) => {
  return serveHtml(res, "index.html");
});

app.get("/admin", (req, res) => {
  return serveHtml(res, "admin.html");
});

app.use((req, res, next) => {
  if (req.method !== "GET") return next();
  const host = String(req.hostname || "").toLowerCase();
  if (host.startsWith("admin.")) {
    return serveHtml(res, "admin.html");
  }
  return serveHtml(res, "index.html");
});

app.use((err, req, res, next) => {
  console.error("[server] Unhandled request error:", err.message);
  if (res.headersSent) return next(err);
  return res.status(500).json({ error: "Internal server error" });
});

const { seedSupabase } = require("./backend/utils/supabaseSeed");

app.listen(PORT, () => {
  console.log(`[server] ServeMate backend listening on port ${PORT}`);
  console.log(`[server] CORS origins: ${allowedOrigins.join(", ")}`);
});

async function startApp() {
  await seedSupabase();
}
startApp();

module.exports = app;
