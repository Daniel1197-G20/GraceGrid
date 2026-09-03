/**
 * Integration Test for Support Milestones and Live Progress Bar
 * Tests:
 * 1. Fetching live support milestones from Supabase
 * 2. Testing record_support_donation RPC with live persistence
 * 3. Testing admin_update_milestone RPC
 * 4. Cleaning up test data
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Read .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(
  envContent
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function runTests() {
  console.log('\n--- 1. Testing get_support_milestones RPC ---');
  const { data: milestones, error: mErr } = await supabase.rpc('get_support_milestones');
  if (mErr) {
    console.error('FAIL: Could not fetch milestones:', mErr);
    process.exit(1);
  }
  console.log('SUCCESS: Retrieved milestones from Supabase:', milestones);

  const domainBefore = milestones.find((m) => m.id === 'domain');
  console.log(`Domain milestone before: ₦${domainBefore.raised} / ₦${domainBefore.target} (${Math.round((domainBefore.raised / domainBefore.target) * 100)}%)`);

  console.log('\n--- 2. Testing record_support_donation RPC ---');
  const testRef = `test_live_check_${Date.now()}`;
  const testAmount = 1000;
  const { data: recData, error: recErr } = await supabase.rpc('record_support_donation', {
    p_amount: testAmount,
    p_email: 'verifier@gracegrid.app',
    p_donor_name: 'Live Verifier',
    p_reference: testRef,
    p_milestone_id: 'domain',
  });

  if (recErr) {
    console.error('FAIL: record_support_donation error:', recErr);
    process.exit(1);
  }
  console.log('SUCCESS: record_support_donation response:', recData);

  const domainAfter = recData.milestones.find((m) => m.id === 'domain');
  console.log(`Domain milestone after donation: ₦${domainAfter.raised} / ₦${domainAfter.target} (${Math.round((domainAfter.raised / domainAfter.target) * 100)}%)`);
  if (domainAfter.raised !== domainBefore.raised + testAmount) {
    console.error(`FAIL: Expected ${domainBefore.raised + testAmount} but got ${domainAfter.raised}`);
    process.exit(1);
  }
  console.log('SUCCESS: Live progress bar increased by ₦1,000!');

  console.log('\n--- 3. Testing donations table recording ---');
  const { data: donRows, error: donErr } = await supabase
    .from('donations')
    .select('*')
    .eq('reference', testRef);
  if (donErr || !donRows || donRows.length === 0) {
    console.error('FAIL: Donation row was not saved in donations table:', donErr);
    process.exit(1);
  }
  console.log('SUCCESS: Donation recorded in audit table:', donRows[0]);

  console.log('\n--- 4. Testing admin_update_milestone RPC ---');
  const { data: adminRes, error: adminErr } = await supabase.rpc('admin_update_milestone', {
    p_id: 'domain',
    p_raised: domainBefore.raised, // restore to original value
  });
  if (adminErr) {
    console.error('FAIL: admin_update_milestone error:', adminErr);
    process.exit(1);
  }
  console.log('SUCCESS: admin_update_milestone successfully restored raised amount:', adminRes);

  // Clean up test donation record
  await supabase.from('donations').delete().eq('reference', testRef);

  console.log('\n--- 5. Verifying restored state ---');
  const { data: finalMilestones } = await supabase.rpc('get_support_milestones');
  const domainFinal = finalMilestones.find((m) => m.id === 'domain');
  console.log(`Domain milestone final: ₦${domainFinal.raised} / ₦${domainFinal.target}`);

  console.log('\n✅ ALL SUPPORT MILESTONE LIVE PROGRESS BAR TESTS PASSED!\n');
}

runTests().catch((err) => {
  console.error('Test suite exception:', err);
  process.exit(1);
});
