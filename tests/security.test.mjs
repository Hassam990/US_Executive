import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import driverApplication from '../server/driverApplication.cjs';
import chatSystem from '../server/chatSystem.cjs';

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-the-suite';
process.env.ADMIN_EMAIL = 'admin@example.test';
process.env.ADMIN_PASSWORD = 'test-admin-password';
process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
process.env.NODE_ENV = 'test';
for (const key of [
    'VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'CRON_SECRET', 'CLERK_PUBLISHABLE_KEY',
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

test('driver application deletion requires an authenticated admin', async () => {
    const response = await fetch(`${baseUrl}/api/admin/drivers/1`, { method: 'DELETE' });
    assert.equal(response.status, 401);
});

test('driver application deletion rejects invalid IDs', async () => {
    const adminToken = jwt.sign(
        { role: 'admin', email: 'admin@example.test' },
        process.env.JWT_SECRET,
        { expiresIn: '5m', issuer: 'us-executive-api', audience: 'us-executive-users' },
    );
    const response = await fetch(`${baseUrl}/api/admin/drivers/not-an-id`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(response.status, 400);
});

test('private driver document and status routes require an authenticated admin', async () => {
    const documents = await fetch(`${baseUrl}/api/admin/drivers/1/documents`);
    const status = await fetch(`${baseUrl}/api/admin/drivers/1/status`, { method: 'PATCH' });
    assert.equal(documents.status, 401);
    assert.equal(status.status, 401);
});

test('driver registration validates required declarations before database access', async () => {
    const response = await fetch(`${baseUrl}/api/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
    });
    assert.equal(response.status, 400);
});

test('signed upload URL creation rejects unknown document types and invalid sessions', async () => {
    const response = await fetch(`${baseUrl}/api/apply/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: 'not-a-uuid', documentType: 'medicalReport', mimeType: 'application/pdf', size: 1024 }),
    });
    assert.equal(response.status, 400);
});

test('driver application accepts private document paths created by the upload endpoint', () => {
    const uploadSessionId = '123e4567-e89b-42d3-a456-426614174000';
    const result = driverApplication.validateApplicationPayload({
        uploadSessionId,
        application: {
            personal: {
                fullName: 'Alex Driver', dateOfBirth: '1990-01-01', address: '1 High Street', postcode: 'RH2 0SH',
                phone: '+447700900123', email: 'alex@example.test', licensingAuthority: 'Reigate & Banstead', licensedByRbbc: 'No',
            },
            compliance: {
                dbsCheck: 'In progress', dbsUpdateService: 'Not applicable', medicalAssessment: 'In progress',
                safeguardingTraining: 'In progress', knowledgeTest: 'In progress', driverLicenceValid: 'Yes',
            },
            vehicle: {},
            availability: { workTypes: [], airports: [], days: [], hours: [] },
            declarations: {
                informationAccurate: true, licencesAccurate: true, reportLicensingChanges: true,
                insuranceCommitment: true, noWorkGuarantee: true, privacyNoticeRead: true,
            },
            documents: {
                privateHireDriverLicence: {
                    path: `applications/${uploadSessionId}/privateHireDriverLicence.pdf`,
                    fileName: 'licence.pdf', mimeType: 'application/pdf', size: 1024,
                },
            },
        },
    });

    assert.equal(result.error, undefined);
    assert.equal(result.application.documents.privateHireDriverLicence.path, `applications/${uploadSessionId}/privateHireDriverLicence.pdf`);
});

test('expiry reminders are generated only at 30 and 7 days and do not duplicate driver licence records', () => {
    const reminders = driverApplication.getDueExpiryReminders({
        application_data: {
            personal: { driverLicenceExpiryDate: '2026-12-04' },
            vehicle: { insuranceExpiryDate: '2026-11-11' },
            documents: { privateHireDriverLicence: { expiryDate: '2026-12-04' } },
        },
    }, '2026-11-04');
    assert.deepEqual(reminders.map(({ key, daysBefore }) => [key, daysBefore]), [
        ['driver-licence', 30],
        ['insurance', 7],
    ]);
});

test('expiry reminder endpoint rejects calls without its configured schedule secret', async () => {
    const response = await fetch(`${baseUrl}/api/cron/driver-expiry-reminders`);
    assert.equal(response.status, 503);
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

test('public driver directory only returns a safe empty state when no persistence is configured', async () => {
    const response = await fetch(`${baseUrl}/api/drivers`);
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).drivers, []);
});

test('chat creation rejects invalid destinations before database access', async () => {
    const invalidType = await fetch(`${baseUrl}/api/chat/conversations`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'unknown' }),
    });
    const invalidDriver = await fetch(`${baseUrl}/api/chat/conversations`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'driver', driverProfileId: 'not-a-uuid' }),
    });
    assert.equal(invalidType.status, 400);
    assert.equal(invalidDriver.status, 400);
});

test('chat and driver profile admin endpoints require an authenticated admin', async () => {
    const [chats, profiles] = await Promise.all([
        fetch(`${baseUrl}/api/admin/chats`),
        fetch(`${baseUrl}/api/admin/driver-profiles`),
    ]);
    assert.equal(chats.status, 401);
    assert.equal(profiles.status, 401);
});

test('chat message reads require a valid conversation ID and bearer chat token', async () => {
    const invalidConversation = await fetch(`${baseUrl}/api/chat/conversations/not-a-uuid/messages`, {
        headers: { 'X-Chat-Token': chatSystem.createChatToken() },
    });
    const invalidToken = await fetch(`${baseUrl}/api/chat/conversations/123e4567-e89b-42d3-a456-426614174000/messages`, {
        headers: { 'X-Chat-Token': 'invalid' },
    });
    assert.equal(invalidConversation.status, 401);
    assert.equal(invalidToken.status, 401);
});

test('chat tokens are random and only stored as one-way hashes', () => {
    const token = chatSystem.createChatToken();
    const hash = chatSystem.hashChatToken(token);
    assert.equal(token.length, 43);
    assert.ok(hash);
    assert.notEqual(hash, token);
    assert.equal(chatSystem.hashChatToken(token), hash);
    assert.equal(chatSystem.hashChatToken('invalid'), null);
});

test('public driver profile validation requires publish-ready, privacy-safe fields', () => {
    const draft = chatSystem.normalizeDriverProfile({ displayName: 'Alex Driver' });
    const invalidPublic = chatSystem.normalizeDriverProfile({ displayName: 'Alex Driver', status: 'active', isPublic: true });
    const publicProfile = chatSystem.normalizeDriverProfile({
        displayName: 'Alex Driver', headline: 'Executive chauffeur', bio: 'Experienced chauffeur based in Surrey for private journeys.',
        baseLocation: 'Surrey', status: 'active', isPublic: true,
        email: 'private@example.test', homeAddress: '1 private street',
        vehicle: { make: 'Mercedes', model: 'E-Class', year: '2024' }, services: ['Airport transfers'],
    });
    assert.equal(draft.profile.is_public, false);
    assert.match(invalidPublic.error, /public profile/i);
    assert.equal(publicProfile.profile.is_public, true);
    assert.equal(publicProfile.profile.vehicle.year, '2024');
    assert.equal(publicProfile.profile.email, undefined);
    assert.equal(publicProfile.profile.homeAddress, undefined);
});
