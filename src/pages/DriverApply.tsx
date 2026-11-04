import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, FileCheck2, FileText, LockKeyhole, ShieldCheck, Upload, UserRound, CarFront } from "lucide-react";

const DRIVER_DOCS = [
    { key: "privateHireDriverLicence", label: "Private hire driver licence", group: "driver" },
    { key: "dvlaDrivingLicence", label: "DVLA driving licence", group: "driver" },
    { key: "rightToWork", label: "Right to work evidence", group: "driver" },
    { key: "proofOfAddress", label: "Proof of address", group: "driver" },
    { key: "privateHireVehicleLicence", label: "Private hire vehicle licence", group: "vehicle" },
    { key: "motCertificate", label: "MOT certificate", group: "vehicle" },
    { key: "insuranceCertificate", label: "Private hire insurance certificate", group: "vehicle" },
] as const;

const AUTHORITIES = [
    "Reigate & Banstead Borough Council",
    "Transport for London",
    "Elmbridge Borough Council",
    "Epsom and Ewell Borough Council",
    "Guildford Borough Council",
    "Mole Valley District Council",
    "Runnymede Borough Council",
    "Spelthorne Borough Council",
    "Surrey Heath Borough Council",
    "Tandridge District Council",
    "Waverley Borough Council",
    "Woking Borough Council",
    "Other UK authority",
];

const WORK_TYPES = ["Airport transfers", "Executive travel", "Corporate transport", "School transport", "General private hire", "Weekend work", "Evening / night work"];
const AIRPORTS = ["Gatwick", "Heathrow", "London City", "Stansted", "Luton", "Other"];
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const WORK_HOURS = ["Early mornings", "Daytime", "Evenings", "Late nights", "Flexible"];
const FILE_LIMIT = 8 * 1024 * 1024;
const BUCKET = "driver-application-documents";

const inputClass = "w-full min-h-12 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white placeholder:text-white/35 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20";

function Field({ label, name, value, onChange, type = "text", required = false, placeholder = "", min, max, autoComplete }: any) {
    return (
        <label className="driver-field">
            <span>{label}{required && <b aria-hidden="true"> *</b>}</span>
            <input className={inputClass} name={name} type={type} value={value ?? ""} onChange={onChange} required={required} placeholder={placeholder} min={min} max={max} autoComplete={autoComplete} />
        </label>
    );
}

function SelectField({ label, name, value, onChange, options, required = false }: any) {
    return (
        <label className="driver-field">
            <span>{label}{required && <b aria-hidden="true"> *</b>}</span>
            <select className={inputClass} name={name} value={value ?? ""} onChange={onChange} required={required}>
                <option value="">Choose one</option>
                {options.map((option: string) => <option key={option} value={option}>{option}</option>)}
            </select>
        </label>
    );
}

function ChoiceGroup({ label, name, value, options, onChange, required = false, type = "radio" }: any) {
    return (
        <fieldset className="driver-choice-group" aria-required={required}>
            <legend>{label}{required && <b aria-hidden="true"> *</b>}</legend>
            <div className="driver-choice-grid">
                {options.map((option: string) => {
                    const checked = type === "checkbox" ? (value || []).includes(option) : value === option;
                    return (
                        <label className="driver-choice" key={option}>
                            <input type={type} name={name} value={option} checked={checked} required={required && type === "radio" && !value} onChange={(event) => onChange(event, option)} />
                            <span>{option}</span>
                        </label>
                    );
                })}
            </div>
        </fieldset>
    );
}

function Section({ number, title, description, icon: Icon, children }: any) {
    return (
        <section className="driver-form-section" aria-labelledby={`driver-section-${number}`}>
            <div className="driver-section-heading">
                <span className="driver-section-icon"><Icon size={18} /></span>
                <div>
                    <p>Section {number}</p>
                    <h2 id={`driver-section-${number}`}>{title}</h2>
                    {description && <div className="driver-section-description">{description}</div>}
                </div>
            </div>
            <div className="driver-section-content">{children}</div>
        </section>
    );
}

function UploadField({ documentType, label, file, onChange, disabled }: any) {
    return (
        <label className="driver-upload-field">
            <span className="driver-upload-label"><FileText size={17} />{label}</span>
            <span className="driver-upload-control">
                <Upload size={17} />
                <span>{file ? file.name : "Choose PDF, JPG or PNG"}</span>
                <input
                    type="file"
                    name={documentType}
                    accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
                    disabled={disabled}
                    onChange={(event) => onChange(documentType, event.target.files?.[0] || null)}
                />
            </span>
            <small>Optional · up to 8 MB. Do not upload a DBS certificate or medical report.</small>
        </label>
    );
}

const initialValues: Record<string, any> = {
    fullName: "", dateOfBirth: "", address: "", postcode: "", phone: "", email: "",
    licensingAuthority: "", otherLicensingAuthority: "", driverLicenceNumber: "", driverLicenceIssueDate: "", driverLicenceExpiryDate: "", licensedByRbbc: "",
    experience: "", dbsCheck: "", dbsUpdateService: "", medicalAssessment: "", safeguardingTraining: "", knowledgeTest: "", driverLicenceValid: "", confidentialRestrictions: "",
    vehicleRegistration: "", vehicleMake: "", vehicleModel: "", vehicleYear: "", vehicleColour: "", passengerSeats: "", vehicleAuthority: "", otherVehicleAuthority: "", vehicleLicenceNumber: "", vehicleLicenceIssueDate: "", vehicleLicenceExpiryDate: "", motExpiryDate: "", insuranceExpiryDate: "", registeredKeeper: "", applicantIsKeeper: "", vehicleLicensedByRbbc: "", insuranceCoversApplicant: "",
    workTypes: [], airports: [], otherAirport: "", daysAvailable: [], workingHours: [], operatingAreas: "", availableStartDate: "", earlyMorningTransfers: "", lateNightCollections: "",
    declarationAccurate: false, declarationLicences: false, declarationUpdates: false, declarationInsurance: false, declarationNoGuarantee: false, declarationPrivacy: false, marketingConsent: false,
};

const documentMetadata: Record<string, { issueDate?: string; expiryDate?: string; authority?: string }> = {
    privateHireDriverLicence: { issueDate: "driverLicenceIssueDate", expiryDate: "driverLicenceExpiryDate", authority: "licensingAuthority" },
    privateHireVehicleLicence: { issueDate: "vehicleLicenceIssueDate", expiryDate: "vehicleLicenceExpiryDate", authority: "vehicleAuthority" },
    insuranceCertificate: { expiryDate: "insuranceExpiryDate" },
    motCertificate: { expiryDate: "motExpiryDate" },
};

function getUploadSessionId() {
    if (typeof crypto === "undefined" || typeof crypto.getRandomValues !== "function") {
        throw new Error("Secure document uploads require a modern browser on a secure connection.");
    }
    if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function DriverApply() {
    const [status, setStatus] = useState<"idle" | "submitting" | "uploading" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [formData, setFormData] = useState(initialValues);
    const [files, setFiles] = useState<Record<string, File | null>>({});
    const uploadSessionId = useMemo(getUploadSessionId, []);
    const isBusy = status === "submitting" || status === "uploading";

    const updateField = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = event.target;
        setFormData((previous) => ({ ...previous, [name]: value }));
    };

    const updateChoices = (event: React.ChangeEvent<HTMLInputElement>, value: string) => {
        const { name, checked, type } = event.target;
        if (type === "checkbox") {
            setFormData((previous) => ({ ...previous, [name]: checked ? [...previous[name], value] : previous[name].filter((item: string) => item !== value) }));
        } else {
            setFormData((previous) => ({ ...previous, [name]: value }));
        }
    };

    const updateFile = (key: string, file: File | null) => {
        if (file && !["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
            setErrorMsg("Please choose a PDF, JPG, JPEG or PNG file.");
            setStatus("error");
            return;
        }
        if (file && file.size > FILE_LIMIT) {
            setErrorMsg("Each document must be 8 MB or smaller.");
            setStatus("error");
            return;
        }
        setErrorMsg("");
        setStatus("idle");
        setFiles((previous) => ({ ...previous, [key]: file }));
    };

    const uploadDocuments = async () => {
        const entries = Object.entries(files).filter((entry): entry is [string, File] => Boolean(entry[1]));
        if (!entries.length) return {};
        if (!supabase) throw new Error("Secure document upload is not configured. Please contact our team to submit your application.");

        const uploaded: Record<string, Record<string, unknown>> = {};
        for (const [documentType, file] of entries) {
            const uploadUrlResponse = await fetch("/api/apply/upload-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId: uploadSessionId, documentType, mimeType: file.type, size: file.size }),
            });
            const uploadUrlResult = await uploadUrlResponse.json().catch(() => ({}));
            if (!uploadUrlResponse.ok || !uploadUrlResult.success) {
                throw new Error(uploadUrlResult.message || "Could not prepare a secure document upload.");
            }

            const { error } = await supabase.storage.from(BUCKET).uploadToSignedUrl(
                uploadUrlResult.path,
                uploadUrlResult.token,
                file,
                { contentType: file.type, cacheControl: "0" },
            );
            if (error) throw new Error(`Could not upload ${file.name}. ${error.message}`);

            const metadata = documentMetadata[documentType] || {};
            uploaded[documentType] = {
                path: uploadUrlResult.path,
                fileName: file.name.replace(/[^a-z0-9._-]/gi, "_").slice(0, 100),
                mimeType: file.type,
                size: file.size,
                issueDate: metadata.issueDate ? formData[metadata.issueDate] || null : null,
                expiryDate: metadata.expiryDate ? formData[metadata.expiryDate] || null : null,
                issuingAuthority: metadata.authority ? formData[metadata.authority] || null : null,
            };
        }
        return uploaded;
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!event.currentTarget.reportValidity()) return;
        setErrorMsg("");
        setStatus("uploading");

        try {
            const documents = await uploadDocuments();
            setStatus("submitting");
            const payload = {
                application: {
                    personal: {
                        fullName: formData.fullName, dateOfBirth: formData.dateOfBirth, address: formData.address,
                        postcode: formData.postcode, phone: formData.phone, email: formData.email,
                        licensingAuthority: formData.licensingAuthority === "Other UK authority" ? formData.otherLicensingAuthority : formData.licensingAuthority,
                        driverLicenceNumber: formData.driverLicenceNumber, driverLicenceIssueDate: formData.driverLicenceIssueDate,
                        driverLicenceExpiryDate: formData.driverLicenceExpiryDate, licensedByRbbc: formData.licensedByRbbc,
                    },
                    experience: formData.experience,
                    compliance: {
                        dbsCheck: formData.dbsCheck, dbsUpdateService: formData.dbsUpdateService,
                        medicalAssessment: formData.medicalAssessment, safeguardingTraining: formData.safeguardingTraining,
                        knowledgeTest: formData.knowledgeTest, driverLicenceValid: formData.driverLicenceValid,
                        confidentialRestrictions: formData.confidentialRestrictions,
                    },
                    vehicle: {
                        registration: formData.vehicleRegistration, make: formData.vehicleMake, model: formData.vehicleModel,
                        year: formData.vehicleYear, colour: formData.vehicleColour, passengerSeats: formData.passengerSeats,
                        licensingAuthority: formData.vehicleAuthority === "Other UK authority" ? formData.otherVehicleAuthority : formData.vehicleAuthority,
                        licenceNumber: formData.vehicleLicenceNumber, licenceIssueDate: formData.vehicleLicenceIssueDate,
                        licenceExpiryDate: formData.vehicleLicenceExpiryDate, motExpiryDate: formData.motExpiryDate,
                        insuranceExpiryDate: formData.insuranceExpiryDate, registeredKeeper: formData.registeredKeeper,
                        applicantIsKeeper: formData.applicantIsKeeper, licensedByRbbc: formData.vehicleLicensedByRbbc,
                        insuranceCoversApplicant: formData.insuranceCoversApplicant,
                    },
                    availability: {
                        workTypes: formData.workTypes, airports: formData.airports, otherAirport: formData.otherAirport,
                        days: formData.daysAvailable, hours: formData.workingHours, operatingAreas: formData.operatingAreas,
                        startDate: formData.availableStartDate, earlyMorningTransfers: formData.earlyMorningTransfers,
                        lateNightCollections: formData.lateNightCollections,
                    },
                    declarations: {
                        informationAccurate: formData.declarationAccurate, licencesAccurate: formData.declarationLicences,
                        reportLicensingChanges: formData.declarationUpdates, insuranceCommitment: formData.declarationInsurance,
                        noWorkGuarantee: formData.declarationNoGuarantee, privacyNoticeRead: formData.declarationPrivacy,
                        marketingConsent: formData.marketingConsent,
                    },
                    documents,
                },
                uploadSessionId,
            };

            const response = await fetch("/api/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.success) throw new Error(result.message || "The application could not be submitted. Please try again.");
            setStatus("success");
        } catch (error) {
            console.error("Driver application submit failed:", error);
            setStatus("error");
            setErrorMsg(error instanceof Error ? error.message : "Network error. Please try again.");
        }
    };

    if (status === "success") {
        return (
            <main className="site-page driver-apply-page driver-apply-success">
                <div className="driver-apply-container driver-form-card text-center space-y-6">
                    <div className="driver-success-icon"><CheckCircle2 aria-hidden="true" /></div>
                    <p className="eyebrow">Application received</p>
                    <h1>Thank you, {formData.fullName.split(" ")[0]}.</h1>
                    <p className="text-white/65">We’ve emailed an acknowledgement to {formData.email}. Our team will review your information and get in touch about next steps.</p>
                    {formData.licensedByRbbc !== "Yes" && <p className="driver-pending-note">Your application is recorded as pending licensing approval. You can still register your interest while an application is in progress.</p>}
                    <Link to="/" className="driver-secondary-link">Return to home</Link>
                </div>
            </main>
        );
    }

    return (
        <main className="site-page driver-apply-page">
            <div className="driver-apply-container">
                <header className="page-intro driver-apply-intro">
                    <p className="eyebrow">Driver applications</p>
                    <h1>Drive with us.</h1>
                    <p>Register your interest in joining our private hire network. You can submit your details while licensing or vehicle documents are in progress.</p>
                    <div className="driver-intro-assurance"><LockKeyhole size={16} /><span>Documents are stored privately and reviewed by authorised management only.</span></div>
                </header>

                <form onSubmit={handleSubmit} className="driver-form-card driver-application-form">
                    <Section number="01" title="Personal information" description="Tell us how to contact you and which licensing authority issued your private hire driver licence." icon={UserRound}>
                        <div className="driver-fields-grid">
                            <Field label="Full name" name="fullName" value={formData.fullName} onChange={updateField} required autoComplete="name" placeholder="Your full legal name" />
                            <Field label="Date of birth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={updateField} required max={new Date().toISOString().slice(0, 10)} />
                            <Field label="Mobile telephone" name="phone" type="tel" value={formData.phone} onChange={updateField} required autoComplete="tel" placeholder="+44 7..." />
                            <Field label="Email address" name="email" type="email" value={formData.email} onChange={updateField} required autoComplete="email" placeholder="you@example.com" />
                            <label className="driver-field driver-field-wide"><span>Residential address</span><textarea className={inputClass} name="address" value={formData.address} onChange={updateField} rows={2} autoComplete="street-address" required placeholder="House number, street, town" /></label>
                            <Field label="Postcode" name="postcode" value={formData.postcode} onChange={updateField} required autoComplete="postal-code" placeholder="e.g. RH2 0SH" />
                            <SelectField label="Private hire licensing authority" name="licensingAuthority" value={formData.licensingAuthority} onChange={updateField} options={AUTHORITIES} required />
                            {formData.licensingAuthority === "Other UK authority" && <Field label="Name of licensing authority" name="otherLicensingAuthority" value={formData.otherLicensingAuthority} onChange={updateField} required />}
                            <Field label="Private hire driver licence number" name="driverLicenceNumber" value={formData.driverLicenceNumber} onChange={updateField} placeholder="Enter licence number" />
                            <Field label="Driver licence issue date" name="driverLicenceIssueDate" type="date" value={formData.driverLicenceIssueDate} onChange={updateField} />
                            <Field label="Driver licence expiry date" name="driverLicenceExpiryDate" type="date" value={formData.driverLicenceExpiryDate} onChange={updateField} />
                        </div>
                        <ChoiceGroup label="Are you currently licensed by Reigate & Banstead Borough Council?" name="licensedByRbbc" value={formData.licensedByRbbc} options={["Yes", "No", "Application in progress"]} onChange={updateChoices} required />
                        <p className="driver-helper-note">We do not ask for a National Insurance number on this initial expression of interest. It will only be requested later if needed for engagement or payroll.</p>
                    </Section>

                    <Section number="02" title="Driver documents" description="Upload the documents you already have. Missing documents can be provided later when requested." icon={FileCheck2}>
                        <div className="driver-upload-grid">
                            {DRIVER_DOCS.filter((document) => document.group === "driver").map((document) => <UploadField key={document.key} documentType={document.key} label={document.label} file={files[document.key]} onChange={updateFile} disabled={isBusy} />)}
                        </div>
                        <p className="driver-helper-note">The issuing authority and driver licence dates recorded above are saved alongside this document.</p>
                        <p className="driver-sensitive-note"><ShieldCheck size={17} />Do not upload Enhanced DBS certificates or full medical reports. We’ll discuss any necessary checks privately with you.</p>
                    </Section>

                    <Section number="03" title="Licensing & compliance" description="These answers help our management team understand what is complete and what remains in progress. They are not a request to upload sensitive certificates." icon={ShieldCheck}>
                        <div className="driver-fields-grid">
                            <SelectField label="Enhanced DBS check" name="dbsCheck" value={formData.dbsCheck} onChange={updateField} options={["Yes", "No", "In progress"]} required />
                            <SelectField label="DBS Update Service registration" name="dbsUpdateService" value={formData.dbsUpdateService} onChange={updateField} options={["Yes", "No", "Not applicable"]} required />
                            <SelectField label="RBBC-approved medical assessment" name="medicalAssessment" value={formData.medicalAssessment} onChange={updateField} options={["Yes", "No", "In progress"]} required />
                            <SelectField label="Required safeguarding training" name="safeguardingTraining" value={formData.safeguardingTraining} onChange={updateField} options={["Yes", "No", "In progress"]} required />
                            <SelectField label="Licensing authority knowledge test" name="knowledgeTest" value={formData.knowledgeTest} onChange={updateField} options={["Yes", "No", "In progress"]} required />
                            <SelectField label="Is your driver licence valid and free from suspension or revocation?" name="driverLicenceValid" value={formData.driverLicenceValid} onChange={updateField} options={["Yes", "No"]} required />
                        </div>
                        <label className="driver-field"><span>Confidential note for management (optional)</span><textarea className={inputClass} name="confidentialRestrictions" value={formData.confidentialRestrictions} onChange={updateField} rows={3} placeholder="Use this private field if you need to discuss a licensing restriction or compliance concern." /></label>
                        <p className="driver-helper-note">Only authorised management can view this information. Please do not enter medical details or attach DBS information here.</p>
                    </Section>

                    <Section number="04" title="Vehicle information" description="Add the vehicle you intend to use. If your vehicle or licence is not ready yet, you can still register your interest." icon={CarFront}>
                        <div className="driver-fields-grid">
                            <Field label="Vehicle registration" name="vehicleRegistration" value={formData.vehicleRegistration} onChange={updateField} placeholder="AB12 CDE" />
                            <Field label="Vehicle make" name="vehicleMake" value={formData.vehicleMake} onChange={updateField} placeholder="Mercedes-Benz" />
                            <Field label="Vehicle model" name="vehicleModel" value={formData.vehicleModel} onChange={updateField} placeholder="E-Class" />
                            <Field label="Year of manufacture" name="vehicleYear" type="number" min="1990" max={new Date().getFullYear() + 1} value={formData.vehicleYear} onChange={updateField} placeholder="2023" />
                            <Field label="Vehicle colour" name="vehicleColour" value={formData.vehicleColour} onChange={updateField} />
                            <Field label="Passenger seats" name="passengerSeats" type="number" min="1" max="16" value={formData.passengerSeats} onChange={updateField} />
                            <SelectField label="Vehicle licensing authority" name="vehicleAuthority" value={formData.vehicleAuthority} onChange={updateField} options={AUTHORITIES} />
                            {formData.vehicleAuthority === "Other UK authority" && <Field label="Name of vehicle licensing authority" name="otherVehicleAuthority" value={formData.otherVehicleAuthority} onChange={updateField} required />}
                            <Field label="Private hire vehicle licence number" name="vehicleLicenceNumber" value={formData.vehicleLicenceNumber} onChange={updateField} />
                            <Field label="Vehicle licence issue date" name="vehicleLicenceIssueDate" type="date" value={formData.vehicleLicenceIssueDate} onChange={updateField} />
                            <Field label="Vehicle licence expiry date" name="vehicleLicenceExpiryDate" type="date" value={formData.vehicleLicenceExpiryDate} onChange={updateField} />
                            <Field label="MOT expiry date" name="motExpiryDate" type="date" value={formData.motExpiryDate} onChange={updateField} />
                            <Field label="Insurance expiry date" name="insuranceExpiryDate" type="date" value={formData.insuranceExpiryDate} onChange={updateField} />
                            <Field label="Registered keeper's name" name="registeredKeeper" value={formData.registeredKeeper} onChange={updateField} />
                        </div>
                        <ChoiceGroup label="Are you the vehicle's registered keeper?" name="applicantIsKeeper" value={formData.applicantIsKeeper} options={["Yes", "No"]} onChange={updateChoices} />
                        <ChoiceGroup label="Is your vehicle currently licensed by Reigate & Banstead Borough Council?" name="vehicleLicensedByRbbc" value={formData.vehicleLicensedByRbbc} options={["Yes", "No", "Application in progress", "Vehicle not yet selected"]} onChange={updateChoices} />
                        <ChoiceGroup label="Does the insurance cover you for the intended private hire work?" name="insuranceCoversApplicant" value={formData.insuranceCoversApplicant} options={["Yes", "No", "Will arrange before activation"]} onChange={updateChoices} />
                    </Section>

                    <Section number="05" title="Vehicle documents" description="The insurance certificate should show private hire cover and include you as an intended driver before you begin work." icon={FileText}>
                        <div className="driver-upload-grid">
                            {DRIVER_DOCS.filter((document) => document.group === "vehicle").map((document) => <UploadField key={document.key} documentType={document.key} label={document.label} file={files[document.key]} onChange={updateFile} disabled={isBusy} />)}
                        </div>
                        <p className="driver-helper-note">Licence, MOT and insurance dates above are recorded for expiry tracking. You can register interest while documents are being renewed.</p>
                    </Section>

                    <Section number="06" title="Availability" description="Let us know what kind of work and hours suit you." icon={CarFront}>
                        <ChoiceGroup label="What type of work are you interested in?" name="workTypes" value={formData.workTypes} options={WORK_TYPES} onChange={updateChoices} type="checkbox" />
                        <ChoiceGroup label="Which airports can you serve?" name="airports" value={formData.airports} options={AIRPORTS} onChange={updateChoices} type="checkbox" />
                        {formData.airports.includes("Other") && <Field label="Other airport(s)" name="otherAirport" value={formData.otherAirport} onChange={updateField} />}
                        <ChoiceGroup label="Days available" name="daysAvailable" value={formData.daysAvailable} options={WEEKDAYS} onChange={updateChoices} type="checkbox" />
                        <ChoiceGroup label="Preferred working hours" name="workingHours" value={formData.workingHours} options={WORK_HOURS} onChange={updateChoices} type="checkbox" />
                        <div className="driver-fields-grid">
                            <label className="driver-field driver-field-wide"><span>Preferred operating areas</span><textarea className={inputClass} name="operatingAreas" value={formData.operatingAreas} onChange={updateField} rows={2} placeholder="Towns, counties or routes you prefer" /></label>
                            <Field label="Available start date" name="availableStartDate" type="date" value={formData.availableStartDate} onChange={updateField} />
                            <SelectField label="Early morning airport transfers" name="earlyMorningTransfers" value={formData.earlyMorningTransfers} onChange={updateField} options={["Yes", "No", "Sometimes"]} />
                            <SelectField label="Late-night airport collections" name="lateNightCollections" value={formData.lateNightCollections} onChange={updateField} options={["Yes", "No", "Sometimes"]} />
                        </div>
                    </Section>

                    <Section number="07" title="Declarations & consent" description="Please confirm these points before sending your application." icon={CheckCircle2}>
                        <div className="driver-declarations">
                            <label><input type="checkbox" name="declarationAccurate" checked={formData.declarationAccurate} onChange={(event) => setFormData((p) => ({ ...p, declarationAccurate: event.target.checked }))} required /><span>I confirm the information I have provided is accurate.</span></label>
                            <label><input type="checkbox" name="declarationLicences" checked={formData.declarationLicences} onChange={(event) => setFormData((p) => ({ ...p, declarationLicences: event.target.checked }))} required /><span>I confirm the licence details provided are accurate and understand I must hold the required valid licences before undertaking work.</span></label>
                            <label><input type="checkbox" name="declarationUpdates" checked={formData.declarationUpdates} onChange={(event) => setFormData((p) => ({ ...p, declarationUpdates: event.target.checked }))} required /><span>I will notify US Executive Travels of any licence suspension, revocation or relevant change to my licensing status.</span></label>
                            <label><input type="checkbox" name="declarationInsurance" checked={formData.declarationInsurance} onChange={(event) => setFormData((p) => ({ ...p, declarationInsurance: event.target.checked }))} required /><span>I will provide appropriate private hire insurance that covers me and my vehicle before I accept work.</span></label>
                            <label><input type="checkbox" name="declarationNoGuarantee" checked={formData.declarationNoGuarantee} onChange={(event) => setFormData((p) => ({ ...p, declarationNoGuarantee: event.target.checked }))} required /><span>I understand registration does not guarantee employment, work allocation or approval as a driver.</span></label>
                            <label><input type="checkbox" name="declarationPrivacy" checked={formData.declarationPrivacy} onChange={(event) => setFormData((p) => ({ ...p, declarationPrivacy: event.target.checked }))} required /><span>I have read the <Link to="/privacy-notice" target="_blank" rel="noreferrer">Driver Application Privacy Notice</Link>.</span></label>
                        </div>
                        <label className="driver-declaration-optional"><input type="checkbox" name="marketingConsent" checked={formData.marketingConsent} onChange={(event) => setFormData((p) => ({ ...p, marketingConsent: event.target.checked }))} /><span>I’m happy to hear about unrelated future opportunities and updates. This is optional and can be withdrawn at any time.</span></label>
                        <p className="driver-helper-note">Your answers and files are used to review your driver application. Only authorised management can access them. Do not submit your National Insurance number, full DBS certificate or medical report here.</p>
                    </Section>

                    {errorMsg && <p className="driver-form-error" role="alert">{errorMsg}</p>}
                    <div className="driver-submit-wrap">
                        <Button type="submit" disabled={isBusy} className="w-full">
                            {status === "uploading" ? "UPLOADING PRIVATE DOCUMENTS…" : status === "submitting" ? "SENDING APPLICATION…" : "SUBMIT DRIVER APPLICATION"}
                        </Button>
                        <p><LockKeyhole size={14} /> Your documents are not attached to emails or placed in the public media library.</p>
                    </div>
                </form>
            </div>
        </main>
    );
}
