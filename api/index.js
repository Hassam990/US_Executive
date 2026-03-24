import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Diagnostic endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        msg: 'Serverless backend is alive!',
        env_keys: Object.keys(process.env), // Added to see if keys are present
        env_values: {
            NODE_ENV: process.env.NODE_ENV,
            HAS_EMAIL_USER: !!process.env.EMAIL_USER,
            HAS_EMAIL_PASS: !!process.env.EMAIL_PASS,
        }
    });
});

// Helper for dynamic recipient
const getReceiver = () => process.env.NODE_ENV === 'development' 
    ? process.env.TEST_EMAIL_RECEIVER 
    : (process.env.EMAIL_RECEIVER || 'hello@us-executivetravel.com');

app.post('/api/book', async (req, res) => {
    try {
        console.log("Processing Booking Request...");
        const {
            name, email, phone, isReturn, pickup, dropoff, date, time,
            returnDate, returnTime, passengers, vehicleClass
        } = req.body;

        const mailOptions = {
            from: process.env.EMAIL_USER || 'hello@us-executivetravel.com',
            to: getReceiver(),
            subject: `Request: ${isReturn ? 'Return' : 'One-Way'} Booking from ${name}`,
            text: `
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
${isReturn ? `- Return: ${returnDate} at ${returnTime}` : ''}

REQUIREMENTS:
- Passengers: ${passengers}
- Vehicle: ${vehicleClass}
========================================
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
        console.log("Email sent successfully!");
        res.status(200).json({ success: true, message: "Request received via email." });
    } catch (error) {
        console.error("Booking Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/contact', async (req, res) => {
    try {
        console.log("Processing Contact Message...");
        const { name, email, phone, message } = req.body;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: getReceiver(),
            subject: `New Message from ${name}`,
            text: `
NEW CONTACT MESSAGE
========================================
CUSTOMER DETAILS:
- Name: ${name}
- Email: ${email}
- Phone: ${phone}

MESSAGE:
${message}
========================================
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
        console.log("Contact Email sent successfully!");
        res.status(200).json({ success: true, message: "Message received via email." });
    } catch (error) {
        console.error("Contact Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default app;
