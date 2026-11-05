import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import clerkAuth from '../server/clerkAuth.cjs';
import driverApplication from '../server/driverApplication.cjs';
import chatSystem from '../server/chatSystem.cjs';

const { verifyClerkToken } = clerkAuth;
const { APPLICATION_STATUSES, BUCKET, DOCUMENTS, MAX_DOCUMENT_BYTES, getDocumentExtension, getDueExpiryReminders, secretsMatch, validateApplicationPayload, validateSessionId } = driverApplication;
const { createChatToken, hashChatToken, isUuid, loadRecentChatSummaries, normalizeDriverProfile, validateVisitorIdentity, validateVisitorMessage } = chatSystem;
const JWT_OPTIONS = { issuer: 'us-executive-api', audience: 'us-executive-users' };

const JWT_SECRET = process.env.JWT_SECRET;
// Keep the Vercel API allowlist aligned with the admin accounts offered by the
// sign-in screen. ADMIN_EMAIL may add other managed accounts.
const ADMIN_EMAILS = Array.from(new Set([
    'hassamazam999@gmail.com',
    'hello@us-executivetravel.com',
    ...(process.env.ADMIN_EMAIL || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean),
]));
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
const chatStartLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const chatReadLimiter = rateLimit({ windowMs: 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false });
const chatWriteLimiter = rateLimit({ windowMs: 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

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
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Chat-Token'],
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

// Supabase admin client. This key must remain server-only.
const getSupabase = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.error("Supabase persistence is disabled. Set VITE_SUPABASE_URL and the server-only SUPABASE_SERVICE_ROLE_KEY.");
        return null;
    }
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
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

app.get('/api/drivers', async (_req, res) => {
    if (!supabase) return res.status(200).json({ success: true, drivers: [] });
    try {
        const { data, error } = await supabase.from('driver_profiles')
            .select('id,display_name,headline,bio,base_location,photo_url,vehicle,services')
            .eq('status', 'active').eq('is_public', true).order('display_name');
        if (error) throw error;
        return res.status(200).json({ success: true, drivers: data || [] });
    } catch (error) {
        console.error('Could not load public driver profiles:', error.message);
        return res.status(503).json({ success: false, drivers: [], message: 'Driver profiles are temporarily unavailable.' });
    }
});

app.post('/api/chat/conversations', chatStartLimiter, async (req, res) => {
    const type = req.body?.type;
    const driverProfileId = req.body?.driverProfileId;
    if (!['support', 'driver'].includes(type)) return res.status(400).json({ success: false, message: 'Choose support or a driver chat.' });
    if ((type === 'driver' && !isUuid(driverProfileId)) || (type === 'support' && driverProfileId)) {
        return res.status(400).json({ success: false, message: 'The chat destination is invalid.' });
    }
    const identityResult = validateVisitorIdentity({ name: req.body?.name, email: req.body?.email });
    if (identityResult.error) return res.status(400).json({ success: false, message: identityResult.error });
    if (!supabase) return res.status(503).json({ success: false, message: 'Chat is temporarily unavailable. Please call 07412 671467.' });

    try {
        let driverName = null;
        if (type === 'driver') {
            const { data: profile, error: profileError } = await supabase.from('driver_profiles')
                .select('id,display_name').eq('id', driverProfileId).eq('status', 'active').eq('is_public', true).maybeSingle();
            if (profileError) throw profileError;
            if (!profile) return res.status(404).json({ success: false, message: 'That driver is no longer available for chat.' });
            driverName = profile.display_name;
        }

        const chatToken = createChatToken();
        const { data: conversation, error } = await supabase.from('chat_conversations').insert({
            conversation_type: type,
            driver_profile_id: type === 'driver' ? driverProfileId : null,
            visitor_name: identityResult.identity.name,
            visitor_email: identityResult.identity.email,
            visitor_token_hash: hashChatToken(chatToken),
        }).select('id,status,conversation_type,driver_profile_id,visitor_name,created_at').single();
        if (error) throw error;
        return res.status(201).json({ success: true, conversation, chatToken, driverName });
    } catch (error) {
        console.error('Could not create chat conversation:', error.message);
        return res.status(503).json({ success: false, message: 'Chat is temporarily unavailable. Please call 07412 671467.' });
    }
});

app.get('/api/chat/conversations/:id/messages', chatReadLimiter, async (req, res) => {
    const tokenHash = hashChatToken(req.get('X-Chat-Token'));
    if (!isUuid(req.params.id) || !tokenHash) return res.status(401).json({ success: false, message: 'This chat session is invalid.' });
    if (!supabase) return res.status(503).json({ success: false, message: 'Chat is temporarily unavailable.' });
    try {
        const { data: conversation, error: conversationError } = await supabase.from('chat_conversations')
            .select('id,status,conversation_type,driver_profile_id,visitor_name').eq('id', req.params.id)
            .eq('visitor_token_hash', tokenHash).maybeSingle();
        if (conversationError) throw conversationError;
        if (!conversation) return res.status(404).json({ success: false, message: 'Chat session not found.' });
        const { data: messages, error } = await supabase.from('chat_messages')
            .select('id,sender_role,body,created_at').eq('conversation_id', conversation.id)
            .order('created_at', { ascending: true }).limit(250);
        if (error) throw error;
        return res.status(200).json({ success: true, conversation: { id: conversation.id, status: conversation.status }, messages: messages || [] });
    } catch (error) {
        console.error('Could not load chat messages:', error.message);
        return res.status(503).json({ success: false, message: 'Chat messages could not be loaded.' });
    }
});

app.post('/api/chat/conversations/:id/messages', chatWriteLimiter, async (req, res) => {
    const tokenHash = hashChatToken(req.get('X-Chat-Token'));
    const body = validateVisitorMessage(req.body?.body);
    if (!isUuid(req.params.id) || !tokenHash) return res.status(401).json({ success: false, message: 'This chat session is invalid.' });
    if (!body) return res.status(400).json({ success: false, message: 'Write a message up to 2,000 characters.' });
    if (!supabase) return res.status(503).json({ success: false, message: 'Chat is temporarily unavailable.' });
    try {
        const { data: conversation, error: conversationError } = await supabase.from('chat_conversations')
            .select('id,status').eq('id', req.params.id).eq('visitor_token_hash', tokenHash).maybeSingle();
        if (conversationError) throw conversationError;
        if (!conversation) return res.status(404).json({ success: false, message: 'Chat session not found.' });
        if (conversation.status !== 'open') return res.status(409).json({ success: false, message: 'This chat is closed.' });
        const { error: insertError } = await supabase.from('chat_messages').insert({ conversation_id: conversation.id, sender_role: 'visitor', body });
        if (insertError) throw insertError;
        const { error: updateError } = await supabase.from('chat_conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversation.id);
        if (updateError) throw updateError;
        return res.status(201).json({ success: true });
    } catch (error) {
        console.error('Could not send chat message:', error.message);
        return res.status(503).json({ success: false, message: 'Your message could not be sent.' });
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

app.post('/api/apply/upload-url', formLimiter, async (req, res) => {
    const { sessionId, documentType, mimeType, size } = req.body || {};
    const extension = getDocumentExtension(documentType, mimeType);
    if (!validateSessionId(sessionId) || !extension || !Number.isSafeInteger(size) || size < 1 || size > MAX_DOCUMENT_BYTES) {
        return res.status(400).json({ success: false, message: 'Choose a PDF, JPG or PNG document up to 8 MB.' });
    }
    if (!supabase) return res.status(503).json({ success: false, message: 'Secure document storage is not configured.' });

    const path = `applications/${sessionId}/${documentType}.${extension}`;
    try {
        const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
        if (error || !data?.token) throw error || new Error('Upload URL could not be created.');
        return res.status(200).json({ success: true, path: data.path, token: data.token });
    } catch (error) {
        console.error('Could not create a driver document upload URL:', error.message);
        return res.status(503).json({ success: false, message: 'Secure document storage is unavailable. Please try again later.' });
    }
});

app.post('/api/apply', formLimiter, async (req, res) => {
    const validation = validateApplicationPayload(req.body);
    if (validation.error) return res.status(400).json({ success: false, message: validation.error });
    if (!supabase) return res.status(503).json({ success: false, message: 'Applications are temporarily unavailable. Please contact our team.' });

    const { application, uploadSessionId } = validation;
    const documentEntries = Object.entries(application.documents);
    try {
        if (documentEntries.length) {
            const folder = `applications/${uploadSessionId}`;
            const { data: objects, error: listError } = await supabase.storage.from(BUCKET).list(folder, { limit: 20 });
            if (listError) throw listError;
            const uploadedNames = new Set((objects || []).map((object) => object.name));
            const missingUpload = documentEntries.some(([key, document]) => !uploadedNames.has(`${key}.${getDocumentExtension(key, document.mimeType)}`));
            if (missingUpload) return res.status(400).json({ success: false, message: 'One or more documents have not finished uploading. Please retry.' });
        }

        const { personal } = application;
        const vehicleLabel = [application.vehicle.make, application.vehicle.model, application.vehicle.year].filter(Boolean).join(' ') || 'Vehicle not yet selected';
        const initialStatus = personal.licensedByRbbc === 'Yes' ? 'Application Received' : 'Pending Licensing Approval';
        const { data: inserted, error: insertError } = await supabase.from('drivers').insert([{
            name: personal.fullName,
            email: personal.email,
            phone: personal.phone,
            license: personal.driverLicenceNumber || '',
            vehicle: vehicleLabel,
            experience: application.experience,
            document: null,
            application_data: application,
            application_status: initialStatus,
            availability_status: 'unavailable',
        }]).select('id').single();
        if (insertError || !inserted) throw insertError || new Error('Application record could not be created.');

        const applicationId = inserted.id;
        const from = process.env.EMAIL_USER || 'hello@us-executivetravel.com';
        const adminUrl = 'https://us-executivetravel.com/admin';
        const adminEmail = {
            from: `US Executive Travel <${from}>`,
            to: getReceiver(),
            replyTo: personal.email,
            subject: `New driver application #${applicationId}`,
            text: [
                'A new driver application has been received.',
                `Applicant: ${personal.fullName}`,
                `Email: ${personal.email}`,
                `Phone: ${personal.phone}`,
                `Application status: ${initialStatus}`,
                '',
                'Uploaded documents are stored privately and are not attached to this email.',
                `Sign in to review the application: ${adminUrl}`,
            ].join('\n'),
        };
        const applicantEmail = {
            from: `US Executive Travel <${from}>`,
            to: personal.email,
            subject: 'We received your driver application',
            text: [
                `Hello ${personal.fullName},`,
                '',
                `We have received your application (reference #${applicationId}).`,
                `Current status: ${initialStatus}.`,
                'Our management team will review your information and contact you about next steps.',
                'Registering interest does not guarantee work or approval as a driver.',
                '',
                'US Executive Travels',
            ].join('\n'),
        };
        const mailResults = await Promise.allSettled([transporter.sendMail(adminEmail), transporter.sendMail(applicantEmail)]);
        const emailSent = mailResults.every((result) => result.status === 'fulfilled');
        if (!emailSent) console.error('One or more driver application acknowledgement emails failed.');
        return res.status(200).json({ success: true, applicationId, applicationStatus: initialStatus, emailSent });
    } catch (error) {
        console.error('Driver application processing failed:', error.message);
        return res.status(500).json({ success: false, message: 'The application could not be saved. Please try again or contact our team.' });
    }
});

app.get('/api/cron/driver-expiry-reminders', async (req, res) => {
    const expected = process.env.CRON_SECRET;
    const provided = typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : '';
    if (!expected) return res.status(503).json({ success: false, message: 'Reminder schedule is not configured.' });
    if (!secretsMatch(expected, provided)) return res.status(401).json({ success: false, message: 'Unauthorized.' });
    if (!supabase) return res.status(503).json({ success: false, message: 'Database connection is not configured.' });

    try {
        const today = new Date().toISOString().slice(0, 10);
        const groups = new Map();
        for (let offset = 0; ; offset += 500) {
            const { data: drivers, error } = await supabase.from('drivers')
                .select('id,name,email,application_status,application_data')
                .range(offset, offset + 499);
            if (error) throw error;
            for (const driver of drivers || []) {
                if (!driver.email || ['Rejected', 'Inactive'].includes(driver.application_status)) continue;
                for (const reminder of getDueExpiryReminders(driver, today)) {
                    const key = `${driver.id}:${reminder.daysBefore}`;
                    const group = groups.get(key) || { driver, daysBefore: reminder.daysBefore, reminders: [] };
                    group.reminders.push(reminder);
                    groups.set(key, group);
                }
            }
            if (!drivers || drivers.length < 500) break;
        }

        let sent = 0;
        for (const group of groups.values()) {
            const pending = [];
            for (const reminder of group.reminders) {
                const { data: existing, error } = await supabase.from('driver_expiry_reminders')
                    .select('driver_id')
                    .eq('driver_id', String(group.driver.id))
                    .eq('document_key', reminder.key)
                    .eq('expiry_date', reminder.expiryDate)
                    .eq('days_before', reminder.daysBefore)
                    .maybeSingle();
                if (error) throw error;
                if (!existing) pending.push(reminder);
            }
            if (!pending.length) continue;

            const list = pending.map((reminder) => `- ${reminder.label}: ${reminder.expiryDate} (${reminder.daysBefore} days away)`).join('\n');
            const from = `US Executive Travel <${process.env.EMAIL_USER || 'hello@us-executivetravel.com'}>`;
            const results = await Promise.allSettled([
                transporter.sendMail({
                    from, to: group.driver.email,
                    subject: `Driver document expiry reminder — ${group.daysBefore} days`,
                    text: `Hello ${group.driver.name},\n\nThe following driver or vehicle document(s) are due to expire in ${group.daysBefore} days:\n\n${list}\n\nPlease contact management to provide updated documents through the secure application process. Do not email medical reports or Enhanced DBS certificates.\n\nUS Executive Travels`,
                }),
                transporter.sendMail({
                    from, to: getReceiver(),
                    subject: `Driver document expiry — ${group.driver.name} (${group.daysBefore} days)`,
                    text: [`Driver: ${group.driver.name} (#${group.driver.id})`, `Email: ${group.driver.email}`, '', list, '', 'Review the record in the authorised admin area: https://us-executivetravel.com/admin'].join('\n'),
                }),
            ]);
            if (results.some((result) => result.status !== 'fulfilled')) continue;
            const { error: recordError } = await supabase.from('driver_expiry_reminders').upsert(
                pending.map((reminder) => ({
                    driver_id: String(group.driver.id), document_key: reminder.key,
                    expiry_date: reminder.expiryDate, days_before: reminder.daysBefore,
                })),
                { onConflict: 'driver_id,document_key,expiry_date,days_before', ignoreDuplicates: true },
            );
            if (recordError) throw recordError;
            sent += pending.length;
        }
        return res.status(200).json({ success: true, remindersSent: sent });
    } catch (error) {
        console.error('Driver expiry reminder run failed:', error.message);
        return res.status(500).json({ success: false, message: 'Reminder run failed.' });
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

app.get('/api/admin/driver-profiles', authenticateAdmin, async (_req, res) => {
    if (!supabase) return res.status(503).json({ success: false, message: 'Database connection is not configured.' });
    try {
        const { data, error } = await supabase.from('driver_profiles').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return res.status(200).json({ success: true, profiles: data || [] });
    } catch (error) {
        console.error('Could not load driver profiles:', error.message);
        return res.status(500).json({ success: false, message: 'Driver profiles could not be loaded.' });
    }
});

app.post('/api/admin/driver-profiles', authenticateAdmin, async (req, res) => {
    const validation = normalizeDriverProfile(req.body);
    if (validation.error) return res.status(400).json({ success: false, message: validation.error });
    if (!supabase) return res.status(503).json({ success: false, message: 'Database connection is not configured.' });
    try {
        const { data, error } = await supabase.from('driver_profiles').insert(validation.profile).select('*').single();
        if (error) throw error;
        return res.status(201).json({ success: true, profile: data });
    } catch (error) {
        console.error('Could not create driver profile:', error.message);
        return res.status(500).json({ success: false, message: 'Driver profile could not be created.' });
    }
});

app.patch('/api/admin/driver-profiles/:id', authenticateAdmin, async (req, res) => {
    if (!isUuid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid driver profile ID.' });
    const validation = normalizeDriverProfile(req.body);
    if (validation.error) return res.status(400).json({ success: false, message: validation.error });
    if (!supabase) return res.status(503).json({ success: false, message: 'Database connection is not configured.' });
    try {
        const { data, error } = await supabase.from('driver_profiles').update({ ...validation.profile, updated_at: new Date().toISOString() })
            .eq('id', req.params.id).select('*').single();
        if (error) throw error;
        return res.status(200).json({ success: true, profile: data });
    } catch (error) {
        console.error('Could not update driver profile:', error.message);
        return res.status(500).json({ success: false, message: 'Driver profile could not be updated.' });
    }
});

app.get('/api/admin/chats', authenticateAdmin, async (req, res) => {
    if (!supabase) return res.status(503).json({ success: false, message: 'Database connection is not configured.' });
    try {
        const requestedOffset = Number(req.query.offset || 0);
        const offset = Number.isSafeInteger(requestedOffset) && requestedOffset >= 0 ? Math.min(requestedOffset, 100000) : 0;
        const conversations = await loadRecentChatSummaries(supabase, 100, offset);
        return res.status(200).json({ success: true, conversations, nextOffset: offset + conversations.length, hasMore: conversations.length === 100 });
    } catch (error) {
        console.error('Could not load chat inbox:', error.message);
        return res.status(500).json({ success: false, message: 'Chat inbox could not be loaded.' });
    }
});

app.get('/api/admin/chats/:id/messages', authenticateAdmin, async (req, res) => {
    if (!isUuid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid conversation ID.' });
    if (!supabase) return res.status(503).json({ success: false, message: 'Database connection is not configured.' });
    try {
        const { data: conversation, error: conversationError } = await supabase.from('chat_conversations')
            .select('id,conversation_type,driver_profile_id,visitor_name,visitor_email,status,created_at,last_message_at')
            .eq('id', req.params.id).maybeSingle();
        if (conversationError) throw conversationError;
        if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found.' });
        const { data: messages, error } = await supabase.from('chat_messages')
            .select('id,sender_role,body,created_at').eq('conversation_id', conversation.id)
            .order('created_at', { ascending: true }).limit(500);
        if (error) throw error;
        return res.status(200).json({ success: true, conversation, messages: messages || [] });
    } catch (error) {
        console.error('Could not load conversation:', error.message);
        return res.status(500).json({ success: false, message: 'Conversation could not be loaded.' });
    }
});

app.post('/api/admin/chats/:id/messages', authenticateAdmin, async (req, res) => {
    if (!isUuid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid conversation ID.' });
    const body = validateVisitorMessage(req.body?.body);
    if (!body) return res.status(400).json({ success: false, message: 'Write a message up to 2,000 characters.' });
    if (!supabase) return res.status(503).json({ success: false, message: 'Database connection is not configured.' });
    try {
        const { data: conversation, error: conversationError } = await supabase.from('chat_conversations')
            .select('id,status').eq('id', req.params.id).maybeSingle();
        if (conversationError) throw conversationError;
        if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found.' });
        if (conversation.status !== 'open') return res.status(409).json({ success: false, message: 'Reopen this conversation before replying.' });
        const { error: insertError } = await supabase.from('chat_messages').insert({ conversation_id: conversation.id, sender_role: 'admin', body });
        if (insertError) throw insertError;
        const { error: updateError } = await supabase.from('chat_conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversation.id);
        if (updateError) throw updateError;
        return res.status(201).json({ success: true });
    } catch (error) {
        console.error('Could not reply to chat conversation:', error.message);
        return res.status(500).json({ success: false, message: 'Your reply could not be sent.' });
    }
});

app.patch('/api/admin/chats/:id/status', authenticateAdmin, async (req, res) => {
    if (!isUuid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid conversation ID.' });
    const status = req.body?.status;
    if (!['open', 'closed'].includes(status)) return res.status(400).json({ success: false, message: 'Choose open or closed.' });
    if (!supabase) return res.status(503).json({ success: false, message: 'Database connection is not configured.' });
    try {
        const { error } = await supabase.from('chat_conversations').update({ status }).eq('id', req.params.id);
        if (error) throw error;
        return res.status(200).json({ success: true, status });
    } catch (error) {
        console.error('Could not update conversation status:', error.message);
        return res.status(500).json({ success: false, message: 'Conversation status could not be updated.' });
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
            chats: [],
            chatDataAvailable: false,
            stats: {
                total_bookings: 0,
                pending_bookings: 0,
                total_messages: 0,
                total_drivers: 0,
                total_chats: 0,
                page_views: 0,
                active_sessions: 1
            },
            success: true,
            dbConnected: false
        });
    }

    try {
        const [
            { data: bookings, error: bookingsError },
            { data: messages, error: messagesError },
            { data: drivers, error: driversError },
            { data: analytics, error: analyticsError },
        ] = await Promise.all([
            supabase.from('bookings').select('*').order('created_at', { ascending: false }),
            supabase.from('messages').select('*').order('created_at', { ascending: false }),
            supabase.from('drivers').select('*').order('created_at', { ascending: false }),
            supabase.from('analytics').select('*'),
        ]);

        if (bookingsError || messagesError || driversError) throw (bookingsError || messagesError || driversError);
        if (analyticsError) console.warn('Admin analytics are unavailable:', analyticsError.message);

        let chats = [];
        let totalChats = 0;
        let chatDataAvailable = true;
        try {
            chats = await loadRecentChatSummaries(supabase, 5);
            const { count, error: chatCountError } = await supabase.from('chat_conversations').select('id', { count: 'exact', head: true });
            if (chatCountError) throw chatCountError;
            totalChats = count || 0;
        } catch (chatError) {
            chatDataAvailable = false;
            console.warn('Admin chat activity is unavailable:', chatError.message);
        }

        const stats = {
            total_bookings: bookings?.length || 0,
            pending_bookings: bookings?.filter(b => b.status === 'Pending').length || 0,
            total_messages: messages?.length || 0,
            total_drivers: drivers?.length || 0,
            total_chats: totalChats || 0,
            page_views: analytics?.find(a => a.metric === 'page_views')?.value || 0,
            active_sessions: Math.floor(Math.random() * 5) + 1
        };

        res.status(200).json({ bookings: bookings || [], messages: messages || [], drivers: drivers || [], chats, chatDataAvailable, stats, success: true, dbConnected: true });
    } catch (error) {
        res.status(200).json({ 
            bookings: [], 
            messages: [], 
            drivers: [], 
            chats: [],
            stats: { total_bookings: 0, pending_bookings: 0, total_messages: 0, total_drivers: 0, total_chats: 0, page_views: 0, active_sessions: 1 },
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

app.delete('/api/admin/drivers/:id', authenticateAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid driver ID.' });
    }
    if (!supabase) {
        return res.status(503).json({ success: false, message: 'Database connection is not configured.' });
    }
    try {
        const { data: driver, error: readError } = await supabase.from('drivers').select('application_data').eq('id', id).single();
        if (readError) throw readError;
        const paths = Object.values(driver?.application_data?.documents || {}).map((document) => document?.path).filter((path) => typeof path === 'string');
        if (paths.length) {
            const { error: storageError } = await supabase.storage.from(BUCKET).remove(paths);
            if (storageError) throw storageError;
        }
        const { error } = await supabase.from('drivers').delete().eq('id', id);
        if (error) throw error;
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Failed to delete driver application:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete driver application.' });
    }
});

app.get('/api/admin/drivers/:id/documents', authenticateAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid driver ID.' });
    if (!supabase) return res.status(503).json({ success: false, message: 'Database connection is not configured.' });
    try {
        const { data: driver, error: driverError } = await supabase.from('drivers').select('application_data').eq('id', id).single();
        if (driverError) throw driverError;
        const docs = driver?.application_data?.documents || {};
        const paths = Object.values(docs).map((document) => document?.path).filter((path) => typeof path === 'string');
        if (!paths.length) return res.status(200).json({ success: true, documents: {} });
        const { data: signed, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 300);
        if (error) throw error;
        const signedByPath = new Map((signed || []).map((item) => [item.path, item.signedUrl]));
        const documents = Object.fromEntries(Object.entries(docs).map(([key, document]) => [key, {
            ...document,
            signedUrl: signedByPath.get(document.path) || null,
        }]));
        return res.status(200).json({ success: true, documents, expiresIn: 300 });
    } catch (error) {
        console.error('Could not sign driver documents:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to load private documents.' });
    }
});

app.patch('/api/admin/drivers/:id/status', authenticateAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const status = req.body?.status;
    if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid driver ID.' });
    if (!APPLICATION_STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Invalid application status.' });
    if (!supabase) return res.status(503).json({ success: false, message: 'Database connection is not configured.' });
    const { error } = await supabase.from('drivers').update({ application_status: status, status_updated_at: new Date().toISOString() }).eq('id', id);
    if (error) {
        console.error('Could not update driver application status:', error.message);
        return res.status(500).json({ success: false, message: 'Could not update application status.' });
    }
    return res.status(200).json({ success: true, status });
});

app.patch('/api/admin/drivers/:id/availability', authenticateAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const available = req.body?.available;
    const target = req.body?.target || 'driver';
    if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid driver ID.' });
    if (typeof available !== 'boolean') return res.status(400).json({ success: false, message: 'Availability must be true or false.' });
    if (!['driver', 'vehicle'].includes(target)) return res.status(400).json({ success: false, message: 'Invalid availability target.' });
    if (!supabase) return res.status(503).json({ success: false, message: 'Database connection is not configured.' });
    try {
        const historyColumn = target === 'vehicle' ? 'vehicle_availability_history' : 'availability_history';
        const statusColumn = target === 'vehicle' ? 'vehicle_availability_status' : 'availability_status';
        const updatedColumn = target === 'vehicle' ? 'vehicle_availability_updated_at' : 'availability_updated_at';
        const { data: driver, error: readError } = await supabase.from('drivers').select(historyColumn).eq('id', id).single();
        if (readError) throw readError;
        const previousHistory = driver[historyColumn] || [];
        const timestamp = new Date().toISOString();
        const history = [...previousHistory, { available, changedAt: timestamp }].slice(-50);
        const { error } = await supabase.from('drivers').update({
            [statusColumn]: available ? 'available' : 'unavailable',
            [updatedColumn]: timestamp,
            [historyColumn]: history,
        }).eq('id', id);
        if (error) throw error;
        return res.status(200).json({ success: true, target, available, changedAt: timestamp });
    } catch (error) {
        console.error('Could not update driver availability:', error.message);
        return res.status(500).json({ success: false, message: 'Could not update driver availability.' });
    }
});

app.post('/api/admin/drivers/:id/request-documents', authenticateAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const message = typeof req.body?.message === 'string' ? req.body.message.trim().slice(0, 1200) : '';
    if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid driver ID.' });
    if (message.length < 4) return res.status(400).json({ success: false, message: 'Add a short note describing the missing information.' });
    if (!supabase) return res.status(503).json({ success: false, message: 'Database connection is not configured.' });
    try {
        const { data: driver, error: readError } = await supabase.from('drivers').select('name,email,application_data').eq('id', id).single();
        if (readError) throw readError;
        const applicationData = driver.application_data || {};
        const previousRequests = applicationData.management?.documentRequests || [];
        const requestedAt = new Date().toISOString();
        const { error: updateError } = await supabase.from('drivers').update({
            application_status: 'Documents Pending',
            status_updated_at: requestedAt,
            application_data: { ...applicationData, management: { ...applicationData.management, documentRequests: [...previousRequests, { message, requestedAt }].slice(-50) } },
        }).eq('id', id);
        if (updateError) throw updateError;

        await transporter.sendMail({
            from: `US Executive Travel <${process.env.EMAIL_USER || 'hello@us-executivetravel.com'}>`,
            to: driver.email,
            subject: 'More information needed for your driver application',
            text: `Hello ${driver.name},\n\nOur management team needs a little more information before we can continue reviewing your driver application:\n\n${message}\n\nPlease reply to this email or contact hello@us-executivetravel.com. Do not email medical reports or Enhanced DBS certificates.\n\nUS Executive Travels`,
        });
        return res.status(200).json({ success: true, status: 'Documents Pending' });
    } catch (error) {
        console.error('Could not request driver documents:', error.message);
        return res.status(500).json({ success: false, message: 'Could not send the document request.' });
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
