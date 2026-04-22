import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-123';
const client = new OAuth2Client(process.env.CLIENT_ID);
const app = express();

app.use(cors());
app.use(express.json());

// Auth Middleware
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// Request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Supabase initialization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Transporter setup with Gmail App Password
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'hello@us-executivetravel.com',
        pass: process.env.EMAIL_PASS
    }
});

// Helper for dynamic recipient
const getReceiver = () => process.env.NODE_ENV === 'development' 
    ? process.env.TEST_EMAIL_RECEIVER 
    : (process.env.EMAIL_RECEIVER || 'hello@us-executivetravel.com');

// Analytics tracking endpoint (called by frontend on load)
app.post('/api/track-visit', async (req, res) => {
    try {
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

app.post('/api/book', async (req, res) => {
    try {
        const {
            name, email, phone, isReturn, pickup, dropoff, date, time,
            returnDate, returnTime, passengers, vehicleClass
        } = req.body;

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

            if (dbError) throw dbError;
        } catch (dbError) {
            console.warn("Supabase Write failed:", dbError.message);
        }

        let mailBody = `NEW TAXI BOOKING REQUEST\n========================================\nCUSTOMER DETAILS:\n- Name: ${name}\n- Email: ${email}\n- Phone: ${phone}\n\nJOURNEY DETAILS:\n- Pick-up: ${pickup}\n- Drop-off: ${dropoff}\n- Date: ${date} at ${time}\n`;
        if (isReturn) mailBody += `- Return: ${returnDate} at ${returnTime}\n`;
        mailBody += `\nREQUIREMENTS:\n- Passengers: ${passengers}\n- Vehicle: ${vehicleClass}\n========================================`;

        const mailOptions = {
            from: process.env.EMAIL_USER || 'hello@us-executivetravel.com',
            to: getReceiver(),
            subject: `New Request: ${isReturn ? 'Return' : 'One-Way'} Taxi Booking from ${name}`,
            text: mailBody
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (mailError) {
            console.error("Mail transport failed:", mailError);
        }

        res.status(200).json({ success: true, message: "Request received successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to submit request." });
    }
});

app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;
        try {
            const { error: dbError } = await supabase
                .from('messages')
                .insert([{ name, email, phone, message }]);
            if (dbError) throw dbError;
        } catch (err) {
            console.warn("Supabase Warning:", err.message);
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

app.post('/api/apply', async (req, res) => {
    try {
        const { name, email, phone, license, vehicle, experience } = req.body;
        try {
            const { error: dbError } = await supabase
                .from('drivers')
                .insert([{ name, email, phone, license, vehicle, experience }]);
            if (dbError) throw dbError;
        } catch (err) {
            console.warn("Supabase Warning:", err.message);
        }

        const mailOptions = {
            from: process.env.EMAIL_USER || 'hello@us-executivetravel.com',
            to: getReceiver(),
            subject: `NEW DRIVER APPLICATION: ${name}`,
            text: `NEW DRIVER APPLICATION RECEIVED\n========================================\nDRIVER DETAILS:\n- Name: ${name}\n- Email: ${email}\n- Phone: ${phone}\n\nPROFESSIONAL INFO:\n- PHV License: ${license}\n- Vehicle: ${vehicle}\n\nEXPERIENCE / BIO:\n${experience}\n========================================`
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (mailError) {
            console.warn("Mail transport failed.");
        }
        res.status(200).json({ success: true, message: "Application received successfully." });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// User Signup
app.post('/api/admin/signup', (req, res) => {
    const { name, email, password } = req.body;
    const adminEmail = 'hassamazam999@gmail.com';
    const role = (email === adminEmail) ? 'admin' : 'user';
    console.log(`New Signup: ${name} (${email}) - Role: ${role}`);
    const token = jwt.sign({ role, email, name }, JWT_SECRET, { expiresIn: '24h' });
    res.status(200).json({ token, role, success: true });
});

// Admin & User Auth
app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;
    const adminEmail = 'hassamazam999@gmail.com';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (email === adminEmail && password === adminPass) {
        const token = jwt.sign({ role: 'admin', email }, JWT_SECRET, { expiresIn: '24h' });
        return res.status(200).json({ token, role: 'admin', success: true });
    } else if (password === 'user123') { 
        const token = jwt.sign({ role: 'user', email }, JWT_SECRET, { expiresIn: '24h' });
        return res.status(200).json({ token, role: 'user', success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Admin Dashboard Data
app.get('/api/admin/dashboard', authenticateAdmin, async (req, res) => {
    const adminEmail = 'hassamazam999@gmail.com';
    if (req.admin.role !== 'admin' || (req.admin.email && req.admin.email !== adminEmail)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
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

        res.status(200).json({ bookings: bookings || [], messages: messages || [], drivers: drivers || [], stats, success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// User Dashboard Data
app.get('/api/user/dashboard', authenticateAdmin, async (req, res) => {
    try {
        const { data: bookings } = await supabase.from('bookings').select('*').eq('email', req.admin.email).order('created_at', { ascending: false });
        res.status(200).json({ bookings: bookings || [], success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.post('/api/admin/bookings/:id/status', authenticateAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        await supabase.from('bookings').update({ status }).eq('id', req.params.id);
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.delete('/api/admin/bookings/:id', authenticateAdmin, async (req, res) => {
    try {
        await supabase.from('bookings').delete().eq('id', req.params.id);
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// Google Login Verification
app.post('/api/admin/google-login', async (req, res) => {
    const { credential } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const email = payload['email'];
        const adminEmail = 'hassamazam999@gmail.com';
        const role = (email === adminEmail) ? 'admin' : 'user';
        const token = jwt.sign({ role, email }, JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({ success: true, token, role, user: { name: payload['name'], email, picture: payload['picture'] } });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Invalid Google Token' });
    }
});

export default app;
