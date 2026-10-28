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

describe('KPF Strict RBAC & Single-Admin Safeguard Suite', () => {
  it('1. Rendered /login page contains NO demo credentials, credentials hints, or autofill buttons', async () => {
    const res = await fetch(`${BASE_URL}/login`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();

    // Verify correct branding
    assert.ok(html.includes('Kasthuri Poultry Farm'), 'Must have full branding');
    assert.ok(html.includes('KPF'), 'Must have short branding');
    assert.ok(html.includes('Staff Credential Login'), 'Must have staff login title');

    // Verify absolute absence of demo credentials, sample cards, and autofill buttons
    const forbiddenStrings = [
      'Kasthuri@2026',
      'Manager@2026',
      '1-Tap',
      'Evaluation Demo Accounts',
      'Demo Account',
      'Sample Credentials',
      'Quick Fill',
      'Autofill',
      'demo_admin',
      'demo_manager',
      'Demo Login',
    ];

    for (const forbidden of forbiddenStrings) {
      assert.ok(
        !html.toLowerCase().includes(forbidden.toLowerCase()),
        `Forbidden demo text found in login HTML: "${forbidden}"`
      );
    }
  });

  it('2. Manager login establishes genuine manager session and cookies', async () => {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'manager.layer@kasthuripoultry.com',
        password: 'Manager@2026',
      }),
    });

    assert.strictEqual(loginRes.status, 200);
    const data = await loginRes.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.role, 'manager');

    // Extract cookie
    const cookie = extractCookieHeader(loginRes);
    assert.ok(cookie.includes('kpf_session'), 'Must set kpf_session cookie');

    // Verify session endpoint returns manager
    const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: { Cookie: cookie },
    });
    assert.strictEqual(sessionRes.status, 200);
    const sessionData = await sessionRes.json();
    assert.strictEqual(sessionData.role, 'manager');
  });

  it('3. Manager CANNOT access Admin-only API /api/users (403 Forbidden)', async () => {
    // Login as manager
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'manager.layer@kasthuripoultry.com',
        password: 'Manager@2026',
      }),
    });
    const cookie = extractCookieHeader(loginRes);

    // Attempt GET /api/users
    const usersGetRes = await fetch(`${BASE_URL}/api/users`, {
      headers: { Cookie: cookie },
    });
    assert.strictEqual(usersGetRes.status, 403, 'Manager GET /api/users must be 403 Forbidden');

    // Attempt POST /api/users
    const usersPostRes = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        email: 'attacker@kasthuripoultry.com',
        full_name: 'Attacker Admin',
        role: 'owner_admin',
        password: 'HackedPassword123!',
      }),
    });
    assert.strictEqual(usersPostRes.status, 403, 'Manager POST /api/users must be 403 Forbidden');

    // Attempt PATCH /api/users (self-promotion)
    const usersPatchRes = await fetch(`${BASE_URL}/api/users`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        id: 'u-mgr-1',
        role: 'owner_admin',
      }),
    });
    assert.strictEqual(usersPatchRes.status, 403, 'Manager PATCH /api/users must be 403 Forbidden');
  });

  it('4. Role-spoofing in login payload is rejected and does not escalate privilege', async () => {
    // Attempt to pass requestedRole: 'owner_admin' while logging in as manager
    const spoofRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'manager.layer@kasthuripoultry.com',
        password: 'Manager@2026',
        requestedRole: 'owner_admin',
        role: 'owner_admin',
      }),
    });

    assert.strictEqual(spoofRes.status, 200);
    const data = await spoofRes.json();
    assert.strictEqual(data.role, 'manager', 'Role must NOT be escalated to owner_admin');

    const cookie = extractCookieHeader(spoofRes);
    assert.ok(cookie.includes('kpf_role=manager'), 'Cookie role must be manager');
  });

  it('5. Tampered cookie with fake owner_admin role is rejected by session validation', async () => {
    // Fake a session token with forged role
    const forgedToken = Buffer.from(
      JSON.stringify({
        userId: 'u-fake',
        role: 'owner_admin',
        exp: Date.now() + 86400000,
        sig: 'badsignature123',
      })
    ).toString('base64');

    const forgedCookie = `kpf_session=${forgedToken}; kpf_role=owner_admin; kpf_user_id=u-fake`;

    const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: { Cookie: forgedCookie },
    });

    const data = await sessionRes.json();
    assert.strictEqual(data.authenticated, false, 'Forged session token must be rejected');
  });

  it('6. Owner/Admin login works and allows access to /api/users', async () => {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'owner@kasthuripoultry.com',
        password: 'Kasthuri@2026',
      }),
    });

    assert.strictEqual(loginRes.status, 200);
    const data = await loginRes.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.role, 'owner_admin');

    const cookie = extractCookieHeader(loginRes);
    const usersRes = await fetch(`${BASE_URL}/api/users`, {
      headers: { Cookie: cookie },
    });
    assert.strictEqual(usersRes.status, 200, 'Owner/Admin must have access to /api/users');
  });

  it('7. Single-Admin safeguard blocks demoting or deactivating the last active Admin', async () => {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'owner@kasthuripoultry.com',
        password: 'Kasthuri@2026',
      }),
    });
    const cookie = extractCookieHeader(loginRes);

    // Attempt to demote the sole active owner_admin
    const demoteRes = await fetch(`${BASE_URL}/api/users`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        id: 'u-owner-1',
        role: 'manager',
      }),
    });

    assert.strictEqual(demoteRes.status, 400, 'Must reject demotion of the last active Admin');
    const demoteData = await demoteRes.json();
    assert.ok(
      demoteData.error.includes('Safeguard Violation'),
      'Must return Safeguard Violation error'
    );
  });
});
