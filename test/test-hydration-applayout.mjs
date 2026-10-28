import { describe, it } from 'node:test';
import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

function extractCookies(res) {
  if (res.headers.getSetCookie) {
    return res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  }
  const raw = res.headers.get('set-cookie');
  return raw ? raw.split(';')[0] : '';
}

describe('KPF AppLayout Hydration, SSR Structure & Role-Based Layout Suite', () => {
  let adminCookies = '';
  let managerCookies = '';
  let adminSessionOnly = '';

  it('Setup: Authenticate Owner/Admin and Manager', async () => {
    // Admin login
    const adminRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@kasthuripoultry.com', password: 'Kasthuri@2026' }),
    });
    assert.strictEqual(adminRes.status, 200, 'Admin login failed');
    adminCookies = extractCookies(adminRes);

    const sessionMatch = adminCookies.match(/kpf_session=[^;]+/);
    assert.ok(sessionMatch, 'Expected kpf_session cookie');
    adminSessionOnly = sessionMatch[0];

    // Manager login
    const mgrRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'manager.layer@kasthuripoultry.com', password: 'Manager@2026' }),
    });
    assert.strictEqual(mgrRes.status, 200, 'Manager login failed');
    managerCookies = extractCookies(mgrRes);
  });

  it('1. Owner/Admin hard reload on / renders stable AppLayout shell with <aside>', async () => {
    const res = await fetch(`${BASE_URL}/`, {
      headers: { Cookie: adminCookies },
    });
    assert.strictEqual(res.status, 200);
    const html = await res.text();

    // Verify stable shell
    assert.ok(html.includes('<aside'), 'Expected <aside> sidebar in SSR HTML');
    assert.ok(html.includes('Kasthuri Poultry Farm'), 'Expected farm brand title');
    assert.ok(html.includes('Poultry Management System'), 'Expected subtitle in sidebar');
    assert.ok(html.includes('Admin View Mode'), 'Expected Admin View Mode for Owner/Admin');
    assert.ok(html.includes('/users'), 'Expected /users admin navigation for Owner/Admin');
    assert.ok(html.includes('/audit-logs'), 'Expected /audit-logs admin navigation');

    // Confirm NO bifurcation into standalone full-screen splash <div> in <div>
    assert.ok(!html.includes('Verifying secure staff session...'), 'Should not render loading splash on SSR with valid session');
  });

  it('2. Manager hard reload on / renders stable AppLayout shell without Admin-only links', async () => {
    const res = await fetch(`${BASE_URL}/`, {
      headers: { Cookie: managerCookies },
    });
    assert.strictEqual(res.status, 200);
    const html = await res.text();

    // Verify stable shell
    assert.ok(html.includes('<aside'), 'Expected <aside> sidebar in SSR HTML for Manager');
    assert.ok(html.includes('Shed Manager'), 'Expected Shed Manager role indicator');

    // Manager must NOT see Admin-only nav items in sidebar
    assert.ok(!html.includes('href="/users"'), 'Manager must not see User Management link');
    assert.ok(!html.includes('href="/audit-logs"'), 'Manager must not see Audit Logs link');
  });

  it('3. Protected pages retain identical AppLayout shell on SSR (/sheds, /batches, /daily-entry, /settings)', async () => {
    const pages = ['/sheds', '/batches', '/daily-entry', '/settings'];
    for (const page of pages) {
      const res = await fetch(`${BASE_URL}${page}`, {
        headers: { Cookie: adminCookies },
      });
      assert.strictEqual(res.status, 200, `Failed loading ${page}`);
      const html = await res.text();

      assert.ok(html.includes('<aside'), `Expected <aside> in SSR for ${page}`);
      assert.ok(html.includes('<header'), `Expected <header> in SSR for ${page}`);
      assert.ok(html.includes('<main'), `Expected <main> in SSR for ${page}`);
    }
  });

  it('4. Unauthenticated request to / or protected routes redirects to /login', async () => {
    const unauthRes = await fetch(`${BASE_URL}/`, {
      redirect: 'manual',
    });
    assert.strictEqual(unauthRes.status, 307);
    assert.ok(unauthRes.headers.get('location')?.includes('/login'));

    const unauthSheds = await fetch(`${BASE_URL}/sheds`, {
      redirect: 'manual',
    });
    assert.strictEqual(unauthSheds.status, 307);
    assert.ok(unauthSheds.headers.get('location')?.includes('/login'));
  });

  it('5. Direct request to /login renders clean auth gateway without dashboard shell', async () => {
    const loginPageRes = await fetch(`${BASE_URL}/login`);
    assert.strictEqual(loginPageRes.status, 200);
    const html = await loginPageRes.text();

    assert.ok(!html.includes('<aside'), 'Login page must not contain dashboard <aside>');
    assert.ok(html.includes('Staff Credential Login'), 'Expected Staff Credential Login form');
  });

  it('6. Cryptographic session token without kpf_role cookie is verified authoritatively on server', async () => {
    const res = await fetch(`${BASE_URL}/`, {
      headers: { Cookie: adminSessionOnly },
    });
    assert.strictEqual(res.status, 200);
    const html = await res.text();

    // With our updated async RootLayout, token is parsed directly so initialRole is owner_admin
    assert.ok(html.includes('<aside'), 'Expected <aside> sidebar even when only kpf_session is provided');
    assert.ok(html.includes('Admin View Mode'), 'Expected Admin View Mode');
  });
});
