import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:3000';

test('Indian Number Formatting & SSR Hydration Consistency Suite', async (t) => {
  // Login as admin first
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'owner@kasthuripoultry.com',
      password: 'Kasthuri@2026',
    }),
  });
  assert.equal(loginRes.status, 200, 'Admin login should succeed');
  const cookie = loginRes.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');

  await t.test('1. formatNumber specification test (103000 -> 1,03,000)', () => {
    const formatNumber = (value) =>
      new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value);

    assert.equal(formatNumber(103000), '1,03,000', '103000 formats to 1,03,000');
    assert.equal(formatNumber(100000), '1,00,000', '100000 formats to 1,00,000');
    assert.equal(formatNumber(1250000), '12,50,000', '1250000 formats to 12,50,000');
    assert.equal(formatNumber(2500), '2,500', '2500 formats to 2,500');
  });

  await t.test('2. Server SSR HTML contains Indian formatted 1,03,000 for total capacity', async () => {
    const res = await fetch(`${BASE_URL}/`, {
      headers: { Cookie: cookie },
    });
    assert.equal(res.status, 200);
    const html = await res.text();

    // Check for target capacity "1,03,000" in rendered HTML
    assert.ok(
      html.includes('1,03,000'),
      'HTML must contain "1,03,000" (Indian locale formatting)'
    );

    // Verify unformatted or US-formatted 103,000 is NOT present
    const hasUsFormatted103000 = html.includes('103,000');
    assert.equal(
      hasUsFormatted103000,
      false,
      'HTML must NOT contain US-formatted "103,000"'
    );
  });

  await t.test('3. Verify Sheds page SSR uses Indian format for capacity', async () => {
    const res = await fetch(`${BASE_URL}/sheds`, {
      headers: { Cookie: cookie },
    });
    assert.equal(res.status, 200);
    const html = await res.text();

    assert.ok(
      html.includes('1,03,000'),
      'Sheds page must contain "1,03,000" for total capacity'
    );
    assert.equal(
      html.includes('103,000'),
      false,
      'Sheds page must NOT contain "103,000"'
    );
  });

  await t.test('4. Verify Batches page SSR uses Indian format', async () => {
    const res = await fetch(`${BASE_URL}/batches`, {
      headers: { Cookie: cookie },
    });
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.equal(html.includes('103,000'), false);
  });

  await t.test('5. Verify Reports page SSR uses Indian format', async () => {
    const res = await fetch(`${BASE_URL}/reports`, {
      headers: { Cookie: cookie },
    });
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.equal(html.includes('103,000'), false);
  });

  await t.test('6. Verify all other farm routes SSR use Indian format and avoid 103,000', async () => {
    const routes = [
      '/daily-entry',
      '/egg-production',
      '/egg-sales',
      '/bird-sales',
      '/feed-management',
      '/inventory',
      '/customers',
      '/suppliers',
      '/expenses',
      '/electricity-labour',
      '/payments',
      '/health-vaccination',
      '/weight-monitoring',
      '/settings',
      '/users',
      '/audit-logs',
      '/notifications',
    ];

    for (const route of routes) {
      const res = await fetch(`${BASE_URL}${route}`, { headers: { Cookie: cookie } });
      assert.equal(res.status, 200, `Route ${route} should return 200`);
      const html = await res.text();
      assert.equal(
        html.includes('103,000'),
        false,
        `Route ${route} should not contain US-formatted 103,000`
      );
    }
  });
});
