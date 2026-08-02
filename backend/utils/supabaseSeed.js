const { supabaseAdmin } = require("../config/supabaseClient");
const bcrypt = require("bcryptjs");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@servemate.org";

const causeData = [
  {
    title: "10,000 Hot Meals for Urban Slum Families",
    description: "Cook and deliver fresh, nutritious warm meals to daily wage laborers, homeless shelters, and slum families.",
    category: "hunger",
    target_amount: 1000000,
    impactPerRupee: "₹20 = 1 hot nutritious meal served",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&auto=format&fit=crop&q=80",
    icon: "🍲"
  },
  {
    title: "Plant 50,000 Native Trees Mission",
    description: "Plant native tree saplings across deforested urban and rural zones to combat air pollution and heatwaves.",
    category: "environment",
    target_amount: 1000000,
    impactPerRupee: "₹50 = 1 native tree sapling planted & nurtured",
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80",
    icon: "🌳"
  },
  {
    title: "Orphaned Children Education & Boarding Support",
    description: "Provide shelter, school kits, textbooks, and full boarding support for orphaned and abandoned children.",
    category: "orphan-child-support",
    target_amount: 500000,
    impactPerRupee: "₹350 = 1 complete school bag & learning kit",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=80",
    icon: "👶"
  },
  {
    title: "Sewing Kits & Livelihood for Destitute Widows",
    description: "Empower destitute widows through self-reliance sewing machine kits, skill training, and monthly stipends.",
    category: "widow-support",
    target_amount: 400000,
    impactPerRupee: "₹1500 = 1 sewing kit & vocational training module",
    image: "https://images.unsplash.com/photo-1579208575657-c595a05383b7?w=600&auto=format&fit=crop&q=80",
    icon: "🤝"
  },
  {
    title: "Geriatric Care & Ration Kits for Abandoned Elders",
    description: "Provide monthly dry ration kits, essential medicines, and geriatric care for abandoned senior citizens.",
    category: "elder-support",
    target_amount: 600000,
    impactPerRupee: "₹300 = 1 monthly grocery & medicine kit",
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80",
    icon: "👴"
  },
  {
    title: "Emergency Flood Relief — Greater Noida (August 2026)",
    description: "Distribute emergency survival packs containing tarpaulins, dry foods, water purification tablets, and medical kits to flood-affected families.",
    category: "temporary",
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
