import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('KPF Reset Data & Zero-State Verification Suite', () => {
  let adminCookie = '';

  it('1. Authenticate Admin session', async () => {
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@kasthuripoultry.com', password: 'Kasthuri@2026' }),
    });
    assert.strictEqual(loginRes.status, 200);
    adminCookie = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie().map(c => c.split(';')[0]).join('; ') : loginRes.headers.get('set-cookie')?.split(';')[0];
    assert.ok(adminCookie, 'Must have received session cookie');
  });

  it('2. Execute Reset Data API as authorized Admin', async () => {
    const resetRes = await fetch('http://localhost:3000/api/admin/reset-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        confirmationPhrase: 'RESET KPF DATA',
        adminPassword: 'Kasthuri@2026',
      }),
    });
    assert.strictEqual(resetRes.status, 200);
    const data = await resetRes.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.message.includes('successfully reset'));
  });

  it('3. After reset, all user accounts and login credentials remain completely intact and active', async () => {
    // 3a. Admin login via alias "admin"
    const adminRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin', password: 'admin' }),
    });
    assert.strictEqual(adminRes.status, 200);
    const adminData = await adminRes.json();
    assert.strictEqual(adminData.role, 'owner_admin');
    assert.strictEqual(adminData.userId, 'u-owner-1');

    // 3b. Admin login via primary email "owner@kasthuripoultry.com"
    const ownerRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@kasthuripoultry.com', password: 'Kasthuri@2026' }),
    });
    assert.strictEqual(ownerRes.status, 200);
    const ownerData = await ownerRes.json();
    assert.strictEqual(ownerData.role, 'owner_admin');

    // 3c. Manager login via alias "manager"
    const mgrRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'manager', password: 'manager' }),
    });
    assert.strictEqual(mgrRes.status, 200);
    const mgrData = await mgrRes.json();
    assert.strictEqual(mgrData.role, 'manager');
    assert.strictEqual(mgrData.userId, 'u-mgr-1');

    // 3d. Manager login via primary email "manager.layer@kasthuripoultry.com"
    const mgrEmailRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'manager.layer@kasthuripoultry.com', password: 'Manager@2026' }),
    });
    assert.strictEqual(mgrEmailRes.status, 200);
    const mgrEmailData = await mgrEmailRes.json();
    assert.strictEqual(mgrEmailData.role, 'manager');
  });

  it('4. User directory endpoint confirms user profiles are strictly preserved', async () => {
    const usersRes = await fetch('http://localhost:3000/api/users', {
      headers: { Cookie: adminCookie },
    });
    assert.strictEqual(usersRes.status, 200);
    const usersData = await usersRes.json();
    assert.ok(usersData.users.length >= 2, 'Users directory must contain at least 2 accounts');

    const admin = usersData.users.find(u => u.role === 'owner_admin');
    assert.ok(admin, 'Admin account must exist');
    assert.strictEqual(admin.email, 'owner@kasthuripoultry.com');

    const manager = usersData.users.find(u => u.role === 'manager');
    assert.ok(manager, 'Manager account must exist');
  });

  it('5. Dashboard and key pages load with 200 OK and render correctly', async () => {
    const pages = ['/', '/settings?section=data_management', '/batches', '/sheds', '/egg-sales', '/expenses', '/health-vaccination'];
    for (const p of pages) {
      const res = await fetch(`http://localhost:3000${p}`, {
        headers: { Cookie: adminCookie },
      });
      assert.strictEqual(res.status, 200, `Page ${p} failed to load`);
    }
  });
});
