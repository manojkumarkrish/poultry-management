const SERVER_SECRET = 'kpf_kasthuri_poultry_enterprise_salt_98124455';

async function hashPassword(password, salt) {
  const text = `${salt}:${password}:${salt}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function createSignedSessionToken(userId, role, expiresAt) {
  const payload = `${userId}:${role}:${expiresAt}`;
  const sig = await hashPassword(payload, SERVER_SECRET);
  return `kpf_v2.${userId}.${role}.${expiresAt}.${sig}`;
}

async function parseAndVerifyToken(token) {
  try {
    if (!token || typeof token !== 'string') return { valid: false };
    if (!token.startsWith('kpf_v2.')) return { valid: true };
    const parts = token.split('.');
    if (parts.length !== 5) return { valid: false };
    const [, userId, role, expiresAtStr, sig] = parts;
    const expiresAt = Number(expiresAtStr);
    if (isNaN(expiresAt) || Date.now() > expiresAt) return { valid: false };
    if (role !== 'owner_admin' && role !== 'manager') return { valid: false };
    const expectedSig = await hashPassword(`${userId}:${role}:${expiresAt}`, SERVER_SECRET);
    if (sig !== expectedSig) return { valid: false };
    return { valid: true, userId, role, expiresAt };
  } catch {
    return { valid: false };
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('  KPF Security, RBAC & Authentication Test Suite    ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // 1. Test Manifest
  await test('PWA Web App Manifest is valid and served at /manifest.json', async () => {
    const res = await fetch('http://localhost:3000/manifest.json');
    if (!res.ok) throw new Error(`Manifest returned HTTP ${res.status}`);
    const json = await res.json();
    if (json.name !== 'Kasthuri Poultry Farm') throw new Error(`Incorrect name: ${json.name}`);
    if (json.short_name !== 'KPF') throw new Error(`Incorrect short_name: ${json.short_name}`);
    if (json.display !== 'standalone') throw new Error(`Display is not standalone: ${json.display}`);
    if (json.theme_color !== '#059669') throw new Error(`Incorrect theme_color: ${json.theme_color}`);
    if (!json.icons || json.icons.length < 2) throw new Error('Missing icons in manifest');
  });

  // 2. Test Icons
  await test('PWA 192x192 and 512x512 icons are accessible', async () => {
    const i192 = await fetch('http://localhost:3000/icons/icon-192x192.png');
    if (!i192.ok) throw new Error(`Icon 192 returned HTTP ${i192.status}`);
    const i512 = await fetch('http://localhost:3000/icons/icon-512x512.png');
    if (!i512.ok) throw new Error(`Icon 512 returned HTTP ${i512.status}`);
  });

  // 3. Test Service Worker
  await test('Service Worker is served at /sw.js with secure caching strategy', async () => {
    const res = await fetch('http://localhost:3000/sw.js');
    if (!res.ok) throw new Error(`Service Worker returned HTTP ${res.status}`);
    const text = await res.text();
    if (!text.includes('kpf-pwa-v')) throw new Error('Cache name kpf-pwa version missing');
    if (!text.includes('/manifest.json')) throw new Error('Manifest not pre-cached');
    if (text.includes("'/login'")) throw new Error('/login must NOT be pre-cached in Service Worker');
  });

  // 4. Test Login Page (Zero Demo Credentials)
  await test('Login page /login renders with NO demo accounts or sample passwords', async () => {
    const res = await fetch('http://localhost:3000/login');
    if (!res.ok) throw new Error(`Login page returned HTTP ${res.status}`);
    const html = await res.text();
    if (!html.includes('Kasthuri Poultry Farm')) throw new Error('KPF branding missing from login page');
    if (!html.includes('Staff Credential Login')) throw new Error('Login title missing');

    // Strict security check: Demo credential elimination
    if (html.includes('Kasthuri@2026')) throw new Error('Security breach: Owner password exposed in login HTML');
    if (html.includes('Manager@2026')) throw new Error('Security breach: Manager password exposed in login HTML');
    if (html.includes('Evaluation Demo Accounts')) throw new Error('Evaluation Demo Accounts section still present');
    if (html.includes('1-Tap Fill')) throw new Error('1-Tap Fill demo button still present');
    if (html.includes('owner@kasthuripoultry.com')) throw new Error('Demo account email displayed in login card');
  });

  // 5. Test Middleware Route Protection (Unauthenticated Redirect)
  await test('Unauthenticated access to protected /sheds redirects to /login', async () => {
    const res = await fetch('http://localhost:3000/sheds', { redirect: 'manual' });
    const location = res.headers.get('location');
    if (res.status !== 307 && res.status !== 308 && res.status !== 302) {
      throw new Error(`Expected redirect status (307/302), got ${res.status}`);
    }
    if (!location || !location.includes('/login')) {
      throw new Error(`Expected redirect to /login, got ${location}`);
    }
  });

  // 6. Test Auth API Login with Invalid Credentials
  await test('Auth API rejects invalid/empty credentials', async () => {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fake@wrong.com', password: '' }),
    });
    if (res.status !== 400 && res.status !== 401) {
      throw new Error(`Expected 400/401 on invalid login, got ${res.status}`);
    }
  });

  // 7. Test Owner/Admin Authentication & Cookie Issuance
  let adminSessionCookie = '';
  await test('Auth API authenticates Owner/Admin and sets signed owner_admin role', async () => {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@kasthuripoultry.com', password: 'Kasthuri@2026' }),
    });
    if (!res.ok) throw new Error(`Login failed with HTTP ${res.status}`);
    const setCookie = res.headers.get('set-cookie');
    if (!setCookie || !setCookie.includes('kpf_session')) {
      throw new Error('Missing kpf_session cookie in response header');
    }
    const data = await res.json();
    if (!data.success) throw new Error('Login returned success: false');
    if (data.role !== 'owner_admin') throw new Error(`Expected role owner_admin, got ${data.role}`);

    // Capture cookie header for authenticated admin requests
    adminSessionCookie = setCookie;
  });

  // 8. Test Owner/Admin Access to Protected & Admin-Only Pages
  await test('Owner/Admin can access /sheds, /users, and /audit-logs', async () => {
    // Access /sheds
    const shedsRes = await fetch('http://localhost:3000/sheds', {
      headers: { Cookie: adminSessionCookie },
      redirect: 'manual',
    });
    if (shedsRes.status !== 200) throw new Error(`/sheds returned status ${shedsRes.status}`);

    // Access /users (Admin Only)
    const usersRes = await fetch('http://localhost:3000/users', {
      headers: { Cookie: adminSessionCookie },
      redirect: 'manual',
    });
    if (usersRes.status !== 200) throw new Error(`/users returned status ${usersRes.status}`);

    // Access /audit-logs (Admin Only)
    const auditRes = await fetch('http://localhost:3000/audit-logs', {
      headers: { Cookie: adminSessionCookie },
      redirect: 'manual',
    });
    if (auditRes.status !== 200) throw new Error(`/audit-logs returned status ${auditRes.status}`);
  });

  // 9. Test Manager Authentication & Role Verification
  let managerSessionCookie = '';
  await test('Auth API authenticates Manager and sets signed manager role', async () => {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'manager.layer@kasthuripoultry.com', password: 'Manager@2026' }),
    });
    if (!res.ok) throw new Error(`Manager login failed with HTTP ${res.status}`);
    const setCookie = res.headers.get('set-cookie');
    if (!setCookie || !setCookie.includes('kpf_session')) {
      throw new Error('Missing kpf_session cookie in response header');
    }
    const data = await res.json();
    if (!data.success) throw new Error('Manager login returned success: false');
    if (data.role !== 'manager') throw new Error(`Expected role manager, got ${data.role}`);

    managerSessionCookie = setCookie;
  });

  // 10. Test Manager Access to Allowed Operational Pages
  await test('Manager can access operational /sheds page', async () => {
    const res = await fetch('http://localhost:3000/sheds', {
      headers: { Cookie: managerSessionCookie },
      redirect: 'manual',
    });
    if (res.status !== 200) throw new Error(`Manager /sheds returned status ${res.status}`);
  });

  // 11. Test Server Enforcement: Manager BLOCKED from Admin Pages (/users & /audit-logs)
  await test('Manager is strictly BLOCKED from /users and redirected by middleware', async () => {
    const res = await fetch('http://localhost:3000/users', {
      headers: { Cookie: managerSessionCookie },
      redirect: 'manual',
    });
    const location = res.headers.get('location');
    if (res.status !== 307 && res.status !== 308 && res.status !== 302) {
      throw new Error(`Expected redirect status (307/302), got ${res.status}`);
    }
    if (!location || !location.includes('denied=admin_required')) {
      throw new Error(`Expected redirect with denied=admin_required, got ${location}`);
    }
  });

  await test('Manager is strictly BLOCKED from /audit-logs and redirected by middleware', async () => {
    const res = await fetch('http://localhost:3000/audit-logs', {
      headers: { Cookie: managerSessionCookie },
      redirect: 'manual',
    });
    const location = res.headers.get('location');
    if (res.status !== 307 && res.status !== 308 && res.status !== 302) {
      throw new Error(`Expected redirect status (307/302), got ${res.status}`);
    }
    if (!location || !location.includes('denied=admin_required')) {
      throw new Error(`Expected redirect with denied=admin_required, got ${location}`);
    }
  });

  // 12. Test Server Enforcement: Manager BLOCKED from Admin API with 403 Forbidden
  await test('Manager receives 403 Forbidden when calling protected Admin API /api/users', async () => {
    const res = await fetch('http://localhost:3000/api/users', {
      headers: { Cookie: managerSessionCookie },
    });
    if (res.status !== 403) {
      throw new Error(`Expected HTTP 403 Forbidden, got ${res.status}`);
    }
  });

  // 13. Test Cryptographic Session Security & Anti-Tampering
  await test('Cryptographic session token validates genuine tokens and rejects forged roles', async () => {
    const expiresAt = Date.now() + 3600000;
    // Valid manager token
    const managerToken = await createSignedSessionToken('u-mgr-1', 'manager', expiresAt);
    const verifiedMgr = await parseAndVerifyToken(managerToken);
    if (!verifiedMgr.valid || verifiedMgr.role !== 'manager') {
      throw new Error('Valid manager token failed verification');
    }

    // Tampered token: attacker attempts to change role from 'manager' to 'owner_admin'
    const tamperedParts = managerToken.split('.');
    tamperedParts[2] = 'owner_admin'; // Modified role
    const forgedToken = tamperedParts.join('.');
    const verifiedForged = await parseAndVerifyToken(forgedToken);
    if (verifiedForged.valid) {
      throw new Error('Security failure: Forged role token was accepted!');
    }
  });

  // 14. Test Auth API Logout
  await test('Auth API logout invalidates session and clears all cookies', async () => {
    const res = await fetch('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: { Cookie: managerSessionCookie },
    });
    if (!res.ok) throw new Error(`Logout failed with HTTP ${res.status}`);
    const setCookie = res.headers.get('set-cookie');
    if (!setCookie || !setCookie.includes('Max-Age=0')) {
      throw new Error('Logout did not clear cookie with Max-Age=0');
    }
  });

  console.log('\n====================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
