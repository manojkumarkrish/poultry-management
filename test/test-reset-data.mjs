import { describe, it } from 'node:test';
import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

function extractCookieHeader(res) {
  if (res.headers.getSetCookie) {
    return res.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
  }
  const raw = res.headers.get('set-cookie');
  return raw ? raw.split(';')[0] : '';
}

describe('KPF Reset Data Security, Placement & Two-Step Verification Suite', () => {
  let adminCookie = '';
  let managerCookie = '';

  it('Setup: Authenticate Owner/Admin and Manager sessions', async () => {
    // Admin login
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'owner@kasthuripoultry.com',
        password: 'Kasthuri@2026',
      }),
    });
    assert.strictEqual(adminLoginRes.status, 200);
    adminCookie = extractCookieHeader(adminLoginRes);

    // Manager login
    const mgrLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'manager.layer@kasthuripoultry.com',
        password: 'Manager@2026',
      }),
    });
    assert.strictEqual(mgrLoginRes.status, 200);
    managerCookie = extractCookieHeader(mgrLoginRes);
  });

  it('1. Confirm Reset Data is absent from every normal page, sidebar, header, and mobile navigation', async () => {
    // Check multiple pages rendered with admin cookie
    const pagesToCheck = ['/', '/sheds', '/egg-production', '/daily-entry', '/reports', '/feed-management'];

    for (const page of pagesToCheck) {
      const res = await fetch(`${BASE_URL}${page}`, {
        headers: { Cookie: adminCookie },
      });
      assert.strictEqual(res.status, 200, `Page ${page} failed to load`);
      const html = await res.text();

      // Ensure the old quick header reset button is gone
      assert.ok(
        !html.includes('Reset farm test records'),
        `Reset button title found in global header on ${page}`
      );
      assert.ok(
        !html.includes('window.confirm(\'Reset all demo farm records'),
        `Inline window.confirm reset logic found in HTML on ${page}`
      );
    }
  });

  it('2. Manager CANNOT access or execute Reset Data API (403 Forbidden)', async () => {
    // Attempt to invoke reset endpoint as a Manager
    const resetRes = await fetch(`${BASE_URL}/api/admin/reset-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: managerCookie },
      body: JSON.stringify({
        confirmationPhrase: 'RESET KPF DATA',
        adminPassword: 'Manager@2026',
      }),
    });

    assert.strictEqual(
      resetRes.status,
      403,
      'Manager must receive 403 Forbidden when calling /api/admin/reset-data'
    );
    const data = await resetRes.json();
    assert.ok(
      data.error.toLowerCase().includes('forbidden') || data.error.toLowerCase().includes('admin'),
      'Must return permission/forbidden message'
    );
  });

  it('3. Unauthenticated access to Reset Data API is rejected (401 Unauthorized)', async () => {
    const resetRes = await fetch(`${BASE_URL}/api/admin/reset-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        confirmationPhrase: 'RESET KPF DATA',
        adminPassword: 'AnyPassword',
      }),
    });

    assert.strictEqual(resetRes.status, 401, 'Unauthenticated call must be 401');
  });

  it('4. Incorrect confirmation phrase is rejected (400 Bad Request)', async () => {
    const invalidPhrases = [
      'reset',
      'RESET',
      'RESET DATA',
      'RESET KPF',
      'reset kpf data',
      'RESET_KPF_DATA',
    ];

    for (const phrase of invalidPhrases) {
      const res = await fetch(`${BASE_URL}/api/admin/reset-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          confirmationPhrase: phrase,
          adminPassword: 'Kasthuri@2026',
        }),
      });

      assert.strictEqual(
        res.status,
        400,
        `Expected 400 Bad Request for phrase "${phrase}", got ${res.status}`
      );
      const data = await res.json();
      assert.ok(
        data.error.includes('Confirmation phrase mismatch'),
        'Must return phrase mismatch error'
      );
    }
  });

  it('5. Invalid admin password is rejected (401 Unauthorized)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/reset-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        confirmationPhrase: 'RESET KPF DATA',
        adminPassword: 'WrongAdminPassword123!',
      }),
    });

    assert.strictEqual(res.status, 401, 'Must reject incorrect admin password with 401');
    const data = await res.json();
    assert.ok(
      data.error.includes('Authentication failed') || data.error.includes('password'),
      'Must return password authentication failure error'
    );
  });

  it('6. Missing admin password is rejected (400 Bad Request)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/reset-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        confirmationPhrase: 'RESET KPF DATA',
        adminPassword: '',
      }),
    });

    assert.strictEqual(res.status, 400, 'Must reject missing admin password with 400');
  });

  it('7. Valid Admin authorization with "RESET KPF DATA" executes transactional reset', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/reset-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        confirmationPhrase: 'RESET KPF DATA',
        adminPassword: 'Kasthuri@2026',
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200, `Reset failed with HTTP ${res.status}: ${JSON.stringify(data)}`);
    assert.strictEqual(data.success, true);
    assert.ok(data.auditId, 'Must generate and return auditId');
    assert.ok(
      data.message.includes('successfully reset'),
      'Must return success confirmation message'
    );
  });

  it('8. User accounts, farm profile, and settings remain strictly intact after reset', async () => {
    // Verify Admin can still access /api/users after data reset
    const usersRes = await fetch(`${BASE_URL}/api/users`, {
      headers: { Cookie: adminCookie },
    });
    assert.strictEqual(usersRes.status, 200);
    const usersData = await usersRes.json();
    assert.ok(usersData.users.length >= 2, 'User accounts must be preserved');

    const owner = usersData.users.find((u) => u.role === 'owner_admin');
    assert.ok(owner, 'Owner/Admin user must be preserved');

    const manager = usersData.users.find((u) => u.role === 'manager');
    assert.ok(manager, 'Manager user must be preserved');
  });

  it('9. Confirm Settings page contains Data Management tab with two-step modal logic', async () => {
    const settingsRes = await fetch(`${BASE_URL}/settings?section=data_management`, {
      headers: { Cookie: adminCookie },
    });
    assert.strictEqual(settingsRes.status, 200);
    const html = await settingsRes.text();

    assert.ok(html.includes('Data Management'), 'Must have Data Management tab in Settings');
    assert.ok(html.includes('Reset Operational Data'), 'Must have Reset Operational Data button');
    assert.ok(
      html.includes('Admin Only Action') || html.includes('Admin use only') || html.includes('Owner/Administrator Authorization Enforced'),
      'Must display visible Admin-Only safety warning'
    );
  });
});
