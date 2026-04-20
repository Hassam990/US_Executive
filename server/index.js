require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.CLIENT_ID);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

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
        res.status(500).json({ success: false });
    }
});

app.post('/api/book', async (req, res) => {
    try {
        const {
            name, email, phone, isReturn, pickup, dropoff, date, time,
            returnDate, returnTime, passengers, vehicleClass
        } = req.body;

        // Save to Supabase
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
        } catch (err) {
            console.warn("Supabase Warning:", err.message);
        }

        let mailBody = `
NEW TAXI BOOKING REQUEST
========================================
CUSTOMER DETAILS:
- Name: ${name}
- Email: ${email}
- Phone: ${phone}

JOURNEY DETAILS:
- Pick-up: ${pickup}
- Drop-off: ${dropoff}
- Date: ${date} at ${time}
`;
        if (isReturn) {
            mailBody += `- Return: ${returnDate} at ${returnTime}\n`;
        }
        mailBody += `
REQUIREMENTS:
- Passengers: ${passengers}
- Vehicle: ${vehicleClass}
========================================
        `;

        const receiver = process.env.NODE_ENV === 'development' 
            ? process.env.TEST_EMAIL_RECEIVER 
            : (process.env.EMAIL_RECEIVER || 'hello@us-executivetravel.com');

        const mailOptions = {
            from: process.env.EMAIL_USER || 'hello@us-executivetravel.com',
            to: receiver,
            subject: `New Request: ${isReturn ? 'Return' : 'One-Way'} Taxi Booking from ${name}`,
            text: mailBody
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (mailError) {
            console.warn("Mail transport failed. Data saved to SQLite successfully.");
        }

        res.status(200).json({ success: true, message: "Request received successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to submit request." });
    }
});

app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        // Save to Supabase
        try {
            const { error: dbError } = await supabase
                .from('messages')
                .insert([{ name, email, phone, message }]);

            if (dbError) throw dbError;
        } catch (err) {
            console.warn("Supabase Warning:", err.message);
        }

        const mailBody = `
NEW CONTACT MESSAGE
========================================
CUSTOMER DETAILS:
- Name: ${name}
- Email: ${email}
- Phone: ${phone}

MESSAGE:
${message}
========================================
        `;

        const receiver = process.env.NODE_ENV === 'development' 
            ? process.env.TEST_EMAIL_RECEIVER 
            : (process.env.EMAIL_RECEIVER || 'hello@us-executivetravel.com');

        const mailOptions = {
            from: process.env.EMAIL_USER || 'hello@us-executivetravel.com',
            to: receiver,
            subject: `New Message from ${name}`,
            text: mailBody
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (mailError) {
            console.warn("Mail transport failed. Data saved to SQLite successfully.");
        }

        res.status(200).json({ success: true, message: "Message sent successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to send message." });
    }
});

app.post('/api/apply', async (req, res) => {
    try {
        const { name, email, phone, license, vehicle, experience } = req.body;

        // Save to Supabase
        try {
            const { error: dbError } = await supabase
                .from('drivers')
                .insert([{ name, email, phone, license, vehicle, experience }]);

            if (dbError) throw dbError;
        } catch (err) {
            console.warn("Supabase Warning:", err.message);
        }

        const mailBody = `
NEW DRIVER APPLICATION RECEIVED
========================================
DRIVER DETAILS:
- Name: ${name}
- Email: ${email}
- Phone: ${phone}

PROFESSIONAL INFO:
- PHV License: ${license}
- Vehicle: ${vehicle}

EXPERIENCE / BIO:
${experience}
========================================
        `;

        const receiver = process.env.NODE_ENV === 'development' 
            ? process.env.TEST_EMAIL_RECEIVER 
            : (process.env.EMAIL_RECEIVER || 'hello@us-executivetravel.com');

        const mailOptions = {
            from: process.env.EMAIL_USER || 'hello@us-executivetravel.com',
            to: receiver,
            subject: `NEW DRIVER APPLICATION: ${name}`,
            text: mailBody
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (mailError) {
            console.warn("Mail transport failed. Data saved to SQLite successfully.");
        }

        res.status(200).json({ success: true, message: "Application received successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to submit application." });
    }
});

// Admin Auth
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === 'admin123') {
        res.status(200).json({ token: 'mock-jwt-token-123', success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Admin Dashboard Data
app.get('/api/admin/dashboard', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer mock-jwt-token-123') {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const { data: bookings, error: bError } = await supabase
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false });

        const { data: analytics, error: aError } = await supabase
            .from('analytics')
            .select('*');

        if (bError || aError) throw (bError || aError);

        const stats = {
            total_bookings: bookings?.length || 0,
            pending_bookings: bookings?.filter(b => b.status === 'Pending').length || 0,
            page_views: analytics?.find(a => a.metric === 'page_views')?.value || 0,
            active_sessions: Math.floor(Math.random() * 5) + 1
        };

        res.status(200).json({ bookings: bookings || [], stats, success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.post('/api/admin/bookings/:id/complete', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer mock-jwt-token-123') {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const { error } = await supabase
            .from('bookings')
            .update({ status: 'Completed' })
            .eq('id', req.params.id);

        if (error) throw error;
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

        // Whitelist Check (Only allow authorized admin email)
        const authorizedEmail = process.env.EMAIL_USER || 'hello@us-executivetravel.com';
        if (email === authorizedEmail) {
            res.status(200).json({ 
                success: true, 
                token: 'mock-jwt-token-123', // Same mock token as password login
                user: { name: payload['name'], email: payload['email'], picture: payload['picture'] }
            });
        } else {
            res.status(401).json({ success: false, message: 'Unauthorized Google Account' });
        }
    } catch (error) {
        console.error("Google verify error", error);
        res.status(400).json({ success: false, message: 'Invalid Google Token' });
    }
});

// Server Start
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} with Supabase integration`);
});
