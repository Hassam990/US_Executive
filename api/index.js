import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const app = express();

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Database initialization (Safe for Serverless)
let db;
const initDb = async () => {
    try {
        if (!db) {
            db = await open({
                filename: path.join(process.cwd(), 'us_executive.db'),
                driver: sqlite3.Database
            });
            await db.exec(`
                CREATE TABLE IF NOT EXISTS bookings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT, email TEXT, phone TEXT, pickup TEXT, dropoff TEXT,
                    date TEXT, time TEXT, returnDate TEXT, returnTime TEXT,
                    passengers TEXT, vehicleClass TEXT, status TEXT DEFAULT 'Pending',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT, email TEXT, phone TEXT, message TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS analytics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    metric TEXT UNIQUE, value INTEGER DEFAULT 0
                );
                INSERT OR IGNORE INTO analytics (metric, value) VALUES ('page_views', 0);
            `);
        }
    } catch (dbErr) {
        console.warn("Database initialization failed (Expected on Vercel):", dbErr.message);
    }
};

// Transporter setup with Gmail App Password
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'hello@us-executivetravel.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// Helper for dynamic recipient
const getReceiver = () => process.env.NODE_ENV === 'development' 
    ? process.env.TEST_EMAIL_RECEIVER 
    : (process.env.EMAIL_RECEIVER || 'hello@us-executivetravel.com');

// Analytics tracking endpoint
app.post('/api/track-visit', async (req, res) => {
    try {
        await initDb();
        if (db) await db.run(`UPDATE analytics SET value = value + 1 WHERE metric = 'page_views'`);
        res.status(200).json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

app.post('/api/book', async (req, res) => {
    try {
        await initDb();
        const {
            name, email, phone, isReturn, pickup, dropoff, date, time,
            returnDate, returnTime, passengers, vehicleClass
        } = req.body;

        // Save to Database (Safe fail)
        if (db) {
            await db.run(
                `INSERT INTO bookings (name, email, phone, pickup, dropoff, date, time, returnDate, returnTime, passengers, vehicleClass) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, email, phone, pickup, dropoff, date, time, isReturn ? returnDate : null, isReturn ? returnTime : null, passengers, vehicleClass]
            ).catch(e => console.error("DB write failed:", e.message));
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
            subject: `Request: ${isReturn ? 'Return' : 'One-Way'} Booking from ${name}`,
            text: mailBody
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (mailError) {
            console.error("Mail transport failed:", mailError.message);
        }

        res.status(200).json({ success: true, message: "Request processed." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Request failed." });
    }
});

app.post('/api/contact', async (req, res) => {
    try {
        await initDb();
        const { name, email, phone, message } = req.body;

        if (db) {
            await db.run(
                `INSERT INTO messages (name, email, phone, message) VALUES (?, ?, ?, ?)`,
                [name, email, phone, message]
            ).catch(e => console.error("DB write failed:", e.message));
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
            console.error("Mail transport failed:", mailError.message);
        }

        res.status(200).json({ success: true, message: "Message processed." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Message failed." });
    }
});

export default app;
