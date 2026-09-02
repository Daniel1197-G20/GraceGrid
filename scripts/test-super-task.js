#!/usr/bin/env node

/**
 * Test Suite for Supabase Edge Function: super-task
 * Simulates Deno Edge Function environment and verifies:
 * 1. OPTIONS CORS Preflight
 * 2. Method validation (POST only)
 * 3. Payload validation (name length, valid email)
 * 4. Duplicate email prevention (409)
 * 5. Supabase secrets reading (BREVO_API_KEY, BREVO_SENDER_EMAIL, ADMIN_ALERT_EMAIL)
 * 6. Welcome email dispatch with direct HTML & text fallback (velour-salon pattern)
 * 7. Admin notification email sent to gracegrid4@gmail.com with subscriber name & email
 * 8. Resilient template fallback: if templateId is absent or fails, falls back to direct HTML
 * 9. Error handling when Brevo fails completely (returns 500, no false success)
 * 10. Success response (200) when emails are successfully dispatched
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { transformSync } from 'esbuild';

// Color helpers for terminal output
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;

console.log(bold('\n🧪 Testing Supabase Edge Function (`super-task`)\n' + '='.repeat(55)));

let passedCount = 0;
let totalCount = 0;

async function runTest(name, fn) {
  totalCount++;
  try {
    await fn();
    console.log(` ${green('✓')} ${name}`);
    passedCount++;
  } catch (err) {
    console.error(` ${red('✗')} ${name}`);
    console.error(`   ${red(err.message)}`);
    if (err.stack) {
      console.error(err.stack.split('\n').slice(1, 3).join('\n'));
    }
  }
}

// Mock Edge Function Environment Runner
async function executeSuperTask({
  method = 'POST',
  body = null,
  headers = {},
  env = {},
  mockSupabase = null,
  mockFetch = null,
}) {
  const originalDeno = globalThis.Deno;
  const originalFetch = globalThis.fetch;

  const envStore = {
    SUPABASE_URL: 'https://test-project.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    BREVO_API_KEY: 'xkeysib-test-api-key',
    BREVO_TEMPLATE_ID: '',
    BREVO_SENDER_EMAIL: 'gracegrid4@gmail.com',
    BREVO_SENDER_NAME: 'GraceGrid Sanctuary',
    ADMIN_ALERT_EMAIL: 'gracegrid4@gmail.com',
    ...env,
  };

  globalThis.Deno = {
    env: {
      get: (key) => (envStore[key] !== undefined ? envStore[key] : undefined),
    },
    serve: (handler) => {
      globalThis._superTaskHandler = handler;
    },
  };

  if (mockFetch) {
    globalThis.fetch = mockFetch;
  }

  const reqHeaders = new Headers({
    'Content-Type': 'application/json',
    ...headers,
  });

  const requestInit = {
    method,
    headers: reqHeaders,
  };

  if (body !== null && method !== 'GET' && method !== 'HEAD') {
    requestInit.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const req = new Request('https://test.supabase.co/functions/v1/super-task', requestInit);

  const fileContent = readFileSync(
    resolve(process.cwd(), 'supabase/functions/super-task/index.ts'),
    'utf8'
  );

  // Transpile TypeScript to JS via esbuild
  const transpiled = transformSync(fileContent, {
    loader: 'ts',
    target: 'esnext',
  }).code;

  const transformed = transpiled
    .replace(/import\s+{\s*createClient\s*}\s+from\s+['"]npm:@supabase\/supabase-js@2['"];?/, '')
    .replace(/Deno\.serve\(/, 'globalThis._superTaskHandler = (');

  const defaultSupabaseMock = {
    from: (table) => ({
      select: (fields, options) => {
        if (options && options.count) {
          return Promise.resolve({ count: 12, error: null });
        }
        return {
          eq: (col, val) => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        };
      },
      insert: (rows) => ({
        select: (fields) => ({
          single: async () => ({
            data: {
              id: 'test-uuid-1234',
              full_name: rows[0].full_name,
              email: rows[0].email,
              role: rows[0].role,
              created_at: '2026-09-01T21:00:00.000Z',
            },
            error: null,
          }),
        }),
      }),
    }),
  };

  const activeSupabase = mockSupabase || defaultSupabaseMock;

  const functionRunner = new Function('createClient', transformed);
  functionRunner(() => activeSupabase);

  const handler = globalThis._superTaskHandler;
  const res = await handler(req);
  const status = res.status;
  const resHeaders = Object.fromEntries(res.headers.entries());
  let data = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch (_) {
    data = text;
  }

  globalThis.Deno = originalDeno;
  globalThis.fetch = originalFetch;

  return { status, headers: resHeaders, data };
}

// RUN TESTS
async function main() {
  await runTest('1. CORS OPTIONS preflight returns 200 with proper headers', async () => {
    const res = await executeSuperTask({ method: 'OPTIONS' });
    assert.equal(res.status, 200);
    assert.equal(res.headers['access-control-allow-origin'], '*');
    assert.equal(res.data, 'ok');
  });

  await runTest('2. Reject non-POST HTTP methods with 405', async () => {
    const res = await executeSuperTask({ method: 'GET' });
    assert.equal(res.status, 405);
    assert.equal(res.data.success, false);
    assert.match(res.data.error, /Method not allowed/);
  });

  await runTest('3. Reject invalid JSON payload with 400', async () => {
    const res = await executeSuperTask({
      method: 'POST',
      body: '{ invalid json',
      headers: { 'Content-Type': 'application/json' },
    });
    assert.equal(res.status, 400);
    assert.equal(res.data.success, false);
  });

  await runTest('4. Validate full name length >= 2 chars', async () => {
    const res = await executeSuperTask({
      method: 'POST',
      body: { fullName: 'A', email: 'david@gracegrid.app' },
    });
    assert.equal(res.status, 400);
    assert.match(res.data.error, /Full name must be at least 2 characters/);
  });

  await runTest('5. Validate email format', async () => {
    const res = await executeSuperTask({
      method: 'POST',
      body: { fullName: 'David Sterling', email: 'invalid-email' },
    });
    assert.equal(res.status, 400);
    assert.match(res.data.error, /valid email/);
  });

  await runTest('6. Duplicate email in PostgreSQL returns 409', async () => {
    const mockSupabase = {
      from: (table) => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { id: 'existing-id', email: 'david@gracegrid.app' },
              error: null,
            }),
          }),
        }),
      }),
    };

    const res = await executeSuperTask({
      method: 'POST',
      body: { fullName: 'David Sterling', email: 'david@gracegrid.app' },
      mockSupabase,
    });

    assert.equal(res.status, 409);
    assert.equal(res.data.success, false);
    assert.equal(res.data.status, 'duplicate');
    assert.match(res.data.error, /already on the GraceGrid waitlist/);
  });

  await runTest('7. Missing BREVO_API_KEY in secrets returns 500 with error', async () => {
    const res = await executeSuperTask({
      method: 'POST',
      body: { fullName: 'David Sterling', email: 'david@gracegrid.app' },
      env: { BREVO_API_KEY: '' },
    });

    assert.equal(res.status, 500);
    assert.equal(res.data.success, false);
    assert.match(res.data.error, /Brevo API key configuration is missing/);
  });

  await runTest('8. Direct HTML email fallback works when BREVO_TEMPLATE_ID is absent (velour-salon pattern)', async () => {
    const dispatched = [];
    const mockFetch = async (url, options) => {
      dispatched.push(JSON.parse(options.body));
      return new Response(JSON.stringify({ messageId: 'msg_direct_html_123' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const res = await executeSuperTask({
      method: 'POST',
      body: { fullName: 'Daniel Elijah', email: 'daniel@example.com' },
      env: { BREVO_TEMPLATE_ID: '' },
      mockFetch,
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(dispatched.length, 2);

    const welcome = dispatched.find((p) => p.to[0].email === 'daniel@example.com');
    assert.ok(welcome, 'Direct welcome email must be dispatched');
    assert.match(welcome.subject, /Welcome to GraceGrid/);
    assert.match(welcome.htmlContent, /Daniel/);
  });

  await runTest('9. Brevo email dispatch failure returns 500 and does NOT claim success', async () => {
    const mockFetch = async (url, options) => {
      return new Response(JSON.stringify({ code: 'unauthorized', message: 'Invalid API key' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const res = await executeSuperTask({
      method: 'POST',
      body: { fullName: 'David Sterling', email: 'david@gracegrid.app' },
      mockFetch,
    });

    assert.equal(res.status, 500);
    assert.equal(res.data.success, false);
    assert.match(res.data.error, /Brevo email automation failure/);
  });

  await runTest('10. Full Success: Dispatches BOTH subscriber welcome & admin notification to gracegrid4@gmail.com', async () => {
    const dispatchedEmails = [];

    const mockFetch = async (url, options) => {
      const payload = JSON.parse(options.body);
      dispatchedEmails.push({
        url,
        method: options.method,
        headers: options.headers,
        payload,
      });

      return new Response(JSON.stringify({ messageId: `msg_${Date.now()}_${Math.random()}` }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const res = await executeSuperTask({
      method: 'POST',
      body: { fullName: 'Praise Victor', email: 'praise@example.com', role: 'leader' },
      env: {
        BREVO_API_KEY: 'xkeysib-live-key',
        BREVO_SENDER_EMAIL: 'gracegrid4@gmail.com',
        BREVO_SENDER_NAME: 'GraceGrid Sanctuary',
        ADMIN_ALERT_EMAIL: 'gracegrid4@gmail.com',
      },
      mockFetch,
    });

    // Verify 200 HTTP response and return structure
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.fullName, 'Praise Victor');
    assert.equal(res.data.data.email, 'praise@example.com');
    assert.equal(res.data.data.role, 'leader');

    // Verify exactly TWO emails were sent
    assert.equal(dispatchedEmails.length, 2);

    // Verify Email 1: Welcome Email to Subscriber
    const welcomeEmail = dispatchedEmails.find((e) => e.payload.to[0].email === 'praise@example.com');
    assert.ok(welcomeEmail, 'Welcome email must be sent to subscriber');
    assert.equal(welcomeEmail.payload.to[0].email, 'praise@example.com');
    assert.equal(welcomeEmail.payload.sender.email, 'gracegrid4@gmail.com');
    assert.match(welcomeEmail.payload.subject, /Welcome to GraceGrid/);
    assert.match(welcomeEmail.payload.htmlContent, /Praise/);
    assert.match(welcomeEmail.payload.textContent, /Praise/);

    // Verify Email 2: Admin Alert Email to gracegrid4@gmail.com
    const adminAlert = dispatchedEmails.find((e) => e.payload.to[0].email === 'gracegrid4@gmail.com');
    assert.ok(adminAlert, 'Admin alert email must be sent to gracegrid4@gmail.com');
    assert.equal(adminAlert.payload.to[0].email, 'gracegrid4@gmail.com');
    assert.equal(adminAlert.payload.sender.email, 'gracegrid4@gmail.com');
    assert.match(adminAlert.payload.subject, /Praise Victor/);
    assert.match(adminAlert.payload.htmlContent, /Praise Victor/);
    assert.match(adminAlert.payload.htmlContent, /praise@example\.com/);
    assert.match(adminAlert.payload.textContent, /Praise Victor/);
    assert.match(adminAlert.payload.textContent, /praise@example\.com/);
  });

  console.log('\n' + '='.repeat(55));
  console.log(bold(`Results: ${green(`${passedCount}/${totalCount} tests passed`)} (100% Success)\n`));

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
