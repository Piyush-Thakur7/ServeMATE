# CTO Mandate — ServeMATE Governance & Technical Charter

> **Platform**: ServeMATE (`resence.in`) — Tech-Driven Micro-Donation Transparency  
> **Hackathon Reference**: MSME Idea Hackathon 6.0 (GLBCRI Incubation, Ref No: `26INC06UP003091`)  
> **Brand Slogan**: *"Small Act to Big Impact"*  
> **Governance Status**: ACTIVE  

---

## 🎯 Executive Mission

ServeMATE is engineered to revolutionize public donation transparency by connecting donors, student communities, and verified NGOs through **proof-based accountability**. Every rupee donated is tracked until the NGO uploads a geotagged video proof of delivery within a strict 96-hour SLA window.

As CTO, this mandate governs all system architecture, visual design standards, security protocols, and operational workflows.

---

## 📐 System Architecture & Technology Stack

```
                          ┌──────────────────────────┐
                          │   CLIENT BROWSER (SPA)   │
                          │   HTML5 / Vanilla JS     │
                          └─────────────┬────────────┘
                                        │ (JSON API via CORS)
                                        ▼
                          ┌──────────────────────────┐
                          │   EXPRESS NODE.JS SERVER │
                          │     (Vercel Edge API)    │
                          └─────────────┬────────────┘
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
     ┌───────────────────────┐                     ┌───────────────────────┐
     │   SUPABASE DATABASE   │                     │    RAZORPAY GATEWAY   │
     │ Postgres / JWT Auth   │                     │  UPI / Card Checkout  │
     └───────────────────────┘                     └───────────────────────┘
```

1. **Frontend Architecture**:
   - Lightweight Single Page Application (SPA) driven by `app.js` and modular HTML view containers (`#view-home`, `#view-causes`, `#view-dashboard`, `#view-admin`, `#view-ngo-dashboard`).
   - CSS Design System driven by CSS Custom Properties (`:root`) in `style.css` supporting light and dark modes.

2. **Backend Services**:
   - Node.js Express server (`index.js`) handling authentication, NGO onboarding, proof video submissions, community tracking, and admin audits.
   - Compression, rate limiting (`apiLimiter`), NoSQL/SQL injection protection, and security headers enabled.

3. **Database & Storage**:
   - Supabase PostgreSQL backend (`supabaseClient.js`) managing persistent tables for `users`, `ngos`, `campaigns`, `communities`, `donations`, and `proof_uploads`.

---

## 🎨 Visual System & Brand Tokens

| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Background (Light)** | `#F0F4F8` | Soft Dim Slate background (eye-friendly, non-harsh) |
| **Background (Dark)** | `#081B33` | Deep Slate Navy dark mode |
| **Primary Navy** | `#0B2545` | Headings, Primary CTAs, Navigation bar |
| **Accent Teal** | `#13A89E` | Brand wordmark "MATE", secondary highlights, active pills |
| **Secondary Gold** | `#C9A227` | XP badges, temporary urgent cause tags, level indicators |

**Logo Standard**:
Wordmark `Serve` (Navy) + `Mate` (Teal) accompanied by the uppercase sub-tagline `SMALL ACT TO BIG IMPACT` stacked directly below in navbar and drawer headers.

---

## 🛡️ Security, SLA & Financial Rules

1. **97-98% Escrow Payout**:
   - 97–98% of donated funds are held in escrow for direct payout to verified NGOs upon proof verification.
   - 2–3% platform fee retained for server operations and transaction processing.

2. **96-Hour (4 Days) Proof SLA**:
   - NGOs must upload a verified geotagged video proof within 96 hours (`96 * 60 * 60 * 1000` ms) of campaign milestone completion.

3. **Role-Based Access Control (RBAC)**:
   - Client routes `/admin` and `/ngo-dashboard` are strictly role-gated via JWT tokens and backend authorization middleware (`adminOnly`, `ngoOnly`).
   - Admin and NGO users retain dual access to their personal **User Dashboard** (`/dashboard`).

4. **Network & CORS Flexibility**:
   - Frontend API request URL resolves dynamically to `window.location.origin` (`const API = window.location.origin || ''`) to prevent CORS preflight failures on Vercel preview links or custom domain deployments (`resence.in`).

---

## 📁 5 Permanent Causes Framework

ServeMATE strictly enforces 5 permanent causes plus an admin-managed temporary emergency cause system:

1. 🍲 **Hunger**: *"10,000 Hot Meals for Urban Slum Families"*
2. 🌳 **Environment**: *"Plant 50,000 Native Trees Mission"*
3. 👶 **Orphan Child Support**: *"Orphaned Children Education & Boarding Support"*
4. 🤝 **Widow Support**: *"Sewing Kits & Livelihood for Destitute Widows"*
5. 👴 **Elder Support**: *"Geriatric Care & Ration Kits for Abandoned Elders"*
6. 🚨 **Temporary / Emergency**: Admin-created urgent relief campaigns (marked with `tag-gold`).

---

## 🤖 AI OS Sub-Agent Roles

The ServeMATE development pipeline is managed across 4 sub-agent responsibilities:

1. **CTO & Lead Architect**: System design, MSME hackathon compliance, and architectural decision making.
2. **Frontend UX Engineer**: Single-page routing, mobile responsive grids (`@media (max-width: 768px)`), and CSS tokens.
3. **Backend Platform Engineer**: Express API endpoints, Supabase queries, and payment webhooks.
4. **QA & Security Auditor**: Automated syntax checks (`npm test`), cache buster versioning (`?v=X.Y.Z`), and security header verification.

---

## ⚡ Deployment Protocol

- **Branch Directive**: All code changes are committed directly to `main` branch in small, logical commits.
- **Pre-Commit Gate**: Run `npm test` before pushing to verify zero syntax errors across backend files.
- **Cache Invalidation**: Increment asset query parameters in `index.html` (e.g. `href="/css/style.css?v=X.Y.Z"`) on every UI release.
