import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { open } from 'sqlite';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const app = express();

app.use(cors());
app.use(express.json());

// Load sqlite3 safely
let sqlite3;
try {
    sqlite3 = require('sqlite3');
} catch (e) {
    console.error("Sqlite3 failed to load in this environment:", e.message);
}

// Request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Database initialization (Safe for Serverless)
let db;
const initDb = async () => {
    if (!sqlite3) return; // Skip if sqlite3 failed to load
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
                    passengers TEXT, vehicleClass TEXT, status TEXT DEFAULT 'Pending'
                );
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT, email TEXT, phone TEXT, message TEXT
                );
            `);
        }
    } catch (dbErr) {
        console.warn("Database initialization failed (Expected on Vercel):", dbErr.message);
    }
};

// Help endpoint for diagnostics
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        env: {
            NODE_ENV: process.env.NODE_ENV,
            HAS_EMAIL_USER: !!process.env.EMAIL_USER,
            HAS_EMAIL_PASS: !!process.env.EMAIL_PASS,
        },
        db: !!sqlite3 ? 'available' : 'unavailable'
    });
});

// Helper for dynamic recipient
const getReceiver = () => process.env.NODE_ENV === 'development' 
    ? process.env.TEST_EMAIL_RECEIVER 
    : (process.env.EMAIL_RECEIVER || 'hello@us-executivetravel.com');

app.post('/api/book', async (req, res) => {
    try {
        await initDb();
        const {
            name, email, phone, isReturn, pickup, dropoff, date, time,
            returnDate, returnTime, passengers, vehicleClass
        } = req.body;

        // Save to Database (Non-blocking)
        if (db) {
            db.run(
                `INSERT INTO bookings (name, email, phone, pickup, dropoff, date, time, returnDate, returnTime, passengers, vehicleClass) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, email, phone, pickup, dropoff, date, time, isReturn ? returnDate : null, isReturn ? returnTime : null, passengers, vehicleClass]
            ).catch(e => console.error("DB write failed:", e.message));
        }

        const mailOptions = {
            from: process.env.EMAIL_USER || 'hello@us-executivetravel.com',
            to: getReceiver(),
            subject: `Taxi Booking Request from ${name}`,
            text: `
NEW TAXI BOOKING REQUEST
=========================
Customer: ${name}
Email: ${email}
Phone: ${phone}

Pickup: ${pickup}
Drop-off: ${dropoff}
Date: ${date} at ${time}
${isReturn ? `Return: ${returnDate} at ${returnTime}` : ''}

Passengers: ${passengers}
Vehicle: ${vehicleClass}
=========================
            `
        };

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: "Request received." });
    } catch (error) {
        console.error("Booking Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/contact', async (req, res) => {
    try {
        await initDb();
        const { name, email, phone, message } = req.body;

        if (db) {
            db.run(
                `INSERT INTO messages (name, email, phone, message) VALUES (?, ?, ?, ?)`,
                [name, email, phone, message]
            ).catch(e => console.error("DB write failed:", e.message));
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: getReceiver(),
            subject: `Contact message from ${name}`,
            text: `New Message:\n${message}\n\nFrom: ${name} (${email}, ${phone})`
        };

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Contact Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default app;
