require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const nodemailer = require('nodemailer');

const EMAIL = process.env.EMAIL_USER || 'hello@us-executivetravel.com';
const PASS  = process.env.EMAIL_PASS;

console.log('Testing SMTP for:', EMAIL);
console.log('Password loaded:', PASS ? '✅ YES (' + PASS.length + ' chars)' : '❌ NOT FOUND');
console.log('');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ionos.co.uk',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: { user: EMAIL, pass: PASS },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000
});

transporter.verify((err, ok) => {
    if (err) {
        console.log('❌ SMTP VERIFY FAILED:', err.message);
        console.log('');
        console.log('Fix: Log into https://www.ionos.co.uk → Email → Email Accounts');
        console.log('Find hello@us-executivetravel.com → Reset/view SMTP password');
        console.log('Then update EMAIL_PASS in your .env file and Vercel env vars.');
        process.exit(1);
    }

    console.log('✅ SMTP CONNECTION OK! Sending test email...');

    transporter.sendMail({
        from: `"US Executive Travel" <${EMAIL}>`,
        to: EMAIL,
        subject: '✅ TEST EMAIL — SMTP Working',
        text: 'This is a test email from the US Executive Travel website backend.\n\nSMTP is configured correctly and emails are being delivered.',
        html: `<div style="font-family:sans-serif;padding:24px;background:#0a0005;color:#fff;border-radius:12px;">
            <h2 style="color:#ec4899;">✅ SMTP Test Successful</h2>
            <p>Your email is connected and working.</p>
            <p><strong>From:</strong> ${EMAIL}</p>
            <p><strong>Server:</strong> ${process.env.SMTP_HOST || 'smtp.ionos.co.uk'}</p>
            <p style="color:#aaa;font-size:12px;">Sent from US Executive Travel backend test script.</p>
        </div>`
    }, (err2, info) => {
        if (err2) {
            console.log('❌ SEND FAILED:', err2.message);
            process.exit(1);
        }
        console.log('');
        console.log('✅ EMAIL SENT SUCCESSFULLY!');
        console.log('   Message ID:', info.messageId);
        console.log('   Check inbox at hello@us-executivetravel.com');
    });
});
