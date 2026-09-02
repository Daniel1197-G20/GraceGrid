#!/usr/bin/env node

/**
 * GraceGrid Brevo Email Automation Test Suite
 * 
 * Tests the 3 core email automation flows:
 * 1. Subscriber Welcome Email
 * 2. Admin Signup Alert Email
 * 3. Project Phase Update Broadcast Email
 * 
 * Usage:
 *   node scripts/test-brevo.js --api-key="xkeysib-..." --email="you@example.com"
 * 
 * Or with environment variables (.env.local or process.env):
 *   npm run test:brevo
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, curr) => {
  if (curr.startsWith('--')) {
    const [key, value] = curr.replace(/^--/, '').split('=');
    acc[key] = value || true;
  }
  return acc;
}, {});

// Load from .env.local, .env, or supabase/.env.real if exists
let envFileVars = {};
for (const envPath of ['.env.local', '.env', 'supabase/.env.real']) {
  const fullPath = resolve(process.cwd(), envPath);
  if (existsSync(fullPath)) {
    const content = readFileSync(fullPath, 'utf8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [k, ...v] = trimmed.split('=');
        if (k && v.length) {
          envFileVars[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
  }
}

const apiKey = args['api-key'] || process.env.BREVO_API_KEY || envFileVars.BREVO_API_KEY;
const listIdStr = args['list-id'] || process.env.BREVO_LIST_ID || envFileVars.BREVO_LIST_ID;
const testEmail = args['email'] || args['test-email'] || process.env.TEST_EMAIL || envFileVars.TEST_EMAIL || envFileVars.ADMIN_NOTIFICATION_EMAIL || envFileVars.VITE_ADMIN_EMAIL;
const senderEmail = args['sender-email'] || process.env.BREVO_SENDER_EMAIL || envFileVars.BREVO_SENDER_EMAIL || 'gracegrid4@gmail.com';
const senderName = args['sender-name'] || process.env.BREVO_SENDER_NAME || envFileVars.BREVO_SENDER_NAME || 'GraceGrid Sanctuary';

console.log('\n🕊️  GraceGrid — Complete Email Automation Test Suite');
console.log('===========================================================');

if (!apiKey) {
  console.log('ℹ️  No BREVO_API_KEY found in arguments or .env.local.');
  console.log('   To send live test emails, provide your API key:');
  console.log('   node scripts/test-brevo.js --api-key="xkeysib-..." --email="you@example.com"\n');
  console.log('   Or add BREVO_API_KEY to your Supabase Edge Function secrets:');
  console.log('   npx supabase secrets set BREVO_API_KEY="xkeysib-..."\n');
  process.exit(0);
}

const headers = {
  'accept': 'application/json',
  'api-key': apiKey,
  'content-type': 'application/json',
};

async function runTests() {
  console.log(`📡 Testing Brevo API Connection (Sender: ${senderName} <${senderEmail}>)...`);
  
  try {
    const accountRes = await fetch('https://api.brevo.com/v3/account', { headers });
    if (!accountRes.ok) {
      console.error(`❌ Authentication Failed (HTTP ${accountRes.status}):`, await accountRes.text());
      return;
    }
    const account = await accountRes.json();
    console.log(`✅ Connected to Brevo Account: ${account.email} (${account.companyName || 'GraceGrid'})`);
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    return;
  }

  const targetEmail = testEmail || 'admin@gracegrid.app';

  // 1. Test Subscriber Welcome Email
  console.log(`\n[1/3] ✉️  Testing Subscriber Welcome Email to: ${targetEmail}...`);
  try {
    const welcomePayload = {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: targetEmail, name: 'Praise Victor' }],
      subject: '🕊️ Welcome to GraceGrid — Your Early Access Confirmation',
      htmlContent: `
        <div style="background-color: #062c19; color: #f0fdf4; padding: 32px; border-radius: 16px; font-family: sans-serif; max-width: 600px; margin: auto;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 36px;">🕊️</div>
            <span style="display: inline-block; padding: 4px 12px; background: rgba(212,175,55,0.2); border: 1px solid #d4af37; border-radius: 999px; color: #fef08a; font-size: 11px; font-weight: 700; text-transform: uppercase;">Phase 1: Pre-Launch Sanctuary</span>
            <h1 style="color: #ffffff; font-size: 24px; margin: 12px 0 4px;">Welcome to GraceGrid</h1>
          </div>
          <p>Grace and peace to you, <strong>Praise</strong>,</p>
          <p>Thank you for stepping into the early access waitlist for <strong>GraceGrid</strong> — a faith-driven digital sanctuary for live worship and biblical fellowship.</p>
          <div style="background: rgba(0,0,0,0.3); border: 1px solid #16a34a; border-radius: 10px; padding: 16px; margin: 20px 0;">
            <div style="margin-bottom: 6px;"><strong>Community Role:</strong> BELIEVER</div>
            <div style="margin-bottom: 6px;"><strong>Status:</strong> <span style="color: #4ade80;">CONFIRMED</span></div>
            <div><strong>Launch Cohort Goal:</strong> 50 Believers Target</div>
          </div>
          <a href="https://gracegrid.app" style="display: block; text-align: center; background: #16a34a; color: #ffffff; text-decoration: none; padding: 14px 20px; border-radius: 8px; font-weight: 700; margin: 20px 0;">Share Fellowship Invite Link</a>
          <p style="font-size: 12px; color: #86efac; text-align: center;">© ${new Date().getFullYear()} GraceGrid. Designed for the global body of Christ.</p>
        </div>
      `,
    };

    const welcomeRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers,
      body: JSON.stringify(welcomePayload),
    });

    if (welcomeRes.ok) {
      const resData = await welcomeRes.json();
      console.log(`✅ [1/3] Subscriber Welcome Email Dispatched! (Message ID: ${resData.messageId})`);
    } else {
      console.warn(`⚠️  Welcome Email response (${welcomeRes.status}):`, await welcomeRes.text());
    }
  } catch (err) {
    console.error('❌ Welcome email error:', err.message);
  }

  // 2. Test Admin Signup Notification Alert Email
  console.log(`\n[2/3] 🔔 Testing Admin Signup Alert Email to: ${targetEmail}...`);
  try {
    const adminAlertPayload = {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: targetEmail, name: 'GraceGrid Admin' }],
      subject: '🔔 New GraceGrid Waitlist Signup: Praise Victor Egbaunu (pastor)',
      htmlContent: `
        <div style="background-color: #021c0d; color: #f0fdf4; padding: 32px; border-radius: 16px; font-family: sans-serif; max-width: 600px; margin: auto; border: 1.5px solid #22c55e55;">
          <div style="text-align: center; margin-bottom: 16px;">
            <span style="display: inline-block; padding: 4px 12px; background: rgba(34, 197, 94, 0.2); border: 1px solid #4ade80; border-radius: 999px; color: #86efac; font-size: 11px; font-weight: 700; text-transform: uppercase;">🔔 Admin Notification Alert</span>
            <h1 style="color: #ffffff; font-size: 22px; margin: 10px 0 0;">New Believer Joined Waitlist</h1>
          </div>
          <p>A new subscriber has registered for early access:</p>
          <div style="background: rgba(0,0,0,0.35); border: 1px solid rgba(34,197,94,0.3); border-radius: 10px; padding: 16px; margin: 16px 0;">
            <div style="margin-bottom: 8px;"><strong>Full Name:</strong> Praise Victor Egbaunu</div>
            <div style="margin-bottom: 8px;"><strong>Email:</strong> ${targetEmail}</div>
            <div style="margin-bottom: 8px;"><strong>Role:</strong> <span style="color: #fef08a;">PASTOR / MINISTER</span></div>
            <div><strong>Registered At:</strong> ${new Date().toUTCString()}</div>
          </div>
          <div style="background: rgba(5,46,22,0.8); border: 1px solid #d4af37; border-radius: 10px; padding: 14px; text-align: center; margin: 16px 0;">
            <div style="font-size: 12px; color: #fef08a; font-weight: 700; text-transform: uppercase;">Launch Cohort Target</div>
            <div style="font-size: 24px; font-weight: 900; color: #ffffff; margin: 4px 0;">25 / 50 <span style="font-size: 15px; color: #4ade80;">(50%)</span></div>
            <div style="font-size: 12px; color: #86efac;">25 spots remaining</div>
          </div>
          <a href="https://gracegrid.app/gracegrid-admin/dashboard" style="display: block; text-align: center; background: #16a34a; color: #ffffff; text-decoration: none; padding: 14px 20px; border-radius: 8px; font-weight: 700; margin: 20px 0;">Open Admin Dashboard</a>
          <p style="font-size: 11px; color: #4ade8088; text-align: center;">GraceGrid Automated Sentinel &bull; PostgreSQL Protected</p>
        </div>
      `,
    };

    const adminRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers,
      body: JSON.stringify(adminAlertPayload),
    });

    if (adminRes.ok) {
      const resData = await adminRes.json();
      console.log(`✅ [2/3] Admin Signup Alert Dispatched! (Message ID: ${resData.messageId})`);
    } else {
      console.warn(`⚠️  Admin Alert Email response (${adminRes.status}):`, await adminRes.text());
    }
  } catch (err) {
    console.error('❌ Admin alert email error:', err.message);
  }

  // 3. Test Phase Update Broadcast Email
  console.log(`\n[3/3] 📢 Testing Phase Update Broadcast Email to: ${targetEmail}...`);
  try {
    const broadcastPayload = {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: targetEmail, name: 'Praise Victor' }],
      subject: '🕊️ GraceGrid Update: Phase 2 Closed Alpha & Scripture Feed',
      htmlContent: `
        <div style="background-color: #062c19; color: #f0fdf4; padding: 32px; border-radius: 16px; font-family: sans-serif; max-width: 600px; margin: auto;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 36px;">🕊️</div>
            <span style="display: inline-block; padding: 4px 12px; background: rgba(212,175,55,0.2); border: 1px solid #d4af37; border-radius: 999px; color: #fef08a; font-size: 11px; font-weight: 700; text-transform: uppercase;">Phase 2: Closed Alpha</span>
            <h1 style="color: #ffffff; font-size: 24px; margin: 12px 0 4px;">Alpha Testing Is Live for Early Believers</h1>
          </div>
          <p>Grace and peace to you, <strong>Praise</strong>,</p>
          <p>We have completed the foundational architecture and are rolling out closed alpha testing for interactive prayer circles and scripture feeds.</p>
          <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(22,163,74,0.4); border-radius: 10px; padding: 18px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px; color: #86efac; font-size: 14px; text-transform: uppercase;">Phase Accomplishments</h3>
            <ul style="margin: 0; padding-left: 18px; line-height: 1.6;">
              <li>Ultra-low latency livestreaming engine completed</li>
              <li>Interactive prayer circle rooms live in alpha testing</li>
              <li>Pastor sermon management portal ready for test cohorts</li>
            </ul>
          </div>
          <a href="https://gracegrid.app/#community-progress" style="display: block; text-align: center; background: #16a34a; color: #ffffff; text-decoration: none; padding: 14px 20px; border-radius: 8px; font-weight: 700; margin: 20px 0;">View Community Progress</a>
          <p style="font-size: 12px; color: #86efac; text-align: center;">© ${new Date().getFullYear()} GraceGrid. Building a sacred digital sanctuary for the body of Christ.</p>
        </div>
      `,
    };

    const broadcastRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers,
      body: JSON.stringify(broadcastPayload),
    });

    if (broadcastRes.ok) {
      const resData = await broadcastRes.json();
      console.log(`✅ [3/3] Phase Update Broadcast Email Dispatched! (Message ID: ${resData.messageId})`);
    } else {
      console.warn(`⚠️  Phase Broadcast response (${broadcastRes.status}):`, await broadcastRes.text());
    }
  } catch (err) {
    console.error('❌ Phase broadcast email error:', err.message);
  }

  console.log('\n===========================================================');
  console.log('🎉 All 3 email automation test dispatches executed!');
  console.log(`👉 Check inbox: ${targetEmail}\n`);
}

runTests();
