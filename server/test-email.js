require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const receiver = process.env.NODE_ENV === 'development' 
    ? process.env.TEST_EMAIL_RECEIVER 
    : process.env.EMAIL_RECEIVER;

const mailOptions = {
    from: process.env.EMAIL_USER,
    to: receiver,
    subject: 'SMTP Test Email',
    text: `Hello! This is a test email to verify your Google SMTP setup.
    
Status: Connection Successful!
Environment: ${process.env.NODE_ENV}
Target: ${receiver}
`
};

console.log(`Sending test email to ${receiver}...`);
transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error('Error sending email:', error.message);
        if (error.message.includes('Invalid login')) {
            console.log('\nTIP: Make sure you use a 16-character Google App Password, not your regular password.');
            console.log('Also ensure 2-Step Verification is enabled.');
        }
    } else {
        console.log('Email sent successfully!');
        console.log('Response:', info.response);
    }
});
