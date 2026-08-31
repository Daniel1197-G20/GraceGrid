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

## 🏗️ Architecture

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
                 ├─► Server-side Validation & Duplicate Check
                 ├─► PostgreSQL public.waitlist (RLS Protected)
                 └─► Brevo Transactional Email (SMTP API)
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
VITE_SUPABASE_URL=https://uvwcnbxyqdgiuteabyeu.supabase.co
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
