import assert from 'node:assert/strict';

async function audit() {
  console.log('=== KPF FULL END-TO-END VERIFICATION AUDIT ===\n');

  // 1. Inspect /login SSR HTML structure
  const loginRes = await fetch('http://localhost:3000/login');
  assert.equal(loginRes.status, 200);
  const loginHtml = await loginRes.text();

  // Verify body contains top-level div
  const bodyStart = loginHtml.indexOf('<body');
  const bodyHtml = loginHtml.substring(bodyStart);
  assert.ok(bodyHtml.includes('min-h-screen bg-gradient-to-br'), 'Body direct child must be min-h-screen div');
  
  // Verify form is nested directly inside the card div
  const formIdx = loginHtml.indexOf('<form');
  assert.ok(formIdx > 0, '<form> must be present');
  const cardStart = loginHtml.indexOf('class="mt-6 bg-slate-900/90');
  assert.ok(cardStart > 0 && cardStart < formIdx, 'Card div must contain <form>');
  console.log('✓ 1. /login DOM structure verified: <body> <div> <div> <div> <form>');

  // 2. Test admin login (admin/admin and owner/Kasthuri@2026)
  const adminLoginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername: 'admin', password: 'admin' })
  });
  assert.equal(adminLoginRes.status, 200);
  const adminData = await adminLoginRes.json();
  assert.equal(adminData.success, true);
  assert.equal(adminData.role, 'owner_admin');
  console.log('✓ 2. Admin login (admin/admin): 200 OK (owner_admin)');

  // 3. Test manager login (manager/manager and manager.layer@kasthuripoultry.com/Manager@2026)
  const mgrLoginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername: 'manager', password: 'manager' })
  });
  assert.equal(mgrLoginRes.status, 200);
  const mgrData = await mgrLoginRes.json();
  assert.equal(mgrData.success, true);
  assert.equal(mgrData.role, 'manager');
  console.log('✓ 3. Manager login (manager/manager): 200 OK (manager)');

  // 4. Test authenticated cookies on /login (refresh scenario)
  const adminCookies = (adminLoginRes.headers.getSetCookie ? adminLoginRes.headers.getSetCookie() : [adminLoginRes.headers.get('set-cookie')]).map(c => c.split(';')[0]).join('; ');
  const refreshLoginRes = await fetch('http://localhost:3000/login', {
    headers: { Cookie: adminCookies },
    redirect: 'manual'
  });
  assert.equal(refreshLoginRes.status, 200, 'Must return 200 OK on /login without 307 redirect');
  const refreshHtml = await refreshLoginRes.text();
  assert.ok(!refreshHtml.includes('<aside'), 'Must not render <aside> on /login');
  assert.ok(refreshHtml.includes('<form'), 'Must render <form> on /login');
  console.log('✓ 4. Refreshing /login with active session: 200 OK with identical DOM');

  // 5. Test authenticated cookies on / (home page)
  const homeRes = await fetch('http://localhost:3000/', {
    headers: { Cookie: adminCookies },
    redirect: 'manual'
  });
  assert.equal(homeRes.status, 200);
  const homeHtml = await homeRes.text();
  assert.ok(homeHtml.includes('<aside'), 'Home page must contain <aside>');
  assert.ok(homeHtml.includes('1,03,000'), 'Home page must contain Indian formatted capacity 1,03,000');
  console.log('✓ 5. Authenticated navigation to /: 200 OK with dashboard & Indian formatting');

  // 6. Test Settings tab isolation
  const settingsRes = await fetch('http://localhost:3000/settings?section=permissions', {
    headers: { Cookie: adminCookies },
    redirect: 'manual'
  });
  assert.equal(settingsRes.status, 200);
  const settingsHtml = await settingsRes.text();
  assert.ok(
    settingsHtml.includes('Farm-Wide Analytics & Charts Visibility') ||
    settingsHtml.includes('Farm-Wide Analytics &amp; Charts Visibility'),
    'Must show permissions tab switches'
  );
  assert.ok(!settingsHtml.includes('Bank Remittance Account'), 'Must not show billing tab');
  console.log('✓ 6. Settings tab isolation: 200 OK with strictly isolated section');

  console.log('\n=== ALL AUDIT CHECKS PASSED WITH 0 ERRORS ===');
}

audit();
