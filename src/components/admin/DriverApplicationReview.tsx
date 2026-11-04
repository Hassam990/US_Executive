import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, LoaderCircle, ShieldCheck, X } from "lucide-react";

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
                                    {document.signedUrl && <a href={document.signedUrl} target="_blank" rel="noreferrer"><Download size={15} /> View file</a>}
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
