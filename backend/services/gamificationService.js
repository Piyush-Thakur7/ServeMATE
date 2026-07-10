const LEVELS = [
  { minLevel: 1, maxLevel: 4, title: "Contributor", icon: "\u{1F331}", rarity: "common", gradient: "linear-gradient(135deg,#22c55e,#84cc16)" },
  { minLevel: 5, maxLevel: 9, title: "Supporter", icon: "\u26A1", rarity: "uncommon", gradient: "linear-gradient(135deg,#0ea5e9,#2563eb)" },
  { minLevel: 10, maxLevel: 19, title: "Community Builder", icon: "\u{1F91D}", rarity: "rare", gradient: "linear-gradient(135deg,#f59e0b,#facc15)" },
  { minLevel: 20, maxLevel: 34, title: "Impact Leader", icon: "\u{1F525}", rarity: "epic", gradient: "linear-gradient(135deg,#06b6d4,#8b5cf6)" },
  { minLevel: 35, maxLevel: Infinity, title: "Change Champion", icon: "\u{1F451}", rarity: "legendary", gradient: "linear-gradient(135deg,#ef4444,#f97316)" },
];

// New leveling formula:
// 1 rupee donated = 1 XP
// Level 1 → 2: 1000 XP (₹1,000)
// Level 2 → 3: 2000 XP (₹2,000)
// Level 3 → 4: 4000 XP (₹4,000)
// Each level requires 2x the XP of the previous level
// Total XP for level N: 1000 * (2^(N-1) - 1)

function getXpForLevel(level = 1) {
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  if (safeLevel <= 1) return 0;
  return 1000 * (Math.pow(2, safeLevel - 1) - 1);
}

function getLevelFromXp(xp = 0) {
  const safeXp = Math.max(0, Math.floor(Number(xp) || 0));
  if (safeXp < 1000) return 1;
  return Math.max(1, Math.floor(Math.log2(safeXp / 1000 + 1)) + 1);
}

function getRankForLevel(level = 1) {
  return LEVELS.find((rank) => level >= rank.minLevel && level <= rank.maxLevel) || LEVELS[0];
}

function getProgression(xp = 0) {
  const safeXp = Math.max(0, Math.floor(Number(xp) || 0));
  const level = getLevelFromXp(safeXp);
  const currentLevelXp = getXpForLevel(level);
  const nextLevelXp = getXpForLevel(level + 1);
  const xpIntoLevel = safeXp - currentLevelXp;
  const xpForNextLevel = nextLevelXp - currentLevelXp;
  const progress = xpForNextLevel > 0
    ? Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100))
    : 100;
  const rank = getRankForLevel(level);

  return {
    xp: safeXp,
    level,
    title: rank.title,
    titleIcon: rank.icon,
    titleGradient: rank.gradient,
    titleRarity: rank.rarity,
    currentLevelXp,
    nextLevelXp,
    xpRequiredForNextLevel: nextLevelXp,
    xpIntoLevel,
    xpForNextLevel,
    xpRemaining: Math.max(0, nextLevelXp - safeXp),
    progress,
    ranks: LEVELS,
  };
}

function applyProgression(user) {
  const progression = getProgression(user.xp);
  user.level = progression.level;
  user.title = progression.title;
  return progression;
}

module.exports = {
  LEVELS,
  applyProgression,
  getLevelFromXp,
  getProgression,
  getRankForLevel,
  getXpForLevel,
};
