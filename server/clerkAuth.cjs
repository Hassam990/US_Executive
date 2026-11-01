const { createPublicKey } = require('node:crypto');
const jwt = require('jsonwebtoken');

let cachedKeys = null;
let cacheExpiresAt = 0;

function getClerkFrontendApi() {
    const publishableKey = process.env.CLERK_PUBLISHABLE_KEY
        || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
        || process.env.VITE_CLERK_PUBLISHABLE_KEY;
    const match = typeof publishableKey === 'string'
        ? publishableKey.match(/^pk_(?:test|live)_([A-Za-z0-9+/=_-]+)$/)
        : null;
    if (!match) return null;

    const host = Buffer.from(match[1], 'base64').toString('utf8').replace(/\$$/, '').toLowerCase();
    if (!/^[a-z0-9.-]+$/.test(host) || host.includes('..')) return null;
    return `https://${host}`;
}

async function loadKeys(frontendApi) {
    const response = await fetch(`${frontendApi}/.well-known/jwks.json`, {
        signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error('Unable to load Clerk signing keys');
    const jwks = await response.json();
    cachedKeys = Array.isArray(jwks.keys) ? jwks.keys : [];
    cacheExpiresAt = Date.now() + 10 * 60 * 1000;
}

async function verifyClerkToken(token) {
    const frontendApi = getClerkFrontendApi();
    if (!frontendApi) throw new Error('Clerk publishable key is not configured');
    const parsed = jwt.decode(token, { complete: true });
    if (!parsed || parsed.header.alg !== 'RS256' || !parsed.header.kid) {
        throw new Error('Unsupported Clerk token');
    }
    if (!cachedKeys || cacheExpiresAt <= Date.now()) await loadKeys(frontendApi);
    let jwk = cachedKeys.find((key) => key.kid === parsed.header.kid && key.kty === 'RSA' && key.use === 'sig');
    if (!jwk) {
        await loadKeys(frontendApi);
        jwk = cachedKeys.find((key) => key.kid === parsed.header.kid && key.kty === 'RSA' && key.use === 'sig');
    }
    if (!jwk) throw new Error('Unknown Clerk signing key');
    return jwt.verify(token, createPublicKey({ key: jwk, format: 'jwk' }), {
        algorithms: ['RS256'],
        issuer: frontendApi,
    });
}

module.exports = { verifyClerkToken };
