import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import clerkAuth from '../server/clerkAuth.cjs';

const { verifyClerkToken } = clerkAuth;
const JWT_OPTIONS = { issuer: 'us-executive-api', audience: 'us-executive-users' };

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_EMAILS = (process.env.ADMIN_EMAIL || 'hassamazam999@gmail.com')
    .split(',')
    .map(e => e.trim().toLowerCase());
const ADMIN_EMAIL = ADMIN_EMAILS[0]; // legacy compat
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

if (!JWT_SECRET) {
    console.error("CRITICAL: JWT_SECRET environment variable is not set.");
    process.exit(1);
}
if (!ADMIN_EMAIL) {
    console.error("CRITICAL: ADMIN_EMAIL environment variable is not set.");
    process.exit(1);
}
if (!ADMIN_PASSWORD) {
    console.error("CRITICAL: ADMIN_PASSWORD environment variable is not set.");
    process.exit(1);
}
if (!GOOGLE_CLIENT_ID) {
    console.error("CRITICAL: GOOGLE_CLIENT_ID environment variable is not set.");
    process.exit(1);
}

const app = express();
app.set('trust proxy', 1);

const formLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const analyticsLimiter = rateLimit({ windowMs: 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });

const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || 'https://us-executivetravel.com,http://localhost:5173')
    .split(',')
    .map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }
        callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use((req, res, next) => {
    const limit = req.path === '/api/apply' ? '10mb' : '64kb';
    express.json({ limit })(req, res, next);
});
app.use(express.urlencoded({ limit: '64kb', extended: true }));

// Request logger (disabled in production to reduce noise)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
        next();
    });
}

// Resolve Clerk identity only after the session token has passed signature and issuer checks.
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
    return claims?.email_verified === true
        ? String(claims.email || claims.primary_email || '').toLowerCase()
        : null;
}

const authenticateAdmin = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const token = authHeader.slice(7);
    try {
        const decoded = jwt.verify(token, JWT_SECRET, { ...JWT_OPTIONS, algorithms: ['HS256'] });
        if (decoded.role === 'admin' && ADMIN_EMAILS.includes(String(decoded.email || '').toLowerCase())) {
            req.admin = decoded;
            return next();
        }
    } catch {
        // Try a Clerk session token next.
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
    return res.status(401).json({ success: false, message: 'Invalid token' });
};

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

// OAuth2Client initialized once at startup
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Supabase initialization — only use anon key, never service role
const getSupabase = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) {
        console.error("CRITICAL: Missing Supabase URL or Key. Check Vercel Env Vars.");
        return null;
    }
    return createClient(url, key);
};

const supabase = getSupabase();

// Transporter setup — IONOS Exchange 2019 (us-executivetravel.com)
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.exchange2019.ionos.co.uk',
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: true
    }
});

// Diagnostic endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        msg: 'Serverless backend is alive!',
        config: {
            has_supabase: !!supabase,
            has_google_cid: !!GOOGLE_CLIENT_ID,
            has_jwt_secret: !!JWT_SECRET,
            node_env: process.env.NODE_ENV
        }
    });
});

// Helper for dynamic recipient
const getReceiver = () => process.env.NODE_ENV === 'development' 
    ? process.env.TEST_EMAIL_RECEIVER 
    : (process.env.EMAIL_RECEIVER || 'hello@us-executivetravel.com');

// Analytics tracking endpoint (called by frontend on load)
app.post('/api/track-visit', analyticsLimiter, async (req, res) => {
    try {
        if (!supabase) return res.status(200).json({ success: true, note: "Supabase not connected" });
        
        const { data, error } = await supabase
            .from('analytics')
            .select('value')
            .eq('metric', 'page_views')
            .single();

        if (!error && data) {
            await supabase
                .from('analytics')
                .update({ value: data.value + 1 })
                .eq('metric', 'page_views');
        } else if (error && error.code === 'PGRST116') {
            await supabase.from('analytics').insert({ metric: 'page_views', value: 1 });
        }
        res.status(200).json({ success: true });
    } catch (e) {
        res.status(200).json({ success: true, fake: true });
    }
});

app.post('/api/book', formLimiter, async (req, res) => {
    try {
        const {
            name, email, phone, isReturn, pickup, dropoff, date, time,
            returnDate, returnTime, passengers, vehicleClass, notes
        } = req.body;

        if (supabase) {
            try {
                const { error: dbError } = await supabase
                    .from('bookings')
                    .insert([{
                        name, email, phone, pickup, dropoff, date, time, 
                        return_date: isReturn ? returnDate : null, 
                        return_time: isReturn ? returnTime : null, 
                        passengers, vehicle_class: vehicleClass,
                        status: 'Pending'
                    }]);
                if (dbError) console.warn("Supabase Write failed:", dbError.message);
            } catch (dbError) {
                console.warn("Supabase Write failed:", dbError.message);
            }
        }

        const sender   = process.env.EMAIL_USER     || 'hello@us-executivetravel.com';
        const receiver = process.env.EMAIL_RECEIVER || 'hello@us-executivetravel.com';

        // ── Admin notification (plain text — reliable across all mail clients) ──
        let adminText = `NEW BOOKING REQUEST\n${"=".repeat(40)}\nName:    ${name}\nEmail:   ${email}\nPhone:   ${phone}\n\nPick-up:  ${pickup}\nDrop-off: ${dropoff}\nDate:     ${date} at ${time}`;
        if (isReturn) adminText += `\nReturn:   ${returnDate} at ${returnTime}`;
        adminText += `\n\nPassengers: ${passengers}\nVehicle:    ${vehicleClass}`;
        if (notes) adminText += `\nNotes:      ${notes}`;
        adminText += `\n${"=".repeat(40)}`;

        // ── Customer confirmation (HTML) ──
        const customerHtml = `
<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#0d0005;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">
  <div style="background:#1a000d;border:1px solid #3a0020;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#1a000d,#0d0005);padding:32px;text-align:center;border-bottom:1px solid #3a0020;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;color:#d47289;text-transform:uppercase;">US Executive Travel</p>
      <h1 style="margin:0;font-size:26px;font-weight:900;color:#ffffff;text-transform:uppercase;letter-spacing:-0.5px;">Booking Confirmed</h1>
      <p style="margin:8px 0 0;font-size:13px;color:#9a607a;">Your chauffeur will be confirmed shortly</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="margin:0 0 20px;font-size:15px;color:#e0b0c0;">Hi <strong style="color:#fff;">${name}</strong>,</p>
      <p style="margin:0 0 24px;font-size:14px;color:#9a607a;line-height:1.6;">Thank you for booking with US Executive Travel. We have received your request and our team will confirm your dedicated chauffeur shortly.</p>
      
      <div style="background:#0d0005;border:1px solid #3a0020;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 14px;font-size:11px;letter-spacing:2px;color:#d47289;text-transform:uppercase;font-weight:700;">Journey Summary</p>
        ${[
          ["Pick-up",   pickup],
          ["Drop-off",  dropoff],
          ["Date",      date],
          ["Time",      time],
          ...(isReturn ? [["Return Date", returnDate], ["Return Time", returnTime]] : []),
          ["Passengers", passengers],
          ["Vehicle",   vehicleClass],
        ].map(([l, v]) => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #2a0018;">
          <span style="font-size:13px;color:#7a3060;">${l}</span>
          <span style="font-size:13px;color:#fff;font-weight:600;text-align:right;max-width:60%;">${v}</span>
        </div>`).join("")}
      </div>

      <div style="background:#1a000d;border:1px solid #3a0020;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:13px;color:#9a607a;">Need to make changes or have questions?</p>
        <p style="margin:0;font-size:14px;color:#e0b0c0;">Call us 24/7: <a href="tel:07412671467" style="color:#ec4899;font-weight:700;text-decoration:none;">07412671467</a></p>
        <p style="margin:4px 0 0;font-size:13px;color:#7a3060;">Or reply to this email</p>
      </div>

      <div style="text-align:center;">
        <a href="https://www.us-executivetravel.com/dashboard" style="display:inline-block;background:#ec4899;color:#fff;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:2px;padding:14px 32px;border-radius:50px;text-decoration:none;">View My Booking Portal</a>
      </div>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #3a0020;text-align:center;">
      <p style="margin:0;font-size:11px;color:#4a2030;">&copy; ${new Date().getFullYear()} US Executive Travel &bull; <a href="https://www.us-executivetravel.com" style="color:#7a3060;text-decoration:none;">us-executivetravel.com</a></p>
    </div>
  </div>
</div>
</body></html>`;

        // Send admin notification
        try {
            await transporter.sendMail({
                from: `"US Executive Travel" <${sender}>`,
                to: receiver,
                replyTo: email,
                subject: `🚗 NEW BOOKING: ${isReturn ? "Return" : "One-Way"} — ${name} | ${date}`,
                text: adminText,
            });
            console.log(`Booking admin email → ${receiver}`);
        } catch (mailError) {
            console.error("Admin mail FAILED:", mailError.message);
        }

        // Send customer confirmation
        if (email) {
            try {
                await transporter.sendMail({
                    from: `"US Executive Travel" <${sender}>`,
                    to: email,
                    subject: `Booking Confirmed — US Executive Travel`,
                    html: customerHtml,
                    text: `Hi ${name},\n\nYour booking has been received.\n\nPick-up: ${pickup}\nDrop-off: ${dropoff}\nDate: ${date} at ${time}\nVehicle: ${vehicleClass}\n\nOur team will confirm your chauffeur shortly.\nCall us: 07412671467\n\n— US Executive Travel`,
                });
                console.log(`Customer confirmation → ${email}`);
            } catch (mailError) {
                console.error("Customer confirmation FAILED:", mailError.message);
            }
        }

        res.status(200).json({ success: true, message: "Request received successfully." });
    } catch (error) {
        console.error("Book endpoint error:", error);
        res.status(500).json({ success: false, message: "Failed to submit request." });
    }
});

app.post('/api/contact', formLimiter, async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;
        if (supabase) {
            try {
                const { error: dbError } = await supabase
                    .from('messages')
                    .insert([{ name, email, phone, message }]);
                if (dbError) throw dbError;
            } catch (err) {
                console.warn("Supabase Warning:", err.message);
            }
        }

        const mailOptions = {
            from: process.env.EMAIL_USER || 'hello@us-executivetravel.com',
            to: getReceiver(),
            subject: `New Message from ${name}`,
            text: `NEW CONTACT MESSAGE\n========================================\nCUSTOMER DETAILS:\n- Name: ${name}\n- Email: ${email}\n- Phone: ${phone}\n\nMESSAGE:\n${message}\n========================================`
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (mailError) {
            console.warn("Mail transport failed.");
        }
        res.status(200).json({ success: true, message: "Message sent successfully." });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.post('/api/apply', formLimiter, async (req, res) => {
    try {
        const { name, email, phone, license, vehicle, experience, document } = req.body;
        let fileExt = 'pdf';
        let documentBuffer = null;
        if (document) {
            const match = typeof document === 'string'
                ? document.match(/^data:(image\/(?:jpeg|png|webp)|application\/pdf);base64,([A-Za-z0-9+/]+={0,2})$/)
                : null;
            if (!match) return res.status(400).json({ success: false, message: 'Invalid document.' });
            const mimeType = match[1];
            if (mimeType === 'image/jpeg') fileExt = 'jpg';
            else if (mimeType === 'image/png') fileExt = 'png';
            else if (mimeType === 'image/webp') fileExt = 'webp';
            documentBuffer = Buffer.from(match[2], 'base64');
            if (documentBuffer.length > 8 * 1024 * 1024) {
                return res.status(413).json({ success: false, message: 'Document is too large.' });
            }
        }
        // 1. First, save to Supabase
        if (supabase) {
            const { error: dbError } = await supabase
                .from('drivers')
                .insert([{ name, email, phone, license, vehicle, experience, document }]);
            
            if (dbError) {
                console.error("Supabase Error:", dbError);
                return res.status(500).json({ success: false, error: `Database Error: ${dbError.message}` });
            }
        }

        // 2. Prepare Email
        const mailOptions = {
            from: process.env.EMAIL_USER || 'hello@us-executivetravel.com',
            to: getReceiver(),
            subject: `NEW DRIVER APPLICATION: ${name}`,
            text: `NEW DRIVER APPLICATION RECEIVED\n========================================\nDRIVER DETAILS:\n- Name: ${name}\n- Email: ${email}\n- Phone: ${phone}\n\nPROFESSIONAL INFO:\n- PHV License: ${license}\n- Vehicle: ${vehicle}\n\nEXPERIENCE / BIO:\n${experience}\n========================================`,
            attachments: document ? [
                {
                    filename: `Driver_Document.${fileExt}`,
                    content: documentBuffer
                }
            ] : []
        };

        // 3. Return success IMMEDIATELY to avoid client timeout
        res.status(200).json({ success: true, message: "Application received. Processing email in background." });

        // 4. Send email in background (errors here won't affect the client response)
        transporter.sendMail(mailOptions).catch(err => {
            console.error("Background Email Error:", err.message);
        });

    } catch (error) {
        console.error("APPLICATION ERROR:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Registration is handled by Clerk; this legacy endpoint must never mint tokens.
app.post('/api/admin/signup', (_req, res) => res.status(410).json({ success: false, message: 'Use the identity provider to sign up.' }));

// Admin & User Auth
app.post('/api/admin/login', loginLimiter, (req, res) => {
    const { email, password } = req.body;

    if (ADMIN_EMAILS.includes(email.toLowerCase()) && password === ADMIN_PASSWORD) {
        if (process.env.NODE_ENV !== 'production') {
            console.log("Admin Login Success");
        }
        const token = jwt.sign({ role: 'admin', email }, JWT_SECRET, { expiresIn: '8h', ...JWT_OPTIONS });
        return res.status(200).json({ token, role: 'admin', success: true });
    } else {
        if (process.env.NODE_ENV !== 'production') {
            console.log("Login Denied: Invalid Credentials");
        }
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Admin Dashboard Data
app.get('/api/admin/dashboard', authenticateAdmin, async (req, res) => {
    if (req.admin.role !== 'admin' || (req.admin.email && !ADMIN_EMAILS.includes(req.admin.email.toLowerCase()))) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (!supabase) {
        return res.status(200).json({
            bookings: [],
            messages: [],
            drivers: [],
            stats: {
                total_bookings: 0,
                pending_bookings: 0,
                total_messages: 0,
                total_drivers: 0,
                page_views: 0,
                active_sessions: 1
            },
            success: true,
            dbConnected: false
        });
    }

    try {
        const { data: bookings } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
        const { data: messages } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
        const { data: drivers } = await supabase.from('drivers').select('*').order('created_at', { ascending: false });
        const { data: analytics } = await supabase.from('analytics').select('*');

        const stats = {
            total_bookings: bookings?.length || 0,
            pending_bookings: bookings?.filter(b => b.status === 'Pending').length || 0,
            total_messages: messages?.length || 0,
            total_drivers: drivers?.length || 0,
            page_views: analytics?.find(a => a.metric === 'page_views')?.value || 0,
            active_sessions: Math.floor(Math.random() * 5) + 1
        };

        res.status(200).json({ bookings: bookings || [], messages: messages || [], drivers: drivers || [], stats, success: true, dbConnected: true });
    } catch (error) {
        res.status(200).json({ 
            bookings: [], 
            messages: [], 
            drivers: [], 
            stats: { total_bookings: 0, pending_bookings: 0, total_messages: 0, total_drivers: 0, page_views: 0, active_sessions: 1 },
            success: true,
            error: error.message 
        });
    }
});

// User Dashboard Data
app.get('/api/user/dashboard', authenticateUser, async (req, res) => {
    if (!supabase) {
        return res.status(200).json({ bookings: [], success: true, dbConnected: false });
    }
    try {
        const userEmail = req.user.email;
        const { data: bookings } = await supabase.from('bookings').select('*').eq('email', userEmail).order('created_at', { ascending: false });
        res.status(200).json({ bookings: bookings || [], success: true, dbConnected: true });
    } catch (error) {
        res.status(200).json({ bookings: [], success: true, error: error.message });
    }
});

app.post('/api/admin/bookings/:id/status', authenticateAdmin, async (req, res) => {
    if (!supabase) {
        return res.status(200).json({ success: true, message: 'Updated locally (DB not connected)' });
    }
    try {
        const { status } = req.body;
        await supabase.from('bookings').update({ status }).eq('id', req.params.id);
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.delete('/api/admin/bookings/:id', authenticateAdmin, async (req, res) => {
    if (!supabase) {
        return res.status(200).json({ success: true, message: 'Deleted locally (DB not connected)' });
    }
    try {
        await supabase.from('bookings').delete().eq('id', req.params.id);
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// Google Login Verification
app.post('/api/admin/google-login', loginLimiter, async (req, res) => {
    const { credential } = req.body;

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const email = payload['email'];
        const role = (ADMIN_EMAILS.includes(email.toLowerCase())) ? 'admin' : 'user';
        const token = jwt.sign({ role, email }, JWT_SECRET, { expiresIn: '8h', ...JWT_OPTIONS });
        res.status(200).json({ success: true, token, role, user: { name: payload['name'], email, picture: payload['picture'] } });
    } catch (error) {
        console.error("Google verify error:", error.message);
        res.status(400).json({ success: false, message: 'Google Verification Failed' });
    }
});

export default app;
