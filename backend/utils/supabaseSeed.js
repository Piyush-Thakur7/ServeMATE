const { supabaseAdmin } = require("../config/supabaseClient");
const bcrypt = require("bcryptjs");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@servemate.org";

const causeData = [
  {
    title: "Digital Learning for Rural Students",
    description: "Equip village schools with modern digital tablets, internet connectivity, and interactive educational content.",
    category: "education",
    target_amount: 1000000,
    impactPerRupee: "₹500 = 1 Digital Study Kit for a student",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=80",
    icon: "📚"
  },
  {
    title: "Primary School Tuition Clinic",
    description: "Support after-school learning centers providing free tuition, notebooks, and pencils to slum children.",
    category: "education",
    target_amount: 300000,
    impactPerRupee: "₹250 = 1 month of tuition class support",
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80",
    icon: "✏️"
  },
  {
    title: "Medical Support for Underprivileged Families",
    description: "Fund essential operations, chronic illnesses treatment, and doctor fees for low-income households.",
    category: "healthcare",
    target_amount: 1000000,
    impactPerRupee: "₹1000 = 1 life-saving medical consultation",
    image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&auto=format&fit=crop&q=80",
    icon: "🏥"
  },
  {
    title: "Mobile Health Camps in Remote Villages",
    description: "Deploy mobile vans with doctors, nurses, and free medicines to remote, healthcare-deprived areas.",
    category: "healthcare",
    target_amount: 1200000,
    impactPerRupee: "₹200 = 1 basic health checkup & medicine pack",
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80",
    icon: "🚐"
  },
  {
    title: "10000 Meals Initiative",
    description: "Cook and deliver hygienic, fresh, nutritious warm meals to daily wage laborers and homeless shelters.",
    category: "food",
    target_amount: 1000000,
    impactPerRupee: "₹20 = 1 hot nutritious meal served",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&auto=format&fit=crop&q=80",
    icon: "🍲"
  },
  {
    title: "Feed the Homeless Daily Drive",
    description: "Provide monthly grocery survival kits (rice, pulses, oil, spices) to families living under flyovers.",
    category: "food",
    target_amount: 150000,
    impactPerRupee: "₹300 = 1 grocery kit containing basic dry rations",
    image: "https://images.unsplash.com/photo-1593113630400-ea4288922497?w=600&auto=format&fit=crop&q=80",
    icon: "🍛"
  },
  {
    title: "Plant 50000 Trees Mission",
    description: "Plant native tree saplings across deforested urban and rural zones to fight air pollution and heatwaves.",
    category: "environment",
    target_amount: 1000000,
    impactPerRupee: "₹50 = 1 native tree sapling planted & nurtured",
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80",
    icon: "🌳"
  },
  {
    title: "Urban Green Spaces Development",
    description: "Restore dried lakes and construct green community micro-forests to restore local bio-diversity.",
    category: "environment",
    target_amount: 600000,
    impactPerRupee: "₹100 = 1 sq ft of community green cover created",
    image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&auto=format&fit=crop&q=80",
    icon: "🌱"
  },
  {
    title: "School Kit Distribution Program",
    description: "Distribute premium school bags containing books, stationery, and steel water bottles to school kids.",
    category: "children",
    target_amount: 400000,
    impactPerRupee: "₹350 = 1 complete school bag & kit distributed",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=80",
    icon: "🎒"
  },
  {
    title: "Women's Skill Development Initiative",
    description: "Empower women through professional vocational training in sewing, handicrafts, and computer basics.",
    category: "women-empowerment",
    target_amount: 600000,
    impactPerRupee: "₹1500 = 1 week of professional vocational training",
    image: "https://images.unsplash.com/photo-1579208575657-c595a05383b7?w=600&auto=format&fit=crop&q=80",
    icon: "👩"
  },
  {
    title: "Emergency Flood Support",
    description: "Distribute emergency survival packs containing tarpaulins, dry foods, water purification tablets, and first aid.",
    category: "disaster-relief",
    target_amount: 1500000,
    impactPerRupee: "₹500 = 1 emergency survival & hygiene kit",
    image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600&auto=format&fit=crop&q=80",
    icon: "🚨"
  }
];

const badgeData = [
  { name: "First Donation", description: "Completed your first micro-contribution on ServeMate", xp_required: 10, icon_url: "🏅" },
  { name: "Consistent Giver", description: "Backed causes 10 or more times", xp_required: 100, icon_url: "⚡" },
  { name: "Century Club", description: "Backed causes 100 or more times", xp_required: 1000, icon_url: "👑" },
  { name: "Impact Creator", description: "Accumulated more than 5,000 XP points", xp_required: 5000, icon_url: "🔥" }
];

async function seedSupabase() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.warn("[seed-supabase] Credentials not set. Skipping Supabase seeding.");
    return;
  }

  try {
    console.log("[seed-supabase] Starting Supabase database seeding...");

    // 1. Seed Admin user (if ADMIN_PASSWORD is set)
    if (process.env.ADMIN_PASSWORD) {
      const { data: users, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
      if (!listErr) {
        const adminExists = users.users.find(u => u.email === ADMIN_EMAIL);
        if (!adminExists) {
          const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email: ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
            email_confirm: true,
            user_metadata: { role: "admin", name: "Admin" }
          });
          if (createErr) console.error("[seed-supabase] Failed to create Admin user:", createErr.message);
          else console.log(`[seed-supabase] Admin user created: ${ADMIN_EMAIL}`);
        } else {
          console.log("[seed-supabase] Admin user already exists.");
        }
      }
    } else {
      console.warn("[seed-supabase] ADMIN_PASSWORD is not set. Admin user creation skipped.");
    }

    // 2. Seed default NGO (Resence Help)
    let ngoId = null;
    const { data: existingNgo, error: ngoFetchErr } = await supabaseAdmin
      .from("ngos")
      .select("id")
      .eq("email", "help@resence.in")
      .maybeSingle();

    if (ngoFetchErr) {
      console.error("[seed-supabase] Error fetching Resence Help NGO:", ngoFetchErr.message);
    }

    if (!existingNgo) {
      const { data: newNgo, error: createNgoErr } = await supabaseAdmin
        .from("ngos")
        .insert({
          name: "Resence Help",
          email: "help@resence.in",
          description: "Authentic platform partner facilitating micro-donations and transparency-driven social impact.",
          address: "Greater Noida, Uttar Pradesh",
          ngo_darpan_id: "MOCK-54321-HELP",
          verified: true,
          trust_rating: 4.9,
          total_received: 0
        })
        .select("id")
        .single();

      if (createNgoErr) {
        console.error("[seed-supabase] Failed to create Resence Help NGO:", createNgoErr.message);
      } else {
        console.log("[seed-supabase] Seeded Resence Help NGO.");
        ngoId = newNgo.id;
      }
    } else {
      console.log("[seed-supabase] Resence Help NGO already exists.");
      ngoId = existingNgo.id;
    }

    // 3. Seed default campaigns
    if (ngoId) {
      for (const info of causeData) {
        const { data: existingCamp, error: campErr } = await supabaseAdmin
          .from("campaigns")
          .select("id")
          .eq("title", info.title)
          .maybeSingle();

        if (!existingCamp) {
          const { error: insertCampErr } = await supabaseAdmin
            .from("campaigns")
            .insert({
              ngo_id: ngoId,
              title: info.title,
              description: info.description,
              target_amount: info.target_amount,
              raised_amount: 0,
              status: "active",
              category: info.category
            });

          if (insertCampErr) {
            console.error(`[seed-supabase] Failed to seed campaign "${info.title}":`, insertCampErr.message);
          } else {
            console.log(`[seed-supabase] Seeded campaign: ${info.title}`);
          }
        }
      }
    }

    // 4. Seed default badges
    for (const badge of badgeData) {
      const { data: existingBadge } = await supabaseAdmin
        .from("badges")
        .select("id")
        .eq("name", badge.name)
        .maybeSingle();

      if (!existingBadge) {
        const { error: badgeInsertErr } = await supabaseAdmin
          .from("badges")
          .insert({
            name: badge.name,
            description: badge.description,
            xp_required: badge.xp_required,
            icon_url: badge.icon_url
          });

        if (badgeInsertErr) {
          console.error(`[seed-supabase] Failed to seed badge "${badge.name}":`, badgeInsertErr.message);
        } else {
          console.log(`[seed-supabase] Seeded badge: ${badge.name}`);
        }
      }
    }

    console.log("[seed-supabase] Supabase database seeding complete.");
  } catch (err) {
    console.error("[seed-supabase] Unhandled seeding error:", err.message);
  }
}

module.exports = { seedSupabase };
