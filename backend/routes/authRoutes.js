// ==========================================
// Authentication Routes using Supabase Auth
// ==========================================
const express = require("express");
const { supabase, supabaseAdmin } = require("../config/supabaseClient");
const { authMiddleware } = require("../middleware/authMiddleware");
const { authLimiter } = require("../src/middleware/rateLimit");

const router = express.Router();

// Helper to format users profile responses consistently
async function getPublicUserProfile(userId, defaultUserObj) {
  try {
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("id, name, email, phone, role, xp_points, level, avatar")
      .eq("id", userId)
      .single();

    if (profile) {
      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        xp: profile.xp_points || 0,
        level: profile.level || 1,
        avatar: profile.avatar
      };
    }
  } catch (err) {
    console.error("[authRoutes] Failed to fetch public profile:", err.message);
  }

  return {
    id: defaultUserObj.id,
    name: defaultUserObj.user_metadata?.name || "User",
    email: defaultUserObj.email,
    phone: defaultUserObj.phone,
    role: defaultUserObj.user_metadata?.role || "user",
    xp: 0,
    level: 1
  };
}

// 1. Phone number SMS OTP Send
router.post("/phone/send-otp", authLimiter, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const { data, error } = await supabase.auth.signInWithOtp({ phone });
    if (error) {
      throw error;
    }

    return res.json({ success: true, message: "Verification code sent successfully", details: data });
  } catch (err) {
    console.error("[auth] Phone OTP send failed:", err.message);
    return res.status(500).json({ error: err.message || "Failed to send verification code" });
  }
});

// 2. Phone number SMS OTP Verify
router.post("/phone/verify-otp", authLimiter, async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: "Phone number and OTP code are required" });
    }

    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms"
    });

    if (error) {
      throw error;
    }

    const userProfile = await getPublicUserProfile(data.user.id, data.user);
    return res.json({
      token: data.session.access_token,
      user: userProfile
    });
  } catch (err) {
    console.error("[auth] Phone OTP verification failed:", err.message);
    return res.status(400).json({ error: err.message || "Invalid or expired OTP code" });
  }
});

// 3. User Sign Up (Email & Password)
router.post("/register", authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    // Register user via Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: "user"
        }
      }
    });

    if (error) {
      throw error;
    }

    if (!data.session) {
      return res.status(201).json({
        message: "Registration successful! Please check your email for verification link.",
        user: { email: data.user.email }
      });
    }

    const userProfile = await getPublicUserProfile(data.user.id, data.user);
    return res.status(201).json({
      token: data.session.access_token,
      user: userProfile
    });
  } catch (err) {
    console.error("[auth] Email signup failed:", err.message);
    return res.status(400).json({ error: err.message || "Registration failed" });
  }
});

// 4. User Sign In (Email & Password)
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    const userProfile = await getPublicUserProfile(data.user.id, data.user);
    
    // Auto-login security check for NGOs verification status
    if (userProfile.role === "ngo") {
      const { data: ngo } = await supabaseAdmin
        .from("ngos")
        .select("verified")
        .eq("id", data.user.id)
        .single();
        
      if (ngo && !ngo.verified) {
        // Sign out user locally on failure
        await supabase.auth.signOut();
        return res.status(403).json({ error: "NGO account is pending administrative approval" });
      }
    }

    return res.json({
      token: data.session.access_token,
      user: userProfile
    });
  } catch (err) {
    console.error("[auth] Sign in failed:", err.message);
    return res.status(400).json({ error: err.message || "Invalid email or password" });
  }
});

// 5. Get current user profile (using auth middleware token)
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: "User profile not found" });
    }
    
    return res.json(user);
  } catch (err) {
    console.error("[auth] Profile fetch failed:", err.message);
    return res.status(500).json({ error: "Failed to retrieve user profile" });
  }
});

// 6. NGO registration
router.post("/ngo/register", authLimiter, async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      regNumber,
      taxStatus,
      areaOfWork,
      location,
      description,
      volunteerCount
    } = req.body;

    if (!name || !email || !password || !regNumber || !taxStatus || !areaOfWork) {
      return res.status(400).json({ error: "All required fields must be filled" });
    }

    // 1. Sign up the NGO as a User via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: "ngo"
        }
      }
    });

    if (authError) {
      throw authError;
    }

    const userId = authData.user.id;

    // 2. Insert details into public.ngos table (which triggers RLS)
    const { error: dbError } = await supabaseAdmin
      .from("ngos")
      .insert({
        id: userId,
        name,
        email,
        description,
        address: location,
        ngo_darpan_id: regNumber, // Map to Reg Number
        verified: false,
        trust_rating: 4.5,
        total_received: 0.00
      });

    if (dbError) {
      // Cleanup the created Auth user if DB save fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw dbError;
    }

    // Also populate volunteers table with mock or default volunteers count
    const vCount = Number(volunteerCount) || 0;
    if (vCount > 0) {
      await supabaseAdmin
        .from("ngos")
        .update({ trust_rating: 4.5 }) // Stub update or mock
        .eq("id", userId);
    }

    return res.status(201).json({
      message: "NGO registration submitted successfully. Platforms audits registration credentials within 7 working days.",
      ngo: { id: userId, name, email, verified: false }
    });
  } catch (err) {
    console.error("[auth] NGO signup failed:", err.message);
    return res.status(400).json({ error: err.message || "NGO registration failed" });
  }
});

// 7. NGO login (uses email/password check)
router.post("/ngo/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    // Verify role is indeed NGO
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (!profile || profile.role !== "ngo") {
      await supabase.auth.signOut();
      return res.status(403).json({ error: "Unauthorized access: NGO credentials required" });
    }

    // Verify NGO verification status
    const { data: ngo, error: ngoError } = await supabaseAdmin
      .from("ngos")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (ngoError || !ngo) {
      await supabase.auth.signOut();
      return res.status(404).json({ error: "NGO profile records not found" });
    }

    if (!ngo.verified) {
      await supabase.auth.signOut();
      return res.status(403).json({ error: "NGO account is pending administrative verification" });
    }

    return res.json({
      token: data.session.access_token,
      ngo: {
        id: ngo.id,
        name: ngo.name,
        email: ngo.email,
        verified: ngo.verified,
        rating: ngo.trust_rating,
        impactScore: 100 // default placeholder
      }
    });
  } catch (err) {
    console.error("[auth] NGO sign in failed:", err.message);
    return res.status(400).json({ error: err.message || "Invalid credentials" });
  }
});

// 8. Get current NGO profile
router.get("/ngo/me", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "ngo") {
      return res.status(403).json({ error: "NGO credentials required" });
    }

    const { data: ngo, error } = await supabaseAdmin
      .from("ngos")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error || !ngo) {
      return res.status(404).json({ error: "NGO profile record not found" });
    }

    return res.json(ngo);
  } catch (err) {
    console.error("[auth] NGO profile fetch failed:", err.message);
    return res.status(500).json({ error: "Failed to retrieve NGO profile" });
  }
});

// 9. Forgot Password request
router.post("/forgot-password", authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address is required" });
    }

    // Verify account exists first
    const { data: user, error: userErr } = await supabaseAdmin
      .from("users")
      .select("email")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (userErr || !user) {
      return res.status(404).json({ error: "No account registered with this email" });
    }

    // Send reset password request link via Supabase Auth
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${req.headers.origin || "http://localhost:5000"}/reset-password`
    });

    if (error) {
      throw error;
    }

    return res.json({ success: true, message: "Password reset link has been dispatched to your email address" });
  } catch (err) {
    console.error("[auth] Forgot password request failed:", err.message);
    return res.status(500).json({ error: err.message || "Failed to trigger password recovery" });
  }
});

// 10. Reset Password execution (via verified OTP or session update)
router.post("/reset-password", authLimiter, async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: "Email, reset code (OTP), and new password are required" });
    }

    // 1. Verify OTP of type "recovery" (forgot password)
    const { data: sessionData, error: otpError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "recovery"
    });

    if (otpError) {
      throw otpError;
    }

    // 2. Set the active session token to allow password update
    const { error: passError } = await supabaseAdmin.auth.admin.updateUserById(
      sessionData.user.id,
      { password: newPassword }
    );

    if (passError) {
      throw passError;
    }

    return res.json({ success: true, message: "Password reset successful! Please log in with your new password." });
  } catch (err) {
    console.error("[auth] Reset password failed:", err.message);
    return res.status(400).json({ error: err.message || "Failed to reset password. Please check your recovery code." });
  }
});

module.exports = { router };
