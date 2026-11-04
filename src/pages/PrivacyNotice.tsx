import { Link } from "react-router-dom";
import { LockKeyhole, ShieldCheck } from "lucide-react";

export function PrivacyNotice() {
    return (
        <main className="site-page driver-apply-page">
            <article className="driver-apply-container driver-form-card driver-privacy-notice">
                <p className="eyebrow">Privacy information</p>
                <h1>Driver application and website chat privacy notice.</h1>
                <p className="driver-privacy-lead">US Executive Travels Ltd uses driver application details to assess licensing readiness and suitability, website chat messages to answer enquiries and coordinate journeys, and public driver profile details to introduce published chauffeurs.</p>

                <section>
                    <h2>Information collected</h2>
                    <p>The application may include contact and address details, date of birth, licensing and vehicle identifiers and dates, answers about compliance checks, work preferences, declarations and documents you choose to provide. We do not request a National Insurance number on the initial form.</p>
                </section>

                <section>
                    <h2>Documents and access</h2>
                    <p>Uploaded files are held in a private storage bucket. They are not attached to application emails or placed in the public website media library. Authorised management members access application records through the administration area; document links are short-lived.</p>
                    <p>Do not upload full Enhanced DBS certificates or medical reports. If a lawful and necessary reason arises to inspect them, management will arrange a separate confidential process.</p>
                </section>

                <section>
                    <h2>Use and sharing</h2>
                    <p>We use application details to review suitability, verify licensing and vehicle information, request missing information, manage availability and send application-related messages. A separate optional checkbox controls unrelated opportunity and marketing messages.</p>
                    <p>Our website hosting, application database and private file storage are provided by contracted service providers. Application information is not included in the internal notification email; that message links authorised staff to the administration area.</p>
                </section>

                <section>
                    <h2>Website chat and public profiles</h2>
                    <p>Chat messages and any name or email address you choose to provide are stored so our management team can answer your enquiry. Driver conversations are visible to authorised management; while driver sign-in is being prepared, management coordinates replies. Only profile details deliberately published by management appear in the public Drivers directory. Private application details, home addresses, licence numbers and compliance answers are not displayed there.</p>
                </section>

                <section>
                    <h2>Retention and your choices</h2>
                    <p>Application and chat information should be kept only for as long as needed for recruitment, responding to enquiries and applicable licensing or record-keeping purposes. For the current retention period, to ask about your information, or to request a correction or deletion, contact <a href="mailto:hello@us-executivetravel.com">hello@us-executivetravel.com</a>.</p>
                    <p>Do not include sensitive documents in email unless management has provided a secure process for them.</p>
                </section>

                <div className="driver-privacy-callout"><LockKeyhole size={18} /><span>Registration does not guarantee employment, work allocation or approval as a driver.</span></div>
                <div className="driver-privacy-callout"><ShieldCheck size={18} /><span>For privacy questions, contact the management team before submitting your application.</span></div>
                <Link className="driver-secondary-link" to="/apply">Return to driver application</Link>
            </article>
        </main>
    );
}
