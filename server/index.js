require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database setup
let db;
(async () => {
    db = await open({
        filename: 'us_executive.db',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        CREATE TABLE IF NOT EXISTS analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            metric TEXT UNIQUE,
            value INTEGER DEFAULT 0
        );
        INSERT OR IGNORE INTO analytics (metric, value) VALUES ('page_views', 0);
    `);
})();

// Transporter setup
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
        await db.run(`UPDATE analytics SET value = value + 1 WHERE metric = 'page_views'`);
        res.status(200).json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

app.post('/api/book', async (req, res) => {
    try {
        const {
            isReturn, pickup, dropoff, date, time,
            returnDate, returnTime, passengers, vehicleClass
        } = req.body;

        // Save to Database
        await db.run(
            `INSERT INTO bookings (pickup, dropoff, date, time, returnDate, returnTime, passengers, vehicleClass) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [pickup, dropoff, date, time, isReturn ? returnDate : null, isReturn ? returnTime : null, passengers, vehicleClass]
        );

        let mailBody = `
NEW TAXI BOOKING REQUEST
========================================
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
            to: process.env.EMAIL_USER || 'hello@us-executivetravel.com',
            subject: `New Request: ${isReturn ? 'Return' : 'One-Way'} Taxi Booking`,
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
        const bookings = await db.all(`SELECT * FROM bookings ORDER BY created_at DESC`);
        const analytics = await db.all(`SELECT * FROM analytics`);

        const stats = {
            total_bookings: bookings.length,
            pending_bookings: bookings.filter(b => b.status === 'Pending').length,
            page_views: analytics.find(a => a.metric === 'page_views')?.value || 0,
            active_sessions: Math.floor(Math.random() * 5) + 1 // Mock live active sessions for UI polish
        };

        res.status(200).json({ bookings, stats, success: true });
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
        await db.run(`UPDATE bookings SET status = 'Completed' WHERE id = ?`, [req.params.id]);
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
