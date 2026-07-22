/**
 * ServeMATE Supabase Database Model Helpers
 * 100% Supabase PostgreSQL Data Models & Table Contracts
 */

const TABLES = {
  USERS: 'users',
  NGOS: 'ngos',
  CAMPAIGNS: 'campaigns',
  DONATIONS: 'donations',
  PROOFS: 'proofs',
  COMMUNITIES: 'communities'
};

// Helper data formatters for Supabase entities
function formatUserProfile(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name || user.email?.split('@')[0] || "Student Changemaker",
    email: user.email,
    phone: user.phone || "",
    role: user.role || "user",
    xp: user.xp_points || 0,
    level: user.level || 1,
    avatar: user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
  };
}

module.exports = {
  TABLES,
  formatUserProfile
};
