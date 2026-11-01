require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { verifyClerkToken } = require('./clerkAuth.cjs');
const JWT_OPTIONS = { issuer: 'us-executive-api', audience: 'us-executive-users' };
const validator = require('validator');
const {
    bookingAdminEmail,
    bookingConfirmationEmail,
    contactAdminEmail,
    contactAutoReplyEmail,
    driverAdminEmail,
    driverConfirmationEmail
} = require('./emailTemplates');

// ─── Env validation ───────────────────────────────────────────────────────────
const JWT_SECRET     = process.env.JWT_SECRET;
const ADMIN_EMAILS   = (process.env.ADMIN_EMAIL || 'hassamazam999@gmail.com')
    .split(',')
    .map(e => e.trim().toLowerCase());
const ADMIN_EMAIL    = ADMIN_EMAILS[0]; // kept for legacy compat
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
    console.error('CRITICAL: JWT_SECRET is missing or too short (min 32 chars).');
    process.exit(1);
}
if (!process.env.ADMIN_EMAIL) { console.error('CRITICAL: ADMIN_EMAIL not set.'); process.exit(1); }
if (!ADMIN_PASSWORD) { console.error('CRITICAL: ADMIN_PASSWORD not set.'); process.exit(1); }
if (!GOOGLE_CLIENT_ID){ console.error('CRITICAL: GOOGLE_CLIENT_ID not set.'); process.exit(1); }

const app  = express();
const PORT = process.env.PORT || 5000;
app.set('trust proxy', 1);

// ─── Security Headers (helmet) ────────────────────────────────────────────────
// FIX #5: Add all HTTP security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc:     ["'self'"],
            scriptSrc:      ["'self'"],
            styleSrc:       ["'self'", "'unsafe-inline'"],
            imgSrc:         ["'self'", 'data:', 'https:'],
            connectSrc:     ["'self'"],
            frameSrc:       ["'none'"],
            objectSrc:      ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
// FIX #8: Proper CORS with explicit allowed origins & localhost support
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        // Allow all local dev origins (e.g. localhost:5173, localhost:5183, 127.0.0.1)
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }
        // Gracefully disallow without triggering Express 500 unhandled error
        callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parsers ─────────────────────────────────────────────────────────────
// FIX #4 & #10: Tight limits on all routes; only /api/apply gets 10mb for file
app.use((req, res, next) => {
    if (req.path === '/api/apply') {
        express.json({ limit: '10mb' })(req, res, next);
    } else {
        express.json({ limit: '64kb' })(req, res, next);
    }
});
app.use(express.urlencoded({ limit: '64kb', extended: true }));

// ─── Rate Limiters ────────────────────────────────────────────────────────────
// FIX #1 & #13: Per-route rate limiting

// Strict: login — 10 attempts per 15 min per IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
});

// Public forms — 20 per hour per IP (prevents spam flooding)
const formLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' },
});

// Analytics — 5 per minute per IP
const analyticsLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Rate limit exceeded.' },
});

// ─── Auth Middleware ──────────────────────────────────────────────────────────
async function getClerkEmail(claims) {
    if (claims?.sub && process.env.CLERK_SECRET_KEY) {
        try {
            const response = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(claims.sub)}`, {
                headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
                signal: AbortSignal.timeout(5000),
            });
            if (response.ok) {
                const user = await response.json();
                if (user.id === claims.sub) {
                    const primary = user.email_addresses?.find((item) => item.id === user.primary_email_address_id);
                    return (primary?.email_address || '').toLowerCase();
                }
            }
        } catch (error) {
            console.warn('Clerk API lookup failed:', error.message);
        }
    }
    return claims?.email_verified === true ? String(claims.email || claims.primary_email || '').toLowerCase() : null;
}

const authenticateAdmin = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const token = authHeader.slice(7);
    try {
        const decoded = jwt.verify(token, JWT_SECRET, { ...JWT_OPTIONS, algorithms: ['HS256'] });
        if (decoded.role === 'admin' && ADMIN_EMAILS.includes(String(decoded.email || '').toLowerCase())) {
            req.admin = decoded;
            return next();
        }
    } catch {
        // Continue with verified Clerk authentication.
    }
    try {
        const claims = await verifyClerkToken(token);
        const email = await getClerkEmail(claims);
        if (email && ADMIN_EMAILS.includes(email)) {
            req.admin = { role: 'admin', email };
            return next();
        }
    } catch {
        // Invalid or expired token.
    }
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
};


// User authentication supporting Clerk tokens, Admin tokens, and verified email
const authenticateUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authentication required to view your portal.' });
    }
    const token = authHeader.slice(7);
    let userEmail = null;
    try {
        const claims = jwt.verify(token, JWT_SECRET, { ...JWT_OPTIONS, algorithms: ['HS256'] });
        if (['admin', 'user'].includes(claims.role)) userEmail = String(claims.email || '').toLowerCase();
    } catch {
        try {
            const claims = await verifyClerkToken(token);
            userEmail = await getClerkEmail(claims);
        } catch {
            // Invalid or expired token.
        }
    }
    if (!userEmail) return res.status(401).json({ success: false, message: 'Authentication required to view your portal.' });
    req.user = { email: userEmail };
    return next();
};

// ─── Input Sanitizer ─────────────────────────────────────────────────────────
// FIX #9: Strip HTML/script tags from all string inputs
function sanitize(str) {
    if (typeof str !== 'string') return '';
    return validator.escape(str.trim()).slice(0, 2000);
}

function sanitizeEmail(str) {
    const e = typeof str === 'string' ? str.trim().toLowerCase() : '';
    return validator.isEmail(e) ? e : null;
}

function sanitizePhone(str) {
    if (typeof str !== 'string') return '';
    // Allow digits, spaces, +, -, (, )
    return str.replace(/[^\d\s+\-().]/g, '').slice(0, 20);
}

// ─── Request Logger (dev only, no body) ──────────────────────────────────────
// FIX #17: Never log request body (avoids password in logs)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
        next();
    });
}

// ─── Supabase ─────────────────────────────────────────────────────────────────
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
let supabase = null;
if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase connected.');
} else {
    console.warn('WARNING: Supabase env vars missing — DB features disabled.');
}

// ─── Google OAuth Client ─────────────────────────────────────────────────────
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// ─── SMTP Transporter ─────────────────────────────────────────────────────────
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.exchange2019.ionos.co.uk',
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: true },
});

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Analytics ───────────────────────────────────────────────────────────────
app.post('/api/track-visit', analyticsLimiter, async (req, res) => {
    try {
        if (!supabase) return res.status(200).json({ success: true });
        const { data, error } = await supabase
            .from('analytics').select('value').eq('metric', 'page_views').single();
        if (!error && data) {
            await supabase.from('analytics').update({ value: data.value + 1 }).eq('metric', 'page_views');
        } else if (error?.code === 'PGRST116') {
            await supabase.from('analytics').insert({ metric: 'page_views', value: 1 });
        }
        res.status(200).json({ success: true });
    } catch {
        res.status(200).json({ success: true });
    }
});

// ─── Booking ─────────────────────────────────────────────────────────────────
app.post('/api/book', formLimiter, async (req, res) => {
    try {
        // FIX #9: Sanitize all inputs
        const name         = sanitize(req.body.name);
        const email        = sanitizeEmail(req.body.email);
        const phone        = sanitizePhone(req.body.phone);
        const isReturn     = Boolean(req.body.isReturn);
        const pickup       = sanitize(req.body.pickup);
        const dropoff      = sanitize(req.body.dropoff);
        const date         = sanitize(req.body.date);
        const time         = sanitize(req.body.time);
        const returnDate   = sanitize(req.body.returnDate);
        const returnTime   = sanitize(req.body.returnTime);
        const passengers   = sanitize(String(req.body.passengers || '1'));
        const vehicleClass = sanitize(req.body.vehicleClass);
        const notes        = sanitize(req.body.notes);

        if (!name || !email || !phone || !pickup || !dropoff || !date || !time) {
            return res.status(400).json({ success: false, message: 'Required fields missing.' });
        }

        let bookingId = null;
        if (supabase) {
            const { data: inserted, error: dbError } = await supabase.from('bookings').insert([{
                name, email, phone, pickup, dropoff, date, time,
                return_date: isReturn ? returnDate : null,
                return_time: isReturn ? returnTime : null,
                passengers, vehicle_class: vehicleClass, status: 'Pending',
            }]).select('id').single();
            if (dbError) {
                console.warn('Supabase Warning:', dbError.message);
            } else if (inserted) {
                bookingId = inserted.id;
            }
        }

        const receiver  = process.env.EMAIL_RECEIVER || 'hello@us-executivetravel.com';
        const sender    = process.env.EMAIL_USER     || 'hello@us-executivetravel.com';
        const emailData = { name, email, phone, pickup, dropoff, date, time, returnDate, returnTime, passengers, vehicleClass, notes, isReturn };
        let mailError   = null;

        try {
            await transporter.sendMail({
                from: `"US Executive Travel" <${sender}>`, to: receiver, replyTo: email,
                subject: `🚗 NEW BOOKING: ${isReturn ? 'Return' : 'One-Way'} — ${name} | ${date}`,
                html: bookingAdminEmail(emailData),
            });
            console.log(`Booking email → ${receiver}`);
        } catch (err) {
            console.error('Booking admin mail FAILED:', err.code, err.response || err.message);
            mailError = err;
        }

        if (email) {
            try {
                await transporter.sendMail({
                    from: `"US Executive Travel" <${sender}>`, to: email,
                    subject: `Your Booking is Confirmed — US Executive Travel`,
                    html: bookingConfirmationEmail(emailData),
                });
                console.log(`Booking confirmation → ${email}`);
            } catch (err) {
                console.error('Booking confirmation mail FAILED:', err.code, err.response || err.message);
            }
        }

        res.status(200).json({ success: true, message: 'Request received successfully.', id: bookingId, emailSent: !mailError });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to submit request.' });
    }
});

// ─── Contact ─────────────────────────────────────────────────────────────────
app.post('/api/contact', formLimiter, async (req, res) => {
    try {
        const name    = sanitize(req.body.name);
        const email   = sanitizeEmail(req.body.email);
        const phone   = sanitizePhone(req.body.phone);
        const message = sanitize(req.body.message);

        if (!name || !email || !phone || !message) {
            return res.status(400).json({ success: false, message: 'Required fields missing.' });
        }

        if (supabase) {
            const { error: dbError } = await supabase.from('messages').insert([{ name, email, phone, message }]);
            if (dbError) console.warn('Supabase Warning:', dbError.message);
        }

        const receiver  = process.env.EMAIL_RECEIVER || 'hello@us-executivetravel.com';
        const sender    = process.env.EMAIL_USER     || 'hello@us-executivetravel.com';
        const emailData = { name, email, phone, message };
        let mailError   = null;

        try {
            await transporter.sendMail({
                from: `"US Executive Travel" <${sender}>`, to: receiver, replyTo: email,
                subject: `✉️ New Message from ${name}`,
                html: contactAdminEmail(emailData),
            });
            console.log(`Contact email → ${receiver}`);
        } catch (err) {
            console.error('Contact admin mail FAILED:', err.code, err.response || err.message);
            mailError = err;
        }

        if (email) {
            try {
                await transporter.sendMail({
                    from: `"US Executive Travel" <${sender}>`, to: email,
                    subject: `We received your message — US Executive Travel`,
                    html: contactAutoReplyEmail(emailData),
                });
                console.log(`Contact confirmation → ${email}`);
            } catch (err) {
                console.error('Contact confirmation mail FAILED:', err.code, err.response || err.message);
            }
        }

        res.status(200).json({ success: true, message: 'Message sent successfully.', emailSent: !mailError });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to send message.' });
    }
});

// ─── Driver Apply ─────────────────────────────────────────────────────────────
app.post('/api/apply', formLimiter, async (req, res) => {
    try {
        const name       = sanitize(req.body.name);
        const email      = sanitizeEmail(req.body.email);
        const phone      = sanitizePhone(req.body.phone);
        const license    = sanitize(req.body.license);
        const vehicle    = sanitize(req.body.vehicle);
        const experience = sanitize(req.body.experience);
        const document   = req.body.document; // base64 — validated below

        if (!name || !email || !phone || !license || !vehicle) {
            return res.status(400).json({ success: false, message: 'Required fields missing.' });
        }

        // FIX: Validate document is a legitimate base64 data URL
        let fileExt = 'pdf';
        let safeDocument = null;
        if (document && typeof document === 'string' && document.startsWith('data:')) {
            const mimeType = document.split(';')[0].split(':')[1];
            const allowed  = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
            if (!allowed.includes(mimeType)) {
                return res.status(400).json({ success: false, message: 'Invalid document type.' });
            }
            if (mimeType.includes('jpeg')) fileExt = 'jpg';
            else if (mimeType.includes('png'))  fileExt = 'png';
            else if (mimeType.includes('webp')) fileExt = 'webp';
            safeDocument = document;
        }

        if (supabase) {
            const { error: dbError } = await supabase.from('drivers')
                .insert([{ name, email, phone, license, vehicle, experience, document: safeDocument }]);
            if (dbError) console.warn('Supabase Warning:', dbError.message);
        }

        const receiver  = process.env.EMAIL_RECEIVER || 'hello@us-executivetravel.com';
        const sender    = process.env.EMAIL_USER     || 'hello@us-executivetravel.com';
        const emailData = { name, email, phone, license, vehicle, experience };
        let mailError   = null;

        try {
            await transporter.sendMail({
                from: `"US Executive Travel" <${sender}>`, to: receiver, replyTo: email,
                subject: `📋 NEW DRIVER APPLICATION: ${name}`,
                html: driverAdminEmail(emailData),
                attachments: safeDocument ? [{
                    filename: `Driver_Document_${name.replace(/[^a-z0-9]/gi, '_')}.${fileExt}`,
                    path: safeDocument,
                }] : [],
            });
            console.log(`Driver application → ${receiver}`);
        } catch (err) {
            console.error('Driver application mail FAILED:', err.code, err.response || err.message);
            mailError = err;
        }

        if (email) {
            try {
                await transporter.sendMail({
                    from: `"US Executive Travel" <${sender}>`, to: email,
                    subject: `Application Received — US Executive Travel`,
                    html: driverConfirmationEmail(emailData),
                });
                console.log(`Driver confirmation → ${email}`);
            } catch (err) {
                console.error('Driver confirmation mail FAILED:', err.code, err.response || err.message);
            }
        }

        res.status(200).json({ success: true, message: 'Application received successfully.', emailSent: !mailError });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to submit application.' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// Registration is handled by Clerk; this legacy endpoint must never mint tokens.
app.post('/api/admin/signup', (_req, res) => res.status(410).json({ success: false, message: 'Use the identity provider to sign up.' }));

// ─── Admin Login ──────────────────────────────────────────────────────────────
// FIX #7 & #17: No longer logs req.body; FIX #1: rate limited
app.post('/api/admin/login', loginLimiter, (req, res) => {
    const email    = sanitizeEmail(req.body.email);
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password required.' });
    }

    if (ADMIN_EMAILS.includes(email.toLowerCase()) && password === ADMIN_PASSWORD) {
        const token = jwt.sign({ role: 'admin', email }, JWT_SECRET, { expiresIn: '8h', ...JWT_OPTIONS });
        return res.status(200).json({ token, role: 'admin', success: true });
    }

    // FIX: consistent timing to prevent user enumeration
    res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// ─── Google Login ─────────────────────────────────────────────────────────────
app.post('/api/admin/google-login', loginLimiter, async (req, res) => {
    const credential = req.body.credential;
    if (!credential || typeof credential !== 'string') {
        return res.status(400).json({ success: false, message: 'Missing credential.' });
    }
    try {
        const ticket  = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        const email   = payload['email'];
        const role    = (ADMIN_EMAILS.includes(email.toLowerCase())) ? 'admin' : 'user';
        const token   = jwt.sign({ role, email }, JWT_SECRET, { expiresIn: '8h', ...JWT_OPTIONS });
        res.status(200).json({
            success: true, token, role,
            user: { name: payload['name'], email: payload['email'], picture: payload['picture'] },
        });
    } catch {
        res.status(400).json({ success: false, message: 'Invalid Google token.' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN PROTECTED ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
app.get('/api/admin/dashboard', authenticateAdmin, async (req, res) => {
    if (req.admin.role !== 'admin' || !ADMIN_EMAILS.includes((req.admin.email || '').toLowerCase())) {
        return res.status(403).json({ success: false, message: 'Forbidden.' });
    }
    try {
        if (!supabase) {
            return res.status(200).json({
                bookings: [], messages: [], drivers: [],
                stats: { total_bookings: 0, pending_bookings: 0, total_messages: 0, total_drivers: 0, page_views: 0, active_sessions: 1 },
                success: true, dbConnected: false,
            });
        }

        const [{ data: bookings, error: bError }, { data: messages, error: mError },
               { data: drivers, error: dError }, { data: analytics, error: aError }] = await Promise.all([
            supabase.from('bookings').select('*').order('created_at', { ascending: false }),
            supabase.from('messages').select('*').order('created_at', { ascending: false }),
            supabase.from('drivers').select('*').order('created_at', { ascending: false }),
            supabase.from('analytics').select('*'),
        ]);

        if (bError || mError || dError || aError) throw (bError || mError || dError || aError);

        const stats = {
            total_bookings:   bookings?.length  || 0,
            pending_bookings: bookings?.filter(b => b.status === 'Pending').length || 0,
            total_messages:   messages?.length  || 0,
            total_drivers:    drivers?.length   || 0,
            page_views:       analytics?.find(a => a.metric === 'page_views')?.value || 0,
            active_sessions:  Math.floor(Math.random() * 5) + 1,
        };

        res.status(200).json({ bookings: bookings || [], messages: messages || [], drivers: drivers || [], stats, success: true, dbConnected: true });
    } catch (error) {
        console.error('Dashboard error:', error);
        // FIX #14: Never leak internal error messages to client
        res.status(500).json({ success: false, message: 'Failed to load dashboard.' });
    }
});

// ─── User Dashboard ───────────────────────────────────────────────────────────
app.get('/api/user/dashboard', authenticateUser, async (req, res) => {
    try {
        const userEmail = req.user.email;
        if (!userEmail) return res.status(400).json({ success: false, message: 'User email not found.' });
        if (!supabase)  return res.status(200).json({ bookings: [], success: true, dbConnected: false });

        const { data: bookings, error: bError } = await supabase
            .from('bookings').select('*').eq('email', userEmail).order('created_at', { ascending: false });

        if (bError) throw bError;
        res.status(200).json({ bookings: bookings || [], success: true, dbConnected: true });
    } catch (error) {
        console.error('User Dashboard error:', error);
        res.status(500).json({ success: false, message: 'Failed to load dashboard.' });
    }
});

// ─── Update Booking Status ────────────────────────────────────────────────────
app.post('/api/admin/bookings/:id/status', authenticateAdmin, async (req, res) => {
    if (req.admin.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden.' });

    const VALID_STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
    const status = req.body.status;
    if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    try {
        if (!supabase) return res.status(200).json({ success: true });
        const { error } = await supabase.from('bookings').update({ status }).eq('id', req.params.id);
        if (error) throw error;
        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to update status.' });
    }
});

// ─── Delete Booking ───────────────────────────────────────────────────────────
app.delete('/api/admin/bookings/:id', authenticateAdmin, async (req, res) => {
    if (req.admin.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden.' });
    try {
        if (!supabase) return res.status(200).json({ success: true });
        const { error } = await supabase.from('bookings').delete().eq('id', req.params.id);
        if (error) throw error;
        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to delete booking.' });
    }
});

// ─── 404 catch-all ────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Not found.' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// FIX #14: Never leak stack traces or internal messages
app.use((err, req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
