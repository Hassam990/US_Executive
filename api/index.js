import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.CLIENT_ID);
const app = express();

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Database initialization
let db;

// Transporter setup with Gmail App Password
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'hello@us-executivetravel.com',
        pass: process.env.EMAIL_PASS
    }
});

// Diagnostic endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        msg: 'Serverless backend is alive!',
        env: {
            NODE_ENV: process.env.NODE_ENV,
            VERCEL: process.env.VERCEL,
            HAS_EMAIL_USER: !!process.env.EMAIL_USER,
            HAS_EMAIL_PASS: !!process.env.EMAIL_PASS,
        }
    });
});

// Helper for dynamic recipient
const getReceiver = () => process.env.NODE_ENV === 'development' 
    ? process.env.TEST_EMAIL_RECEIVER 
    : (process.env.EMAIL_RECEIVER || 'hello@us-executivetravel.com');

// Analytics tracking endpoint (called by frontend on load)
app.post('/api/track-visit', async (req, res) => {
    try {
        if (db) {
            await db.run(`UPDATE analytics SET value = value + 1 WHERE metric = 'page_views'`);
        }
        res.status(200).json({ success: true });
    } catch (e) {
        console.warn("Analytics error / Read-Only DB:", e.message);
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
            if (db) {
                await db.run(
                    `INSERT INTO bookings (name, email, phone, pickup, dropoff, date, time, returnDate, returnTime, passengers, vehicleClass) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [name, email, phone, pickup, dropoff, date, time, isReturn ? returnDate : null, isReturn ? returnTime : null, passengers, vehicleClass]
                );
            }
        } catch (dbError) {
            console.warn("DB Write failed (Read-only on Vercel), continuing to email:", dbError.message);
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

        const mailOptions = {
            from: process.env.EMAIL_USER || 'hello@us-executivetravel.com',
            to: getReceiver(),
            subject: `New Request: ${isReturn ? 'Return' : 'One-Way'} Taxi Booking from ${name}`,
            text: mailBody
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log("Email sent successfully!");
        } catch (mailError) {
            console.error("Mail transport failed:", mailError);
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

        try {
            if (db) {
                await db.run(
                    `INSERT INTO messages (name, email, phone, message) VALUES (?, ?, ?, ?)`,
                    [name, email, phone, message]
                );
            }
        } catch (dbError) {
            console.warn("Skipping DB write:", dbError.message);
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

        const mailOptions = {
            from: process.env.EMAIL_USER || 'hello@us-executivetravel.com',
            to: getReceiver(),
            subject: `New Message from ${name}`,
            text: mailBody
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (mailError) {
            console.error("Mail transport failed:", mailError);
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

        try {
            if (db) {
                await db.run(
                    `INSERT INTO drivers (name, email, phone, license, vehicle, experience) VALUES (?, ?, ?, ?, ?, ?)`,
                    [name, email, phone, license, vehicle, experience]
                );
            }
        } catch (dbError) {
            console.warn("Skipping DB write:", dbError.message);
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

        const mailOptions = {
            from: process.env.EMAIL_USER || 'hello@us-executivetravel.com',
            to: getReceiver(),
            subject: `NEW DRIVER APPLICATION: ${name}`,
            text: mailBody
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (mailError) {
            console.error("Mail transport failed:", mailError);
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
        let bookings = [];
        let analytics = [];

        if (db) {
            bookings = await db.all(`SELECT * FROM bookings ORDER BY created_at DESC`);
            analytics = await db.all(`SELECT * FROM analytics`);
        }

        const stats = {
            total_bookings: bookings.length,
            pending_bookings: bookings.filter(b => b.status === 'Pending').length,
            page_views: analytics.find(a => a.metric === 'page_views')?.value || 0,
            active_sessions: Math.floor(Math.random() * 5) + 1 // Mock live active sessions for UI polish
        };

        res.status(200).json({ bookings, stats, success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
});

app.post('/api/admin/bookings/:id/complete', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer mock-jwt-token-123') {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        if (db) {
            await db.run(`UPDATE bookings SET status = 'Completed' WHERE id = ?`, [req.params.id]);
        }
        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
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

        const authorizedEmail = process.env.EMAIL_USER || 'hello@us-executivetravel.com';
        if (email === authorizedEmail) {
            res.status(200).json({ 
                success: true, 
                token: 'mock-jwt-token-123',
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

// Database setup
(async () => {
    try {
        // On Vercel, the filesystem is read-only. We open an in-memory DB or gracefully fail.
        const isVercel = !!process.env.VERCEL;
        db = await open({
            filename: isVercel ? ':memory:' : 'us_executive.db',
            driver: sqlite3.Database
        });

        await db.exec(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                email TEXT,
                phone TEXT,
                pickup TEXT,
                dropoff TEXT,
                date TEXT,
                time TEXT,
                returnDate TEXT,
                returnTime TEXT,
                passengers TEXT,
                vehicleClass TEXT,
                status TEXT DEFAULT 'Pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                email TEXT,
                phone TEXT,
                message TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS drivers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                email TEXT,
                phone TEXT,
                license TEXT,
                vehicle TEXT,
                experience TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS analytics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                metric TEXT UNIQUE,
                value INTEGER DEFAULT 0
            );
            INSERT OR IGNORE INTO analytics (metric, value) VALUES ('page_views', 0);
        `);
        console.log("Database initialized successfully.", isVercel ? "(In-Memory Mode)" : "(File Mode)");
    } catch (err) {
        console.error("Failed to initialize database:", err.message);
    }
})();

export default app;
