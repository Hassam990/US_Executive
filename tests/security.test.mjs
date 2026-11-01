import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-the-suite';
process.env.ADMIN_EMAIL = 'admin@example.test';
process.env.ADMIN_PASSWORD = 'test-admin-password';
process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
process.env.NODE_ENV = 'test';
for (const key of [
    'VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'CLERK_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'VITE_CLERK_PUBLISHABLE_KEY',
]) delete process.env[key];

const { default: app } = await import('../api/index.js');
let server;
let baseUrl;

before(async () => {
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('legacy signup cannot mint an admin token', async () => {
    const response = await fetch(`${baseUrl}/api/admin/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Attacker', email: 'admin@example.test', password: 'anything' }),
    });
    assert.equal(response.status, 410);
    assert.equal((await response.json()).token, undefined);
});

test('a supplied email or email header cannot authorize booking lookup', async () => {
    const response = await fetch(`${baseUrl}/api/user/dashboard?email=victim@example.test`, {
        headers: { 'x-user-email': 'victim@example.test' },
    });
    assert.equal(response.status, 401);
});

test('forged JWT claims and email headers cannot authorize admin access', async () => {
    const forgedToken = jwt.sign({ sub: 'attacker', email: 'admin@example.test' }, 'attacker-secret');
    const response = await fetch(`${baseUrl}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${forgedToken}`, 'x-user-email': 'admin@example.test' },
    });
    assert.equal(response.status, 401);
});

test('driver uploads reject filesystem paths instead of attaching server files', async () => {
    const response = await fetch(`${baseUrl}/api/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document: 'C:/Windows/win.ini' }),
    });
    assert.equal(response.status, 400);
});

test('public form limiter blocks repeated driver applications', async () => {
    const statuses = [];
    for (let i = 0; i < 21; i += 1) {
        const response = await fetch(`${baseUrl}/api/apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '198.51.100.21' },
            body: JSON.stringify({ document: 'invalid' }),
        });
        statuses.push(response.status);
    }
    assert.equal(statuses.slice(0, 20).every((status) => status === 400), true);
    assert.equal(statuses[20], 429);
});

test('ordinary API requests reject oversized JSON bodies', async () => {
    const response = await fetch(`${baseUrl}/api/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'x'.repeat(70 * 1024) }),
    });
    assert.equal(response.status, 413);
});

test('configured admin login returns a scoped token accepted by the admin route', async () => {
    const login = await fetch(`${baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.test', password: 'test-admin-password' }),
    });
    assert.equal(login.status, 200);
    const { token } = await login.json();
    assert.ok(token);
    const dashboard = await fetch(`${baseUrl}/api/admin/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(dashboard.status, 200);
});
