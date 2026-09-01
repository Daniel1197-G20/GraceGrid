# 🕊️ GraceGrid — Cinematic Digital Sanctuary & Waitlist

> A faith-centered digital sanctuary designed for the global body of Christ. Featuring an early-access waitlist, live community milestone tracker, direct stewardship donation card, and automated welcome emails.

---

## 🌟 Key Features

* **Cinematic Christian Sanctuary UI**: Built with React 19, Vite, and custom glassmorphism design tokens (deep obsidian, emerald, and gold palette).
* **Live Community Progress Tracker**: Real-time progress bar tracking the initial 50-believer launch cohort target with a live vertical activity ticker.
* **Support the Mission**: Secure direct bank transfer card with one-click clipboard copy and trust validation badges.
* **Full-Stack Waitlist Integration**: Supabase PostgreSQL database with Row-Level Security (RLS) and serverless Edge Functions.
* **Automated Welcome Emails**: Brevo Transactional Email API integration delivering personalized welcome messages.
* **Mobile-First Experience**: Fully responsive layout with floating mobile CTAs, skeleton loaders, and error boundaries.

---

## 🏗️ Architecture & Brevo Flow

```text
GraceGrid Frontend (React 19 + Vite)
        │
        ├──► CommunityProgressSection (Live 50-Believer Goal + Realtime Ticker)
        ├──► SupportMissionSection (Direct Bank Transfer Stewardship)
        └──► WaitlistSection (Optimistic Form + Confetti Celebration)
                 │
                 ▼
         services/waitlist.js
                 │
                 ▼
         Supabase Edge Function: join-waitlist
                 │
                 ├─► 1. Server-side Validation & Duplicate Check
                 ├─► 2. Insert into PostgreSQL public.waitlist (RLS Protected)
                 ├─► 3. Sync Contact into Brevo List (FIRSTNAME, FULLNAME, ROLE, DEV_PHASE)
                 └─► 4. Dispatch Brevo Welcome Email (Custom Template or Cinematic HTML)

                 ▼
         Supabase Edge Function: send-phase-update
                 │
                 └─► Broadcast Project Development Phase Updates via Brevo
```

---

## 📧 Email Automation System (Brevo + Supabase)

GraceGrid includes 3 fully automated, end-to-end email workflows:

### 1. 🕊️ Subscriber Welcome Email (Automatic on Signup)
When a believer joins the waitlist on the public landing page:
1. **PostgreSQL Insert**: Record saved into `public.waitlist`.
2. **Brevo Contact Sync**: Added to Brevo contact list with attributes (`FIRSTNAME`, `FULLNAME`, `ROLE`, `DEV_PHASE`, `INVITE_LINK`).
3. **Personalized Welcome Email**: Dispatched instantly via Brevo (`/v3/smtp/email`) with Christian greeting, assigned role confirmation, launch cohort progress info, and fellowship referral invite link.

### 2. 🔔 Admin Instant Signup Notification (Automatic on Signup)
Simultaneously when a new user registers:
1. An automated notification alert email is dispatched to the administrator (`ADMIN_ALERT_EMAIL`).
2. Details include: Subscriber Full Name, Email, Community Role, Live Cohort Progress (`X / 50 Believers`), and a direct 1-click button to open the **Admin Dashboard**.

### 3. 📢 Project Development Phase Broadcasts
When the team reaches a new milestone (e.g. *Phase 2: Closed Alpha*):
1. **Interactive Admin Composer**: Compose update subject, headline, progress message, and accomplishment highlights in `/gracegrid-admin/dashboard` under the *Pass Phase Updates* tab.
2. **Target Segmentation**: Broadcast to *All Subscribers*, *Believers*, *Pastors*, *Group Leaders*, or *Students*.
3. **Test Preview**: Send an instant test preview to the admin inbox before broadcasting.
4. **Mass Delivery**: Batched dispatch via Supabase Edge Function `send-phase-update` and Brevo API.


### 3. Broadcasting Project Development Phase Updates
You can send development phase updates to your waitlist subscribers in two ways:

#### Option A: Directly from Brevo Dashboard (Email Campaigns)
1. Go to **Brevo Dashboard** > **Campaigns** > **Email**.
2. Click **Create an email campaign**.
3. Choose your recipients: Select your **GraceGrid Waitlist** contact list (or segment by `ROLE`).
4. Design your project phase update (e.g., *Phase 2: Closed Alpha & Scripture Feed Announcement*).
5. Schedule or Send immediately!

#### Option B: Automated via `send-phase-update` Edge Function
You can trigger phase updates programmatically or via cURL:
```bash
curl -X POST https://<your-project-ref>.supabase.co/functions/v1/send-phase-update \
  -H "Content-Type: application/json" \
  -H "x-admin-key: <YOUR_ADMIN_API_KEY>" \
  -d '{
    "phaseName": "Phase 2: Closed Alpha & Scripture Feed",
    "subject": "🕊️ GraceGrid Update: We have entered Phase 2!",
    "headline": "Alpha Testing Is Live for Early Believers",
    "message": "We have completed the foundation and are rolling out private alpha invites for interactive prayer circles and scripture feeds.",
    "highlights": [
      "Ultra-low latency livestreaming engine completed",
      "Interactive prayer circle rooms live in alpha",
      "Pastor sermon management portal ready for test cohorts"
    ],
    "ctaText": "View Community Progress",
    "ctaUrl": "https://gracegrid.app/#community-progress"
  }'
```
> **Tip**: To send a test preview to yourself before mass broadcasting, add `"testEmail": "your-email@example.com"` to the JSON payload.

---

## ⚙️ Brevo Configuration & Edge Function Secrets

Configure your secrets in Supabase via the CLI or Supabase Dashboard (**Project Settings > Edge Functions > Secrets**):

```bash
# Set Brevo Secrets
npx supabase secrets set \
  BREVO_API_KEY="xkeysib-your-brevo-api-key" \
  BREVO_LIST_ID="2" \
  BREVO_TEMPLATE_ID="1" \
  BREVO_SENDER_EMAIL="welcome@gracegrid.app" \
  BREVO_SENDER_NAME="GraceGrid Sanctuary" \
  ADMIN_API_KEY="your-secure-admin-secret"
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Populate your client-safe variables:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

---

## 🛡️ Security & Privacy
* **Database RLS**: Public anonymous visitors are restricted to `INSERT` only. Direct table `SELECT`, `UPDATE`, and `DELETE` are disabled.
* **Safe Counter RPC**: Total subscriber count is calculated via a `SECURITY DEFINER` function without exposing subscriber names or email addresses.
* **Zero Client Secret Exposure**: Admin keys (`SUPABASE_SERVICE_ROLE_KEY`) and `BREVO_API_KEY` are stored strictly within Supabase Edge Function secrets.

---

## 📄 License
MIT License. Built for the Kingdom.
