/**
 * US Executive Travel — Branded HTML Email Templates
 * Theme: Black / Deep Burgundy + Rose Gold (#c9a0a0 / #ec4899)
 * Tagline: Driven by Excellence — Defined by Class
 */

// ─── Shared Layout ────────────────────────────────────────────────────────────

const LOGO_URL = 'https://us-executivetravel.com/us_executive_logo.png';
const BRAND_PINK = '#d4728a';
const BRAND_GOLD = '#c9a0a0';
const BG_DARK = '#0d0005';
const BG_CARD = '#1a000d';
const BORDER = '#3a0020';

function baseLayout(preheader, content) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>US Executive Travel</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0d0005;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <!-- Preheader (hidden preview text) -->
  <div style="display:none;font-size:1px;color:#0d0005;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}&nbsp;</div>

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0d0005;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Email Container -->
        <table width="620" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;width:100%;">

          <!-- ── HEADER ── -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a000d 0%,#0d0005 60%,#1a0010 100%);border-radius:20px 20px 0 0;border:1px solid #3a0020;border-bottom:none;padding:40px 40px 30px;text-align:center;">
              <!-- Decorative top line -->
              <div style="height:3px;background:linear-gradient(90deg,transparent,${BRAND_PINK},${BRAND_GOLD},${BRAND_PINK},transparent);border-radius:2px;margin-bottom:32px;"></div>
              <!-- Logo -->
              <img src="${LOGO_URL}" alt="US Executive Travel" width="240" style="display:block;margin:0 auto 20px;max-width:240px;"/>
              <!-- Tagline -->
              <p style="margin:0;font-size:10px;letter-spacing:0.25em;color:${BRAND_GOLD};text-transform:uppercase;font-weight:500;">Driven by Excellence &mdash; Defined by Class</p>
            </td>
          </tr>

          <!-- ── BODY ── -->
          <tr>
            <td style="background-color:#12000a;border-left:1px solid #3a0020;border-right:1px solid #3a0020;padding:0 40px 40px;">
              ${content}
            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a000d,#0d0005);border-radius:0 0 20px 20px;border:1px solid #3a0020;border-top:none;padding:32px 40px;text-align:center;">
              <!-- Divider -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,#3a0020,transparent);margin-bottom:24px;"></div>
              <!-- Contact row -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <a href="tel:07412671467" style="display:inline-block;color:${BRAND_GOLD};text-decoration:none;font-size:13px;font-weight:600;letter-spacing:0.05em;">&#9990; 07412671467</a>
                    &nbsp;&nbsp;
                    <span style="color:#3a0020;">|</span>
                    &nbsp;&nbsp;
                    <a href="mailto:hello@us-executivetravel.com" style="display:inline-block;color:${BRAND_GOLD};text-decoration:none;font-size:13px;font-weight:600;letter-spacing:0.05em;">&#9993; hello@us-executivetravel.com</a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="https://us-executivetravel.com" style="color:${BRAND_PINK};font-size:12px;text-decoration:none;font-weight:600;letter-spacing:0.1em;">us-executivetravel.com</a>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0;font-size:11px;color:#5a2030;line-height:1.6;">
                &copy; ${new Date().getFullYear()} US Executive Travel. All rights reserved.<br/>
                Licensed Private Hire &bull; Operating Across the UK
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Shared Components ────────────────────────────────────────────────────────

function sectionTitle(text) {
    return `
    <tr>
      <td style="padding:32px 0 16px;">
        <p style="margin:0;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND_PINK};font-weight:700;">${text}</p>
        <div style="height:1px;background:linear-gradient(90deg,${BRAND_PINK}44,transparent);margin-top:8px;"></div>
      </td>
    </tr>`;
}

function infoRow(label, value) {
    if (!value) return '';
    return `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #2a0018;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="38%" style="font-size:11px;color:#8a4060;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;vertical-align:top;padding-right:12px;">${label}</td>
            <td style="font-size:14px;color:#f0d0dc;font-weight:500;vertical-align:top;">${value}</td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function infoCard(rows) {
    return `
    <tr>
      <td style="background-color:#1a000d;border:1px solid #3a0020;border-radius:12px;padding:8px 20px 4px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          ${rows}
        </table>
      </td>
    </tr>`;
}

function badge(text) {
    return `<span style="display:inline-block;background:linear-gradient(135deg,${BRAND_PINK},#a0204a);color:#fff;font-size:10px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;padding:4px 12px;border-radius:20px;">${text}</span>`;
}

function alertBanner(emoji, text) {
    return `
    <tr>
      <td style="padding-top:32px;">
        <div style="background:linear-gradient(135deg,#2a0018,#1a000d);border:1px solid ${BRAND_PINK}55;border-radius:12px;padding:20px 24px;text-align:center;">
          <p style="margin:0;font-size:26px;line-height:1;">${emoji}</p>
          <p style="margin:8px 0 0;font-size:18px;font-weight:800;color:#fff;letter-spacing:-0.02em;">${text}</p>
        </div>
      </td>
    </tr>`;
}

function ctaButton(text, url) {
    return `
    <tr>
      <td style="padding:28px 0 0;text-align:center;">
        <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,${BRAND_PINK},#a0204a);color:#fff;font-size:13px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;padding:16px 40px;border-radius:50px;text-decoration:none;box-shadow:0 8px 24px rgba(212,114,138,0.35);">${text}</a>
      </td>
    </tr>`;
}

// ─── 1. BOOKING — Admin Notification ─────────────────────────────────────────

function bookingAdminEmail({ name, email, phone, pickup, dropoff, date, time, returnDate, returnTime, passengers, vehicleClass, notes, isReturn }) {
    const content = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${alertBanner('🚗', 'New Booking Request')}
      ${sectionTitle('Customer Details')}
      ${infoCard(`
        ${infoRow('Name', name)}
        ${infoRow('Email', email)}
        ${infoRow('Phone', `<a href="tel:${phone}" style="color:${BRAND_PINK};text-decoration:none;">${phone}</a>`)}
      `)}
      ${sectionTitle('Journey Details')}
      ${infoCard(`
        ${infoRow('Pick-up', pickup)}
        ${infoRow('Drop-off', dropoff)}
        ${infoRow('Date', date)}
        ${infoRow('Time', time)}
        ${isReturn ? infoRow('Return Date', returnDate) : ''}
        ${isReturn ? infoRow('Return Time', returnTime) : ''}
      `)}
      ${sectionTitle('Requirements')}
      ${infoCard(`
        ${infoRow('Passengers', passengers)}
        ${infoRow('Vehicle Class', vehicleClass)}
        ${notes ? infoRow('Notes', notes) : ''}
      `)}
      ${ctaButton('View in Dashboard', 'https://us-executivetravel.com/admin')}
      <tr><td style="padding-top:24px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#5a2030;">Reply to this email to contact the customer directly.</p>
      </td></tr>
    </table>`;

    return baseLayout(`New ${isReturn ? 'Return' : 'One-Way'} booking from ${name}`, content);
}

// ─── 2. BOOKING — Customer Confirmation ──────────────────────────────────────

function bookingConfirmationEmail({ name, pickup, dropoff, date, time, returnDate, returnTime, passengers, vehicleClass, isReturn }) {
    const content = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${alertBanner('✅', 'Booking Request Received')}
      <tr>
        <td style="padding:24px 0 0;text-align:center;">
          <p style="margin:0;font-size:16px;color:#e0b0c0;line-height:1.7;">Thank you, <strong style="color:#fff;">${name}</strong>.<br/>
          Your booking request has been received. Our team will confirm your chauffeur shortly.</p>
        </td>
      </tr>
      ${sectionTitle('Your Booking Summary')}
      ${infoCard(`
        ${infoRow('Pick-up', pickup)}
        ${infoRow('Drop-off', dropoff)}
        ${infoRow('Date', date)}
        ${infoRow('Time', time)}
        ${isReturn ? infoRow('Return Date', returnDate) : ''}
        ${isReturn ? infoRow('Return Time', returnTime) : ''}
        ${infoRow('Passengers', passengers)}
        ${infoRow('Vehicle', vehicleClass)}
      `)}
      <tr>
        <td style="padding:28px 0 0;">
          <div style="background:linear-gradient(135deg,#1a000d,#0d0005);border:1px solid #3a0020;border-radius:12px;padding:20px 24px;">
            <p style="margin:0 0 8px;font-size:11px;color:${BRAND_GOLD};text-transform:uppercase;letter-spacing:0.15em;font-weight:700;">Need to make changes?</p>
            <p style="margin:0;font-size:13px;color:#c0a0b0;line-height:1.7;">
              Call us any time on <a href="tel:07412671467" style="color:${BRAND_PINK};text-decoration:none;font-weight:700;">07412671467</a>
              or reply to this email and our team will assist you immediately.
            </p>
          </div>
        </td>
      </tr>
      ${ctaButton('Book Another Journey', 'https://us-executivetravel.com/book')}
    </table>`;

    return baseLayout(`Your booking is confirmed — US Executive Travel`, content);
}

// ─── 3. CONTACT — Admin Notification ─────────────────────────────────────────

function contactAdminEmail({ name, email, phone, message }) {
    const content = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${alertBanner('✉️', 'New Contact Message')}
      ${sectionTitle('Customer Details')}
      ${infoCard(`
        ${infoRow('Name', name)}
        ${infoRow('Email', `<a href="mailto:${email}" style="color:${BRAND_PINK};text-decoration:none;">${email}</a>`)}
        ${infoRow('Phone', `<a href="tel:${phone}" style="color:${BRAND_PINK};text-decoration:none;">${phone}</a>`)}
      `)}
      ${sectionTitle('Message')}
      <tr>
        <td style="background-color:#1a000d;border:1px solid #3a0020;border-radius:12px;padding:20px 24px;">
          <p style="margin:0;font-size:14px;color:#e0c0cc;line-height:1.8;white-space:pre-wrap;">${message}</p>
        </td>
      </tr>
      ${ctaButton('Reply via Email', `mailto:${email}?subject=Re: Your Enquiry — US Executive Travel`)}
    </table>`;

    return baseLayout(`New message from ${name}`, content);
}

// ─── 4. CONTACT — Customer Auto-reply ────────────────────────────────────────

function contactAutoReplyEmail({ name }) {
    const content = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${alertBanner('🙏', 'Message Received')}
      <tr>
        <td style="padding:24px 0 0;text-align:center;">
          <p style="margin:0;font-size:16px;color:#e0b0c0;line-height:1.8;">
            Thank you, <strong style="color:#fff;">${name}</strong>.<br/>
            We have received your enquiry and our team will get back to you promptly, usually within a few hours.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 0 0;">
          <div style="background:linear-gradient(135deg,#1a000d,#0d0005);border:1px solid #3a0020;border-radius:12px;padding:24px;">
            <p style="margin:0 0 12px;font-size:11px;color:${BRAND_GOLD};text-transform:uppercase;letter-spacing:0.15em;font-weight:700;">Need an urgent response?</p>
            <p style="margin:0;font-size:14px;color:#c0a0b0;line-height:1.7;">Our dispatch team is available <strong style="color:#fff;">24 hours a day, 7 days a week</strong>.<br/>
            Call us directly on <a href="tel:07412671467" style="color:${BRAND_PINK};font-weight:700;text-decoration:none;">07412671467</a>.</p>
          </div>
        </td>
      </tr>
      ${ctaButton('Book a Journey Now', 'https://us-executivetravel.com/book')}
    </table>`;

    return baseLayout(`We received your message — US Executive Travel`, content);
}

// ─── 5. DRIVER APPLICATION — Admin Notification ──────────────────────────────

function driverAdminEmail({ name, email, phone, license, vehicle, experience }) {
    const content = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${alertBanner('📋', 'New Driver Application')}
      ${sectionTitle('Applicant Details')}
      ${infoCard(`
        ${infoRow('Name', name)}
        ${infoRow('Email', `<a href="mailto:${email}" style="color:${BRAND_PINK};text-decoration:none;">${email}</a>`)}
        ${infoRow('Phone', `<a href="tel:${phone}" style="color:${BRAND_PINK};text-decoration:none;">${phone}</a>`)}
      `)}
      ${sectionTitle('Professional Info')}
      ${infoCard(`
        ${infoRow('PHV License', license)}
        ${infoRow('Vehicle', vehicle)}
      `)}
      ${sectionTitle('Experience & Bio')}
      <tr>
        <td style="background-color:#1a000d;border:1px solid #3a0020;border-radius:12px;padding:20px 24px;">
          <p style="margin:0;font-size:14px;color:#e0c0cc;line-height:1.8;white-space:pre-wrap;">${experience}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 0 0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#8a4060;font-style:italic;">Document attached to this email (if submitted)</p>
        </td>
      </tr>
      ${ctaButton('View in Dashboard', 'https://us-executivetravel.com/admin')}
    </table>`;

    return baseLayout(`New driver application from ${name}`, content);
}

// ─── 6. DRIVER APPLICATION — Applicant Confirmation ──────────────────────────

function driverConfirmationEmail({ name, license, vehicle }) {
    const content = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${alertBanner('🎉', 'Application Received!')}
      <tr>
        <td style="padding:24px 0 0;text-align:center;">
          <p style="margin:0;font-size:16px;color:#e0b0c0;line-height:1.8;">
            Thank you, <strong style="color:#fff;">${name}</strong>.<br/>
            We have received your application to join the US Executive Travel fleet.
          </p>
        </td>
      </tr>
      ${sectionTitle('Your Application Summary')}
      ${infoCard(`
        ${infoRow('Name', name)}
        ${infoRow('PHV License', license)}
        ${infoRow('Vehicle', vehicle)}
      `)}
      <tr>
        <td style="padding:28px 0 0;">
          <div style="background:linear-gradient(135deg,#1a000d,#0d0005);border:1px solid #3a0020;border-radius:12px;padding:24px;">
            <p style="margin:0 0 12px;font-size:11px;color:${BRAND_GOLD};text-transform:uppercase;letter-spacing:0.15em;font-weight:700;">What happens next?</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="padding:6px 0;font-size:13px;color:#c0a0b0;"><span style="color:${BRAND_PINK};font-weight:700;margin-right:8px;">01</span> Our recruitment team reviews your application</td></tr>
              <tr><td style="padding:6px 0;font-size:13px;color:#c0a0b0;"><span style="color:${BRAND_PINK};font-weight:700;margin-right:8px;">02</span> We verify your PHV license and documents</td></tr>
              <tr><td style="padding:6px 0;font-size:13px;color:#c0a0b0;"><span style="color:${BRAND_PINK};font-weight:700;margin-right:8px;">03</span> If successful, we contact you to arrange a meeting</td></tr>
            </table>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 0 0;text-align:center;">
          <p style="margin:0;font-size:13px;color:#8a4060;">Questions? Call us on <a href="tel:07412671467" style="color:${BRAND_PINK};text-decoration:none;font-weight:700;">07412671467</a></p>
        </td>
      </tr>
    </table>`;

    return baseLayout(`Application received — US Executive Travel`, content);
}

module.exports = {
    bookingAdminEmail,
    bookingConfirmationEmail,
    contactAdminEmail,
    contactAutoReplyEmail,
    driverAdminEmail,
    driverConfirmationEmail
};
