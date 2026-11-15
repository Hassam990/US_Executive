import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, LoaderCircle, Printer, ShieldCheck, X } from "lucide-react";

const statuses = [
    "Application Received", "Pending Licensing Approval", "Documents Pending", "Under Review",
    "Approved", "Active", "Rejected", "Suspended", "Inactive",
];

const documentLabels: Record<string, string> = {
    privateHireDriverLicence: "Private hire driver licence",
    dvlaDrivingLicence: "DVLA driving licence",
    rightToWork: "Right to work evidence",
    proofOfAddress: "Proof of address",
    privateHireVehicleLicence: "Private hire vehicle licence",
    motCertificate: "MOT certificate",
    insuranceCertificate: "Private hire insurance certificate",
};

function FieldValue({ label, value }: { label: string; value?: unknown }) {
    if (value === undefined || value === null || value === "") return null;
    return <div className="driver-review-value"><span>{label}</span><strong>{String(value)}</strong></div>;
}

function expiryLabel(value?: string) {
    if (!value) return null;
    const expiry = new Date(`${value}T00:00:00`);
    const days = Math.ceil((expiry.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
    if (days < 0) return { text: `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`, kind: "expired" };
    if (days <= 7) return { text: `Expires in ${days} day${days === 1 ? "" : "s"}`, kind: "urgent" };
    if (days <= 30) return { text: `Expires in ${days} days`, kind: "soon" };
    return { text: `Expires ${expiry.toLocaleDateString("en-GB")}`, kind: "ok" };
}

export function DriverApplicationReview({ driver, onClose, onRefresh, accessToken, isClerkAdmin, clerkEmail }: any) {
    const application = driver.application_data || {};
    const personal = application.personal || {};
    const vehicle = application.vehicle || {};
    const compliance = application.compliance || {};
    const availability = application.availability || {};
    const declarations = application.declarations || {};
    const [documents, setDocuments] = useState<Record<string, any>>({});
    const [loadingDocuments, setLoadingDocuments] = useState(true);
    const [openingDocument, setOpeningDocument] = useState<string | null>(null);
    const [exportingPdf, setExportingPdf] = useState(false);
    const [status, setStatus] = useState(driver.application_status || "Application Received");
    const [savedStatus, setSavedStatus] = useState(driver.application_status || "Application Received");
    const [savingStatus, setSavingStatus] = useState(false);
    const [requestNote, setRequestNote] = useState("");
    const [requesting, setRequesting] = useState(false);
    const [availabilitySaving, setAvailabilitySaving] = useState<"driver" | "vehicle" | null>(null);
    const [driverAvailable, setDriverAvailable] = useState(driver.availability_status === "available");
    const [vehicleAvailable, setVehicleAvailable] = useState(driver.vehicle_availability_status === "available");
    const [error, setError] = useState("");

    const expiryItems = useMemo<any[]>(() => [
        ["Driver licence", personal.driverLicenceExpiryDate],
        ["Vehicle licence", vehicle.licenceExpiryDate],
        ["MOT", vehicle.motExpiryDate],
        ["Insurance", vehicle.insuranceExpiryDate],
        ...Object.entries(application.documents || {}).map(([key, item]: [string, any]) => [documentLabels[key] || key, item?.expiryDate]),
    ].map(([label, date]: any) => ({ label, date, state: expiryLabel(date) })).filter((item: any) => Boolean(item.state)), [application, personal, vehicle]);

    const headers = async (json = false) => {
        const token = isClerkAdmin ? await accessToken() : localStorage.getItem("adminToken");
        return {
            ...(json ? { "Content-Type": "application/json" } : {}),
            Authorization: `Bearer ${token}`,
            ...(isClerkAdmin && clerkEmail ? { "x-user-email": clerkEmail } : {}),
        };
    };

    const getFreshDocuments = async () => {
        const response = await fetch(`/api/admin/drivers/${driver.id}/documents`, { headers: await headers() });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || "Private documents could not be refreshed.");
        return result.documents || {};
    };

    const openDocument = async (documentKey: string) => {
        const documentWindow = window.open("about:blank", "_blank");
        if (!documentWindow) {
            window.alert("Please allow pop-ups to view this private document.");
            return;
        }
        documentWindow.opener = null;
        setOpeningDocument(documentKey);
        setError("");
        try {
            const freshDocuments = await getFreshDocuments();
            const signedUrl = freshDocuments[documentKey]?.signedUrl;
            if (!signedUrl) throw new Error("The private document is unavailable.");
            documentWindow.location.replace(signedUrl);
        } catch (openError) {
            documentWindow.close();
            setError(openError instanceof Error ? openError.message : "The private document could not be opened.");
        } finally {
            setOpeningDocument(null);
        }
    };

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const response = await fetch(`/api/admin/drivers/${driver.id}/documents`, { headers: await headers() });
                const result = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(result.message || "Documents could not be loaded.");
                if (active) setDocuments(result.documents || {});
            } catch (loadError) {
                if (active) setError(loadError instanceof Error ? loadError.message : "Documents could not be loaded.");
            } finally {
                if (active) setLoadingDocuments(false);
            }
        })();
        return () => { active = false; };
        // Fetch a fresh five-minute signed URL whenever another driver is opened.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [driver.id]);

    const saveStatus = async () => {
        setSavingStatus(true);
        setError("");
        try {
            const response = await fetch(`/api/admin/drivers/${driver.id}/status`, {
                method: "PATCH", headers: await headers(true), body: JSON.stringify({ status }),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.message || "Status could not be updated.");
            setSavedStatus(status);
            onRefresh();
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Status could not be updated.");
        } finally {
            setSavingStatus(false);
        }
    };

    const requestDocuments = async () => {
        setRequesting(true);
        setError("");
        try {
            const response = await fetch(`/api/admin/drivers/${driver.id}/request-documents`, {
                method: "POST", headers: await headers(true), body: JSON.stringify({ message: requestNote }),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.message || "The request could not be sent.");
            setRequestNote("");
            setStatus(result.status || "Documents Pending");
            setSavedStatus(result.status || "Documents Pending");
            onRefresh();
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "The request could not be sent.");
        } finally {
            setRequesting(false);
        }
    };

    const toggleAvailability = async (target: "driver" | "vehicle") => {
        setAvailabilitySaving(target);
        setError("");
        const available = target === "driver" ? !driverAvailable : !vehicleAvailable;
        try {
            const response = await fetch(`/api/admin/drivers/${driver.id}/availability`, {
                method: "PATCH", headers: await headers(true), body: JSON.stringify({ available, target }),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.message || "Availability could not be updated.");
            if (target === "driver") setDriverAvailable(available);
            else setVehicleAvailable(available);
            onRefresh();
        } catch (availabilityError) {
            setError(availabilityError instanceof Error ? availabilityError.message : "Availability could not be updated.");
        } finally {
            setAvailabilitySaving(null);
        }
    };

    const exportApplication = () => {
        const fields = [
            ["Application ID", driver.id], ["Name", personal.fullName || driver.name], ["Email", personal.email || driver.email],
            ["Phone", personal.phone || driver.phone], ["Application status", status], ["Driver licence number", personal.driverLicenceNumber || driver.license],
            ["Driver licence expiry", personal.driverLicenceExpiryDate], ["Vehicle registration", vehicle.registration],
            ["Vehicle", [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(" ") || driver.vehicle],
            ["Vehicle licence expiry", vehicle.licenceExpiryDate], ["MOT expiry", vehicle.motExpiryDate], ["Insurance expiry", vehicle.insuranceExpiryDate],
            ["Driver availability", driverAvailable ? "Available" : "Unavailable"], ["Vehicle availability", vehicleAvailable ? "Available" : "Unavailable"],
        ];
        const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
        const csv = fields.map(([label, value]) => `${escape(label)},${escape(value)}`).join("\r\n");
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `driver-application-${driver.id}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    const exportApplicationPdf = async () => {
        const printWindow = window.open("", "_blank", "width=900,height=1000");
        if (!printWindow) {
            window.alert("Please allow pop-ups to create the application PDF.");
            return;
        }
        printWindow.opener = null;
        setError("");
        setExportingPdf(true);
        try {
        const pdfDocuments = await getFreshDocuments();
        const sections: Array<[string, Array<[string, unknown]>]> = [
            ["Applicant and licensing", [
                ["Application ID", driver.id], ["Submitted", driver.created_at ? new Date(driver.created_at).toLocaleString("en-GB") : ""],
                ["Status", status], ["Full name", personal.fullName || driver.name], ["Email", personal.email || driver.email],
                ["Phone", personal.phone || driver.phone], ["Date of birth", personal.dateOfBirth],
                ["Address", [personal.address, personal.postcode].filter(Boolean).join(", ")],
                ["Licensing authority", personal.licensingAuthority], ["Driver licence number", personal.driverLicenceNumber || driver.license],
                ["Licence issue date", personal.driverLicenceIssueDate], ["Licence expiry date", personal.driverLicenceExpiryDate],
                ["Licensed by RBBC", personal.licensedByRbbc], ["Experience", application.experience || driver.experience],
            ]],
            ["Compliance", [["Enhanced DBS check", compliance.dbsCheck], ["DBS Update Service", compliance.dbsUpdateService],
                ["Medical assessment", compliance.medicalAssessment], ["Safeguarding training", compliance.safeguardingTraining],
                ["Knowledge test", compliance.knowledgeTest], ["Licence valid", compliance.driverLicenceValid],
                ["Restrictions", compliance.confidentialRestrictions]]],
            ["Vehicle", [["Registration", vehicle.registration], ["Vehicle", [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(" ") || driver.vehicle],
                ["Colour", vehicle.colour], ["Passenger seats", vehicle.passengerSeats], ["Vehicle authority", vehicle.licensingAuthority],
                ["Vehicle licence number", vehicle.licenceNumber], ["Vehicle licence expiry", vehicle.licenceExpiryDate],
                ["MOT expiry", vehicle.motExpiryDate], ["Insurance expiry", vehicle.insuranceExpiryDate],
                ["Registered keeper", vehicle.registeredKeeper], ["Applicant is keeper", vehicle.applicantIsKeeper],
                ["Licensed by RBBC", vehicle.licensedByRbbc], ["Insurance covers applicant", vehicle.insuranceCoversApplicant]]],
            ["Availability", [["Work types", list(availability.workTypes)], ["Airports", list(availability.airports)],
                ["Days", list(availability.days)], ["Preferred hours", list(availability.hours)], ["Operating areas", availability.operatingAreas],
                ["Start date", availability.startDate], ["Early airport runs", availability.earlyMorningTransfers],
                ["Late night collections", availability.lateNightCollections], ["Driver availability", driverAvailable ? "Available" : "Unavailable"],
                ["Vehicle availability", vehicleAvailable ? "Available" : "Unavailable"]]],
            ["Declarations", [
                ...Object.entries(declarations).filter(([key]) => key !== "marketingConsent").map(([key, value]): [string, unknown] =>
                    [key.replace(/([A-Z])/g, " $1"), value ? "Confirmed" : "Not confirmed"]),
                ["Marketing consent", declarations.marketingConsent ? "Yes" : "No"],
            ]],
        ];
        const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
        })[char]!);
        const sectionsHtml = sections.map(([heading, fields]) => {
            const rows = fields.filter(([, value]) => value !== undefined && value !== null && value !== "")
                .map(([label, value]) => `<div class="field"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
            return rows ? `<section><h2>${escapeHtml(heading)}</h2><div class="grid">${rows}</div></section>` : "";
        }).join("");
        const documentPages = Object.entries(pdfDocuments).map(([key, document]: [string, any]) => {
            const label = documentLabels[key] || key;
            const fileName = document.fileName || "Uploaded file";
            const source = document.signedUrl ? escapeHtml(document.signedUrl) : "";
            const isPdf = document.mimeType === "application/pdf" || /\.pdf$/i.test(fileName);
            const preview = !source
                ? `<p class="missing-document">A secure preview link is unavailable. Reopen this application and try again.</p>`
                : isPdf
                    ? `<iframe class="pdf-document" src="${source}" title="${escapeHtml(label)}"></iframe>`
                    : `<img class="image-document" src="${source}" alt="${escapeHtml(label)}" />`;
            return `<section class="attachment-page"><h2>Uploaded document · ${escapeHtml(label)}</h2><p class="attachment-name">${escapeHtml(fileName)}${document.expiryDate ? ` · Expires ${escapeHtml(document.expiryDate)}` : ""}</p>${preview}</section>`;
        }).join("");
        const documentsSection = documentPages || `<section><h2>Uploaded documents</h2><p class="missing-document">No documents were uploaded with this application.</p></section>`;
        printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Driver Application - ${escapeHtml(personal.fullName || driver.name)}</title>
            <style>
                *{box-sizing:border-box}body{margin:0;background:#f7f5f6;color:#262126;font:14px/1.5 Arial,sans-serif}
                main{max-width:900px;margin:32px auto;background:#fff;padding:42px 48px;box-shadow:0 10px 40px #34132212}
                header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #ec4899;padding-bottom:22px;margin-bottom:26px}
                .brand{display:flex;align-items:center;gap:12px}.mark{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:#ec4899;color:white;font-weight:800;font-size:16px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
                .brand strong{display:block;font-size:16px;letter-spacing:.03em}.brand span,.meta{color:#766d73;font-size:11px}
                h1{font-size:24px;margin:0 0 4px}h2{font-size:14px;color:#c02676;border-bottom:1px solid #f3d4e4;padding-bottom:7px;margin:24px 0 12px}
                .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px}.field{padding:7px 0;border-bottom:1px solid #f1edf0;min-width:0;break-inside:avoid}
                .field span{display:block;color:#766d73;font-size:10px;text-transform:uppercase;letter-spacing:.05em}.field strong{display:block;overflow-wrap:anywhere;font-weight:600}
                .attachment-page{break-before:page;page-break-before:always}.attachment-name{margin:0 0 12px;color:#766d73;font-size:12px;overflow-wrap:anywhere}
                .image-document{display:block;max-width:100%;max-height:245mm;margin:0 auto;object-fit:contain;object-position:top center}
                .pdf-document{display:block;width:100%;height:255mm;border:0}.missing-document{padding:16px;border:1px solid #f1d3e2;border-radius:10px;color:#766d73}
                footer{margin-top:28px;padding-top:12px;border-top:1px solid #eee;color:#766d73;font-size:10px}
                @page{size:A4;margin:14mm}@media print{body{background:#fff}main{margin:0;padding:0;max-width:none;box-shadow:none}header{break-after:avoid}.attachment-page{break-inside:avoid}}
            </style></head><body><main><header><div class="brand"><div class="mark">US</div><div><strong>US EXECUTIVE TRAVEL</strong><span>Private hire driver network · Confidential application</span></div></div><div class="meta">APPLICATION RECORD</div></header>
            <h1>${escapeHtml(personal.fullName || driver.name || "Driver application")}</h1><div class="meta">Application #${escapeHtml(driver.id)} · ${escapeHtml(status)}</div>
            ${sectionsHtml}${documentsSection}<footer>Confidential applicant information and uploaded documents. Handle and store securely. Generated ${escapeHtml(new Date().toLocaleString("en-GB"))} · US Executive Travel</footer></main>
            <script>window.addEventListener('load',()=>window.setTimeout(()=>window.print(),700));window.addEventListener('afterprint',()=>window.close());</script></body></html>`);
        printWindow.document.close();
        } catch (exportError) {
            printWindow.close();
            setError(exportError instanceof Error ? exportError.message : "The application PDF could not be prepared.");
        } finally {
            setExportingPdf(false);
        }
    };

    const list = (values: unknown) => Array.isArray(values) && values.length ? values.join(", ") : undefined;

    return (
        <div className="driver-review-backdrop" role="presentation" onClick={onClose}>
            <section className="driver-review-modal" role="dialog" aria-modal="true" aria-labelledby="driver-review-title" onClick={(event) => event.stopPropagation()}>
                <header className="driver-review-header">
                    <div>
                        <p className="eyebrow">Private management view · Application #{driver.id}</p>
                        <h2 id="driver-review-title">{driver.name}</h2>
                        <p>{driver.email} · {driver.phone}</p>
                    </div>
                    <div className="driver-review-header-actions">
                        <Button type="button" variant="outline" onClick={exportApplicationPdf} disabled={loadingDocuments || exportingPdf} title={loadingDocuments ? "Loading secure document previews…" : undefined}><Printer size={16} />{exportingPdf ? "Refreshing documents…" : loadingDocuments ? "Preparing PDF…" : "Save PDF"}</Button>
                        <Button type="button" variant="outline" onClick={exportApplication}>Export summary</Button>
                        <button type="button" className="driver-review-close" onClick={onClose} aria-label="Close application"><X /></button>
                    </div>
                </header>

                <div className="driver-review-status-row">
                    <label><span>Application status</span><select value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
                    <Button type="button" onClick={saveStatus} disabled={savingStatus || status === savedStatus}>{savingStatus ? "Saving…" : "Save status"}</Button>
                </div>

                <div className="driver-review-availability-actions">
                    <Button type="button" variant="outline" onClick={() => toggleAvailability("driver")} disabled={availabilitySaving !== null}>{availabilitySaving === "driver" ? "Saving…" : driverAvailable ? "Driver: mark unavailable" : "Driver: mark available"}</Button>
                    <Button type="button" variant="outline" onClick={() => toggleAvailability("vehicle")} disabled={availabilitySaving !== null}>{availabilitySaving === "vehicle" ? "Saving…" : vehicleAvailable ? "Vehicle: mark unavailable" : "Vehicle: mark available"}</Button>
                </div>

                {error && <p className="driver-review-error" role="alert">{error}</p>}

                {expiryItems.length > 0 && <section className="driver-review-section">
                    <h3>Expiry overview</h3>
                    <div className="driver-expiry-grid">{expiryItems.map((item) => <div className={`driver-expiry-card ${item.state.kind}`} key={`${item.label}-${item.date}`}><span>{item.label}</span><strong>{item.state.text}</strong></div>)}</div>
                </section>}

                <section className="driver-review-section">
                    <h3>Personal and licensing</h3>
                    <div className="driver-review-grid">
                        <FieldValue label="Date of birth" value={personal.dateOfBirth} />
                        <FieldValue label="Address" value={[personal.address, personal.postcode].filter(Boolean).join(", ")} />
                        <FieldValue label="Licensing authority" value={personal.licensingAuthority} />
                        <FieldValue label="Driver licence number" value={personal.driverLicenceNumber || driver.license} />
                        <FieldValue label="Driver licence issue date" value={personal.driverLicenceIssueDate} />
                        <FieldValue label="Driver licence expiry date" value={personal.driverLicenceExpiryDate} />
                        <FieldValue label="RBBC status" value={personal.licensedByRbbc} />
                        <FieldValue label="Experience" value={application.experience || driver.experience} />
                    </div>
                </section>

                <section className="driver-review-section">
                    <h3>Compliance answers</h3>
                    <div className="driver-review-grid">
                        <FieldValue label="Enhanced DBS check" value={compliance.dbsCheck} />
                        <FieldValue label="DBS Update Service" value={compliance.dbsUpdateService} />
                        <FieldValue label="Medical assessment" value={compliance.medicalAssessment} />
                        <FieldValue label="Safeguarding training" value={compliance.safeguardingTraining} />
                        <FieldValue label="Knowledge test" value={compliance.knowledgeTest} />
                        <FieldValue label="Licence valid" value={compliance.driverLicenceValid} />
                        <FieldValue label="Confidential note" value={compliance.confidentialRestrictions} />
                    </div>
                    <p className="driver-review-privacy"><ShieldCheck size={15} /> No DBS certificate or full medical report is collected in this form.</p>
                </section>

                <section className="driver-review-section">
                    <h3>Vehicle information</h3>
                    <div className="driver-review-grid">
                        <FieldValue label="Registration" value={vehicle.registration} />
                        <FieldValue label="Vehicle" value={[vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(" ") || driver.vehicle} />
                        <FieldValue label="Colour / seats" value={[vehicle.colour, vehicle.passengerSeats ? `${vehicle.passengerSeats} seats` : ""].filter(Boolean).join(" · ")} />
                        <FieldValue label="Vehicle authority" value={vehicle.licensingAuthority} />
                        <FieldValue label="Vehicle licence number" value={vehicle.licenceNumber} />
                        <FieldValue label="Vehicle licence expiry" value={vehicle.licenceExpiryDate} />
                        <FieldValue label="MOT expiry" value={vehicle.motExpiryDate} />
                        <FieldValue label="Insurance expiry" value={vehicle.insuranceExpiryDate} />
                        <FieldValue label="Registered keeper" value={vehicle.registeredKeeper} />
                        <FieldValue label="Applicant is keeper" value={vehicle.applicantIsKeeper} />
                        <FieldValue label="RBBC vehicle status" value={vehicle.licensedByRbbc} />
                        <FieldValue label="Insurance includes applicant" value={vehicle.insuranceCoversApplicant} />
                    </div>
                </section>

                <section className="driver-review-section">
                    <h3>Availability</h3>
                    <div className="driver-review-grid">
                        <FieldValue label="Work types" value={list(availability.workTypes)} />
                        <FieldValue label="Airports" value={list(availability.airports)} />
                        <FieldValue label="Days" value={list(availability.days)} />
                        <FieldValue label="Preferred hours" value={list(availability.hours)} />
                        <FieldValue label="Areas" value={availability.operatingAreas} />
                        <FieldValue label="Start date" value={availability.startDate} />
                        <FieldValue label="Early airport runs" value={availability.earlyMorningTransfers} />
                        <FieldValue label="Late collections" value={availability.lateNightCollections} />
                    </div>
                </section>

                <section className="driver-review-section">
                    <h3>Uploaded documents</h3>
                    {loadingDocuments ? <p className="driver-review-muted"><LoaderCircle size={16} className="animate-spin" />Preparing private links…</p> : (
                        <div className="driver-document-list">
                            {Object.entries(documents).length ? Object.entries(documents).map(([key, document]: [string, any]) => (
                                <div className="driver-document-row" key={key}>
                                    <div><strong>{documentLabels[key] || key}</strong><span>{document.fileName}{document.expiryDate ? ` · expires ${document.expiryDate}` : ""}</span></div>
                                    {(document.signedUrl || document.path) && <button type="button" onClick={() => openDocument(key)} disabled={openingDocument === key}><Download size={15} /> {openingDocument === key ? "Opening…" : "View file"}</button>}
                                </div>
                            )) : <p className="driver-review-muted">No documents were uploaded with this application.</p>}
                        </div>
                    )}
                    <p className="driver-review-privacy"><ShieldCheck size={15} /> Document links expire after five minutes. Do not forward them.</p>
                </section>

                <section className="driver-review-section">
                    <h3>Request missing information</h3>
                    <label className="driver-review-request"><span>Message sent to the applicant by email</span><textarea value={requestNote} onChange={(event) => setRequestNote(event.target.value)} maxLength={1200} rows={3} placeholder="List the missing document or information and how they can provide it securely." /></label>
                    <Button type="button" onClick={requestDocuments} disabled={requesting || requestNote.trim().length < 4}>{requesting ? "Sending…" : "Request information"}</Button>
                    {(application.management?.documentRequests || []).length > 0 && <div className="driver-request-history"><span>Previous requests</span>{application.management.documentRequests.map((request: any, index: number) => <p key={`${request.requestedAt}-${index}`}>{request.requestedAt?.slice(0, 10)} · {request.message}</p>)}</div>}
                </section>

                <section className="driver-review-section driver-review-declarations">
                    <h3>Declarations</h3>
                    {Object.entries(declarations).filter(([key]) => key !== "marketingConsent").map(([key, value]) => <FieldValue key={key} label={key.replace(/([A-Z])/g, " $1")} value={value ? "Confirmed" : "Not confirmed"} />)}
                    <FieldValue label="Marketing consent" value={declarations.marketingConsent ? "Yes" : "No"} />
                </section>
            </section>
        </div>
    );
}
