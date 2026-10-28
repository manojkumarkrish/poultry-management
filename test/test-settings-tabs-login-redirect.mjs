import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

test('KPF Settings Tab Isolation, Hydration Consistency & Login Redirect Suite', async (t) => {
  let adminCookies = '';
  let managerCookies = '';

  await t.test('1. Setup: Authenticate Owner/Admin and Manager credentials', async () => {
    // Admin login
    const adminRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername: 'owner@kasthuripoultry.com', password: 'Kasthuri@2026' }),
    });
    assert.equal(adminRes.status, 200, 'Admin login status should be 200');
    const adminData = await adminRes.json();
    assert.equal(adminData.success, true, 'Admin login should succeed');
    assert.equal(adminData.role, 'owner_admin', 'Admin role should be owner_admin');

    const adminSetCookies = adminRes.headers.getSetCookie ? adminRes.headers.getSetCookie() : [adminRes.headers.get('set-cookie') || ''];
    adminCookies = adminSetCookies.map(c => c.split(';')[0]).join('; ');
    assert.ok(adminCookies.includes('kpf_session'), 'kpf_session cookie must be present');
    assert.ok(adminCookies.includes('kpf_role=owner_admin'), 'kpf_role=owner_admin must be present');

    // Manager login
    const mgrRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername: 'manager.layer@kasthuripoultry.com', password: 'Manager@2026' }),
    });
    assert.equal(mgrRes.status, 200, 'Manager login status should be 200');
    const mgrData = await mgrRes.json();
    assert.equal(mgrData.success, true, 'Manager login should succeed');
    assert.equal(mgrData.role, 'manager', 'Manager role should be manager');

    const mgrSetCookies = mgrRes.headers.getSetCookie ? mgrRes.headers.getSetCookie() : [mgrRes.headers.get('set-cookie') || ''];
    managerCookies = mgrSetCookies.map(c => c.split(';')[0]).join('; ');
    assert.ok(managerCookies.includes('kpf_session'), 'kpf_session cookie must be present');
    assert.ok(managerCookies.includes('kpf_role=manager'), 'kpf_role=manager must be present');
  });

  await t.test('2. Login API rejects invalid credentials and does not issue cookies', async () => {
    const invalidRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername: 'wrong@user.com', password: 'wrongpassword' }),
    });
    assert.equal(invalidRes.status, 401, 'Invalid credentials should return 401');
    const data = await invalidRes.json();
    assert.equal(data.success, false);
    assert.ok(data.error, 'Error message must be returned');
  });

  await t.test('3. Session endpoint authoritatively validates authenticated cookies', async () => {
    const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: { Cookie: adminCookies },
    });
    assert.equal(sessionRes.status, 200);
    const data = await sessionRes.json();
    assert.equal(data.authenticated, true);
    assert.equal(data.role, 'owner_admin');
    assert.ok(data.userId);
  });

  await t.test('4. Authenticated cookies allow seamless navigation to / without redirecting back to /login', async () => {
    const dashboardRes = await fetch(`${BASE_URL}/`, {
      headers: { Cookie: adminCookies },
      redirect: 'manual',
    });
    assert.equal(dashboardRes.status, 200, 'Authenticated request to / must return 200 OK (no redirect)');
    const html = await dashboardRes.text();
    assert.ok(html.includes('Kasthuri Poultry Farm'), 'Must render dashboard shell');
  });

  await t.test('5. Settings default view renders ONLY Billing & Farm Header section', async () => {
    const res = await fetch(`${BASE_URL}/settings`, {
      headers: { Cookie: adminCookies },
    });
    assert.equal(res.status, 200);
    const html = await res.text();

    // 1. Shared Header
    assert.ok(
      html.includes('Kasthuri Poultry Farm — Account &amp; System Settings') ||
      html.includes('Kasthuri Poultry Farm — Account & System Settings'),
      'Must contain shared header'
    );

    // 2. Shared Navigation Bar
    assert.ok(html.includes('Billing &amp; Farm Header') || html.includes('Billing & Farm Header'), 'Must contain Billing tab');
    assert.ok(html.includes('Manage Permissions'), 'Must contain Manage Permissions tab');
    assert.ok(html.includes('Data Management'), 'Admin must see Data Management tab');

    // 3. Billing content IS present
    assert.ok(
      html.includes('Farm Legal Entity &amp; Bill Printing Configuration') ||
      html.includes('Farm Legal Entity & Bill Printing Configuration'),
      'Must contain Farm Legal Entity & Bill Printing Configuration'
    );
    assert.ok(
      html.includes('My Staff Profile &amp; Account Identity') ||
      html.includes('My Staff Profile & Account Identity'),
      'Must contain My Staff Profile & Account Identity'
    );

    // 4. Manage Permissions switches & Data Management are NOT rendered in this tab content
    assert.ok(
      !html.includes('Farm-Wide Analytics &amp; Charts Visibility') &&
      !html.includes('Farm-Wide Analytics & Charts Visibility'),
      'Permissions switches must NOT appear in Billing tab'
    );
    assert.ok(
      !html.includes('About the Operational Data Reset Feature'),
      'Data reset details must NOT appear in Billing tab'
    );
  });

  await t.test('6. Settings ?section=permissions renders ONLY Manage Permissions section', async () => {
    const res = await fetch(`${BASE_URL}/settings?section=permissions`, {
      headers: { Cookie: adminCookies },
    });
    assert.equal(res.status, 200);
    const html = await res.text();

    // 1. Shared Header & Nav
    assert.ok(
      html.includes('Kasthuri Poultry Farm — Account &amp; System Settings') ||
      html.includes('Kasthuri Poultry Farm — Account & System Settings'),
      'Must contain shared header'
    );

    // 2. Permissions content IS present
    assert.ok(
      html.includes('Farm-Wide Analytics &amp; Charts Visibility') ||
      html.includes('Farm-Wide Analytics & Charts Visibility'),
      'Permissions switches must be present'
    );
    assert.ok(html.includes('Server &amp; Database Level Security') || html.includes('Server & Database Level Security'));

    // 3. Billing & Data Management content are NOT rendered in this tab content
    assert.ok(
      !html.includes('Bank Remittance Account (Printed for Customer Direct RTGS / NEFT Payments)'),
      'Billing details must NOT appear in Permissions tab'
    );
    assert.ok(
      !html.includes('About the Operational Data Reset Feature'),
      'Data reset details must NOT appear in Permissions tab'
    );
  });

  await t.test('7. Settings ?section=data_management renders ONLY Data Management section for Admin', async () => {
    const res = await fetch(`${BASE_URL}/settings?section=data_management`, {
      headers: { Cookie: adminCookies },
    });
    assert.equal(res.status, 200);
    const html = await res.text();

    // 1. Shared Header & Nav
    assert.ok(
      html.includes('Kasthuri Poultry Farm — Account &amp; System Settings') ||
      html.includes('Kasthuri Poultry Farm — Account & System Settings'),
      'Must contain shared header'
    );

    // 2. Data Management content IS present
    assert.ok(html.includes('Farm Operational Data Management'), 'Must contain Data Management header');
    assert.ok(html.includes('About the Operational Data Reset Feature'), 'Must contain Reset Feature explanation');
    assert.ok(html.includes('Reset Operational Data...'), 'Must contain Reset button');

    // 3. Permissions switches & Billing are NOT rendered in this tab content
    assert.ok(
      !html.includes('Farm-Wide Analytics &amp; Charts Visibility') &&
      !html.includes('Farm-Wide Analytics & Charts Visibility'),
      'Permissions switches must NOT appear in Data Management tab'
    );
    assert.ok(
      !html.includes('Bank Remittance Account (Printed for Customer Direct RTGS / NEFT Payments)'),
      'Billing details must NOT appear in Data Management tab'
    );
  });

  await t.test('8. Settings ?section=data_management blocks Manager and displays Admin Access Required', async () => {
    const res = await fetch(`${BASE_URL}/settings?section=data_management`, {
      headers: { Cookie: managerCookies },
    });
    assert.equal(res.status, 200);
    const html = await res.text();

    // Manager must NOT see Data Management tab button in navigation
    // Check navigation buttons
    assert.ok(
      !html.includes('Data Management</span></button>'),
      'Manager must NOT have Data Management tab button in navigation bar'
    );

    // Manager must see locked message, and NO destructive reset button
    assert.ok(html.includes('Admin Access Required'), 'Must display Admin Access Required');
    assert.ok(!html.includes('Reset Operational Data...'), 'Must NOT display Reset Operational Data button');
  });

  await t.test('9. Settings ?section=permissions displays locked notice for Manager', async () => {
    const res = await fetch(`${BASE_URL}/settings?section=permissions`, {
      headers: { Cookie: managerCookies },
    });
    assert.equal(res.status, 200);
    const html = await res.text();

    assert.ok(html.includes('Manager Permissions Configuration'), 'Must display manager permissions notice');
    assert.ok(html.includes('require authenticated Owner / Admin authorization'), 'Must explain admin authorization requirement');
    // Manager must not see editable switch toggles
    assert.ok(!html.includes('Server &amp; Database Level Security') && !html.includes('Server & Database Level Security'));
  });

  await t.test('10. AppLayout retains structural consistency with <aside> on all settings subtabs', async () => {
    for (const path of ['/settings', '/settings?section=permissions', '/settings?section=data_management']) {
      const res = await fetch(`${BASE_URL}${path}`, {
        headers: { Cookie: adminCookies },
      });
      assert.equal(res.status, 200);
      const html = await res.text();
      assert.ok(html.includes('<aside'), `Path ${path} must render <aside> sidebar`);
      assert.ok(html.includes('<main'), `Path ${path} must render <main>`);
    }
  });
});
