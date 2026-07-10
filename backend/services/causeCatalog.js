const CORE_CAUSES = [
  {
    category: "education",
    title: "Education & Literacy",
    description: "Provide books, study materials, and build classrooms for underprivileged children.",
    icon: "\u{1F4DA}",
    impactPerRupee: "Verified education support",
    visual: "education",
    emptyState: "New verified causes coming soon",
  },
  {
    category: "healthcare",
    title: "Healthcare & Medicine",
    description: "Support free medical camps, primary healthcare, and emergency life-saving treatments.",
    icon: "\u{1F3E5}",
    impactPerRupee: "Verified medical support",
    visual: "health",
    emptyState: "New verified causes coming soon",
  },
  {
    category: "food",
    title: "Food & Hunger Relief",
    description: "Provide warm, nutritious meals to feed hungry families and fight malnutrition.",
    icon: "\u{1F35B}",
    impactPerRupee: "Verified meal support",
    visual: "meals",
    emptyState: "No community activity yet",
  },
  {
    category: "environment",
    title: "Environment & Trees",
    description: "Plant native tree saplings and fund local cleanups for environmental restoration.",
    icon: "\u{1F333}",
    impactPerRupee: "Verified green impact",
    visual: "environment",
    emptyState: "New verified causes coming soon",
  },
  {
    category: "animal-welfare",
    title: "Animal Welfare",
    description: "Fund rescues, medical care, and food for street dogs and animal shelters.",
    icon: "\u{1F43E}",
    impactPerRupee: "Verified animal support",
    visual: "animals",
    emptyState: "New verified causes coming soon",
  },
  {
    category: "disaster-relief",
    title: "Disaster Relief",
    description: "Provide survival kits, clean water, and emergency food packets during natural disasters.",
    icon: "\u{1F6A8}",
    impactPerRupee: "Verified relief support",
    visual: "essentials",
    emptyState: "Be the first supporter",
  },
  {
    category: "women-empowerment",
    title: "Women Empowerment",
    description: "Support vocational training, hygiene drives, and skill building for women.",
    icon: "\u{1F469}",
    impactPerRupee: "Verified empowerment support",
    visual: "women",
    emptyState: "New verified causes coming soon",
  },
  {
    category: "children",
    title: "Children Welfare",
    description: "Ensure basic child safety, emotional development, and support orphanages.",
    icon: "\u{1F476}",
    impactPerRupee: "Verified child welfare",
    visual: "children",
    emptyState: "New verified causes coming soon",
  },
];

function mergeCoreCauses(realCauses = []) {
  const byCategory = new Map(realCauses.map((cause) => [cause.category, cause]));

  return CORE_CAUSES.map((core) => {
    const real = byCategory.get(core.category);
    if (!real) {
      return {
        ...core,
        id: core.category,
        _id: core.category,
        isPlaceholder: true,
        active: true,
        raised: 0,
        goal: 0,
        hasRealActivity: false,
      };
    }

    const plain = typeof real.toObject === "function" ? real.toObject() : real;
    const raised = Number(plain.raised || 0);
    const contributors = Number(plain.contributors || 0);

    return {
      ...core,
      ...plain,
      title: plain.title || core.title,
      description: plain.description || core.description,
      icon: plain.icon || core.icon,
      impactPerRupee: plain.impactPerRupee || core.impactPerRupee,
      isPlaceholder: false,
      hasRealActivity: raised > 0 || contributors > 0,
      visual: core.visual,
      emptyState: core.emptyState,
    };
  });
}

module.exports = {
  CORE_CAUSES,
  mergeCoreCauses,
};
