# AGENT.md — ServeMATE Technical & AI OS Mandate

> **Project**: ServeMATE (`resence.in`) — Donation Transparency & Accountability Platform  
> **Submission**: MSME Idea Hackathon 6.0 (GLBCRI Incubation, Ref No: `26INC06UP003091`)  
> **Tagline**: *"Small Act to Big Impact"*  

---

## 🏛️ Executive CTO Mandate

This repository is governed by the **Antigravity CTO Mandate & AI OS Operational Framework**. All code modifications, UI updates, and infrastructure changes must strictly align with the following rules:

### 1. Visual & Design Tokens
- **Theme Default**: Soft Dim Slate Light Mode (`#F0F4F8`) with toggle support for Dark Mode (`#081B33`).
- **Primary Navy**: `#0B2545` (Headers, Primary Text, CTAs)
- **Accent Teal**: `#13A89E` (Brand accents, active indicators, "MATE" wordmark)
- **Secondary Gold**: `#C9A227` (Temporary cause tags, level badges)
- **Logo Layout**: Wordmark `Serve` (Navy) + `Mate` (Teal) with uppercase sub-tagline `SMALL ACT TO BIG IMPACT` stacked directly underneath.

### 2. API & Network Architecture
- **Dynamic Origin Resolution**: All frontend API calls must target `window.location.origin` (`const API = window.location.origin || ''`) to avoid CORS blocks on Vercel preview URLs or custom domain deployments (`resence.in`).
- **CORS Permissiveness**: Backend `cors` middleware must allow `.vercel.app` domains, `resence.in`, `localhost`, and same-origin fallbacks.

### 3. Cause System & SLA Rules
- **5 Permanent Causes Only**:
  1. 🍲 **Hunger** (*"10,000 Hot Meals for Urban Slum Families"*)
  2. 🌳 **Environment** (*"Plant 50,000 Native Trees Mission"*)
  3. 👶 **Orphan Child Support** (*"Orphaned Children Education & Boarding Support"*)
  4. 🤝 **Widow Support** (*"Sewing Kits & Livelihood for Destitute Widows"*)
  5. 👴 **Elder Support** (*"Geriatric Care & Ration Kits for Abandoned Elders"*)
- **Temporary Cause Mechanism**: Admin-created temporary/urgent emergency causes (e.g. Flood Relief) marked with `tag-gold`.
- **96-Hour SLA**: 96 hours (4 days) SLA window for verified geotagged proof video uploads per campaign.
- **Escrow Payout**: 97-98% direct NGO escrow payout with 2-3% platform operational fee.

### 4. Account Navigation & Role Gating
- **Role Permissions**: Public navbar shows public links only (`Home`, `Causes`, `Communities`, `Impact Center`, `Leaderboard`, `About`, `Contact`).
- **Dual Dashboard Access**: Authenticated `admin` and `ngo` accounts have access to both their **User Dashboard** (`/dashboard`) and their administrative portal (`/admin` / `/ngo-dashboard`).

---

## 🤖 AI OS Multi-Agent Architecture

```
                    ┌──────────────────────────────────────┐
                    │      CTO & AGENTS ORCHESTRATOR       │
                    │      (Antigravity Lead Architect)    │
                    └──────────────────┬───────────────────┘
                                       │
           ┌───────────────────────────┼───────────────────────────┐
           ▼                           ▼                           ▼
  ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
  │ FRONTEND AGENT  │         │  BACKEND AGENT  │         │   QA & AUDITOR  │
  │ (Vite/CSS/DOM)  │         │ (Node/Express)  │         │(Sentry/Supabase)│
  └─────────────────┘         └─────────────────┘         └─────────────────┘
```

- **Frontend Agent**: Manages single-page app (SPA) views, theme state, mobile responsive grids (`@media (max-width: 768px)`), and touch interactions.
- **Backend Agent**: Manages Express endpoints, Razorpay payment verification, Supabase JWT auth, and rate limiting (`apiLimiter`).
- **QA & Security Auditor**: Validates `npm test` checks, linting, RLS policies, and NoSQL injection protection middleware.

---

## 🛠️ Verification Protocol
Before pushing any commits to GitHub `main`:
1. Run `npm test` to check syntax across `index.js` and `backend/` routes.
2. Bump cache-buster version query parameters in `frontend/index.html` (e.g. `?v=X.Y.Z`).
3. Commit with concise Conventional Commit messages (e.g. `feat(...)`, `fix(...)`, `style(...)`).
