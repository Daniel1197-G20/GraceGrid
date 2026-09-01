#!/usr/bin/env node

/**
 * GraceGrid Brevo Integration Test Suite
 * 
 * Usage:
 *   node scripts/test-brevo.js --api-key="xkeysib-..." --list-id=2 --email="you@example.com"
 * 
 * Or with environment variables:
 *   BREVO_API_KEY="..." BREVO_LIST_ID="2" TEST_EMAIL="..." node scripts/test-brevo.js
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

// Try loading from .env.local or .env if exists
let envFileVars = {};
for (const envPath of ['.env.local', '.env']) {
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
const testEmail = args['email'] || args['test-email'] || process.env.TEST_EMAIL || envFileVars.TEST_EMAIL;
const senderEmail = args['sender-email'] || process.env.BREVO_SENDER_EMAIL || envFileVars.BREVO_SENDER_EMAIL || 'welcome@gracegrid.app';
const senderName = args['sender-name'] || process.env.BREVO_SENDER_NAME || envFileVars.BREVO_SENDER_NAME || 'GraceGrid Sanctuary';

console.log('\n🕊️  GraceGrid — Brevo Integration Test Suite');
console.log('==================================================');

if (!apiKey) {
  console.error('\n❌ ERROR: No Brevo API Key provided.');
  console.log('\nPlease run the test with your API key:');
  console.log('  node scripts/test-brevo.js --api-key="xkeysib-..." --list-id=2 --email="you@example.com"\n');
  console.log('Or set BREVO_API_KEY in your .env.local file.\n');
  process.exit(1);
}

const headers = {
  'accept': 'application/json',
  'api-key': apiKey,
  'content-type': 'application/json',
};

async function runTests() {
  let hasErrors = false;

  // 1. Test Brevo Account Authentication
  console.log('\n[1/4] 🔑 Testing Brevo API Key Authentication...');
  try {
    const accountRes = await fetch('https://api.brevo.com/v3/account', { headers });
    if (!accountRes.ok) {
      const errText = await accountRes.text();
      console.error(`❌ Authentication Failed (HTTP ${accountRes.status}):`, errText);
      return;
    }
    const account = await accountRes.json();
    console.log(`✅ API Key Valid! Connected to Brevo Account: ${account.email} (${account.companyName || 'GraceGrid'})`);
    console.log(`   Plan: ${account.plan?.[0]?.type || 'Standard'} | Relay Status: ${account.relay?.enabled ? 'Active' : 'Ready'}`);
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    return;
  }

  // 2. Test List ID Verification
  if (listIdStr) {
    console.log(`\n[2/4] 📋 Verifying Brevo List ID #${listIdStr}...`);
    try {
      const listRes = await fetch(`https://api.brevo.com/v3/contacts/lists/${listIdStr}`, { headers });
      if (!listRes.ok) {
        const errText = await listRes.text();
        console.error(`❌ List #${listIdStr} verification failed (HTTP ${listRes.status}):`, errText);
        console.log('   👉 Please double check your List ID in Brevo > Contacts > Lists');
        hasErrors = true;
      } else {
        const listData = await listRes.json();
        console.log(`✅ List Found: "${listData.name}" (Total Subscribers: ${listData.totalSubscribers || 0})`);
      }
    } catch (err) {
      console.error('❌ List check error:', err.message);
      hasErrors = true;
    }
  } else {
    console.log('\n[2/4] ⚠️  No BREVO_LIST_ID provided. Skipping list check.');
  }

  // 3. Test Contact Sync with Custom Attributes
  const targetEmail = testEmail || `test-fellowship-${Date.now()}@example.com`;
  console.log(`\n[3/4] 👤 Testing Contact Sync for: ${targetEmail}...`);
  try {
    const contactPayload = {
      email: targetEmail,
      attributes: {
        FIRSTNAME: 'TestDavid',
        FULLNAME: 'David Sterling',
        ROLE: 'believer',
        DEV_PHASE: 'Phase 1: Pre-Launch Sanctuary',
        INVITE_LINK: 'https://gracegrid.app/?ref=testdavid',
      },
      updateEnabled: true,
    };

    if (listIdStr && !isNaN(Number(listIdStr))) {
      contactPayload.listIds = [Number(listIdStr)];
    }

    const contactRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers,
      body: JSON.stringify(contactPayload),
    });

    if (contactRes.status === 201 || contactRes.status === 204 || contactRes.status === 200) {
      console.log(`✅ Contact successfully synced & added to List #${listIdStr || 'default'} with attributes.`);
    } else {
      const errText = await contactRes.text();
      console.warn(`⚠️  Contact Sync response (${contactRes.status}):`, errText);
      if (errText.includes('attribute') || errText.includes('ATTRIBUTE')) {
        console.log('   👉 Tip: Ensure custom attributes (FIRSTNAME, FULLNAME, ROLE, DEV_PHASE, INVITE_LINK) are created in Brevo > Contacts > Settings > Contact Attributes.');
      }
    }
  } catch (err) {
    console.error('❌ Contact sync error:', err.message);
  }

  // 4. Test Transactional Welcome Email Dispatch
  if (testEmail) {
    console.log(`\n[4/4] ✉️  Dispatching Test Welcome Email to: ${testEmail}...`);
    try {
      const emailPayload = {
        sender: { name: senderName, email: senderEmail },
        to: [{ email: testEmail, name: 'GraceGrid Tester' }],
        subject: '🕊️ [TEST] Welcome to GraceGrid Sanctuary',
        htmlContent: `
          <div style="background-color: #062c19; color: #f0fdf4; padding: 32px; border-radius: 12px; font-family: sans-serif;">
            <h1 style="color: #ffffff;">🕊️ Welcome to GraceGrid (Integration Test)</h1>
            <p>Grace and peace! This is a successful test of your <strong>Brevo Email Integration</strong> for GraceGrid.</p>
            <p>Your automatic waitlist welcome emails and development phase updates are ready to roll.</p>
            <div style="background: rgba(0,0,0,0.3); padding: 16px; border-radius: 8px; margin-top: 16px; border: 1px solid #16a34a;">
              <strong>Current Phase:</strong> Phase 1: Pre-Launch Sanctuary<br>
              <strong>List ID:</strong> #${listIdStr || 'None'}<br>
              <strong>Sender:</strong> ${senderName} &lt;${senderEmail}&gt;
            </div>
          </div>
        `,
      };

      const emailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers,
        body: JSON.stringify(emailPayload),
      });

      if (emailRes.ok) {
        const result = await emailRes.json();
        console.log(`✅ Welcome Email Dispatched Successfully! (Message ID: ${result.messageId})`);
        console.log(`   👉 Check the inbox at: ${testEmail}`);
      } else {
        const errText = await emailRes.text();
        console.error(`❌ Email dispatch failed (HTTP ${emailRes.status}):`, errText);
        if (errText.includes('sender') || errText.includes('unauthenticated')) {
          console.log(`   👉 Make sure sender "${senderEmail}" is verified under Brevo > Senders & IP.`);
        }
      }
    } catch (err) {
      console.error('❌ Email dispatch error:', err.message);
    }
  } else {
    console.log('\n[4/4] ℹ️  Pass --email="your-email@example.com" to test live email delivery to your inbox.');
  }

  console.log('\n==================================================');
  if (!hasErrors) {
    console.log('🎉 Brevo integration test suite finished successfully!\n');
  } else {
    console.log('⚠️  Completed with some warnings. Check the recommendations above.\n');
  }
}

runTests();
