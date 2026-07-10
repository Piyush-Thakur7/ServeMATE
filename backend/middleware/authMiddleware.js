// ==========================================
// Authentication Middlewares & Role Verification
// ==========================================
const { supabase, supabaseAdmin } = require("../config/supabaseClient");

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];
  try {
    // Verify the JWT token against Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired session token" });
    }

    // Query their role and name from the public users profile table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("role, name, email")
      .eq("id", user.id)
      .single();

    req.user = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: profile ? profile.role : "user", // Fallback to 'user' role
      name: profile ? profile.name : (user.user_metadata?.name || user.user_metadata?.full_name || "User")
    };

    return next();
  } catch (err) {
    console.error("[authMiddleware] Unexpected authentication error:", err.message);
    return res.status(500).json({ error: "Authentication verification failed" });
  }
}

// Middleware to restrict access based on user roles
function requireRole(allowedRoles) {
  return [
    authMiddleware,
    (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: `Access forbidden: requires ${allowedRoles.join(" or ")} privileges` });
      }
      return next();
    }
  ];
}

// Specific role constraints
const adminOnly = requireRole(["admin"]);
const ngoOnly   = requireRole(["ngo"]);
const userOnly  = requireRole(["user"]);

module.exports = { authMiddleware, requireRole, adminOnly, ngoOnly, userOnly };
