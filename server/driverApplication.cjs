const { timingSafeEqual } = require('node:crypto');

const DOCUMENTS = Object.freeze({
    privateHireDriverLicence: { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' },
    dvlaDrivingLicence: { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' },
    rightToWork: { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' },
    proofOfAddress: { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' },
    privateHireVehicleLicence: { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' },
    motCertificate: { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' },
    insuranceCertificate: { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' },
});

const APPLICATION_STATUSES = Object.freeze([
    'Application Received',
    'Pending Licensing Approval',
    'Documents Pending',
    'Under Review',
    'Approved',
    'Active',
    'Rejected',
    'Suspended',
    'Inactive',
]);

const BUCKET = 'driver-application-documents';
const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isPlainObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cleanString(value, maxLength = 500) {
    return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function validDate(value, allowEmpty = true) {
    if (allowEmpty && (value === '' || value === null || value === undefined)) return true;
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function validateSessionId(sessionId) {
    return typeof sessionId === 'string' && uuidPattern.test(sessionId);
}

function getDocumentExtension(documentType, mimeType) {
    return DOCUMENTS[documentType]?.[mimeType] || null;
}

function secretsMatch(expected, supplied) {
    if (typeof expected !== 'string' || !expected || typeof supplied !== 'string') return false;
    const expectedBuffer = Buffer.from(expected);
    const suppliedBuffer = Buffer.from(supplied);
    return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

function getDueExpiryReminders(driver, today = new Date().toISOString().slice(0, 10)) {
    const application = driver?.application_data || {};
    const personal = application.personal || {};
    const vehicle = application.vehicle || {};
    const documents = application.documents || {};
    const expiryCandidates = [
        { key: 'driver-licence', label: 'Private hire driver licence', date: personal.driverLicenceExpiryDate || documents.privateHireDriverLicence?.expiryDate },
        { key: 'vehicle-licence', label: 'Private hire vehicle licence', date: vehicle.licenceExpiryDate || documents.privateHireVehicleLicence?.expiryDate },
        { key: 'mot', label: 'MOT certificate', date: vehicle.motExpiryDate || documents.motCertificate?.expiryDate },
        { key: 'insurance', label: 'Private hire insurance', date: vehicle.insuranceExpiryDate || documents.insuranceCertificate?.expiryDate },
        { key: 'dvla-licence', label: 'DVLA driving licence', date: documents.dvlaDrivingLicence?.expiryDate },
        { key: 'right-to-work', label: 'Right to work evidence', date: documents.rightToWork?.expiryDate },
        { key: 'proof-of-address', label: 'Proof of address', date: documents.proofOfAddress?.expiryDate },
    ];
    const todayTime = Date.parse(`${today}T00:00:00.000Z`);
    if (!Number.isFinite(todayTime)) return [];
    return expiryCandidates.flatMap((item) => {
        if (!validDate(item.date, false)) return [];
        const daysBefore = Math.round((Date.parse(`${item.date}T00:00:00.000Z`) - todayTime) / 86400000);
        return daysBefore === 30 || daysBefore === 7 ? [{ ...item, expiryDate: item.date, daysBefore }] : [];
    });
}

function validateApplicationPayload(body) {
    if (!isPlainObject(body) || !isPlainObject(body.application)) return { error: 'Application details are missing.' };
    if (!validateSessionId(body.uploadSessionId)) return { error: 'The secure upload session is invalid. Please reload the form.' };

    const input = body.application;
    const personal = isPlainObject(input.personal) ? input.personal : {};
    const compliance = isPlainObject(input.compliance) ? input.compliance : {};
    const vehicle = isPlainObject(input.vehicle) ? input.vehicle : {};
    const availability = isPlainObject(input.availability) ? input.availability : {};
    const declarations = isPlainObject(input.declarations) ? input.declarations : {};
    const required = [
        ['fullName', personal.fullName], ['dateOfBirth', personal.dateOfBirth], ['address', personal.address],
        ['postcode', personal.postcode], ['phone', personal.phone], ['email', personal.email],
        ['licensingAuthority', personal.licensingAuthority], ['licensedByRbbc', personal.licensedByRbbc],
        ['dbsCheck', compliance.dbsCheck], ['dbsUpdateService', compliance.dbsUpdateService],
        ['medicalAssessment', compliance.medicalAssessment], ['safeguardingTraining', compliance.safeguardingTraining],
        ['knowledgeTest', compliance.knowledgeTest], ['driverLicenceValid', compliance.driverLicenceValid],
    ];
    if (required.some(([, value]) => typeof value !== 'string' || !value.trim())) {
        return { error: 'Please complete all required personal and compliance fields.' };
    }
    if (cleanString(personal.fullName, 120).length < 2) return { error: 'Enter your full name.' };
    if (!/^\S+@\S+\.\S+$/.test(cleanString(personal.email, 254))) return { error: 'Enter a valid email address.' };
    if (cleanString(personal.phone, 30).length < 7) return { error: 'Enter a valid phone number.' };
    if (!validDate(personal.dateOfBirth, false) || new Date(`${personal.dateOfBirth}T00:00:00Z`) >= new Date()) return { error: 'Enter a valid date of birth in the past.' };
    if (!validDate(personal.driverLicenceIssueDate) || !validDate(personal.driverLicenceExpiryDate)) return { error: 'Enter valid driver licence dates.' };
    if (!['Yes', 'No', 'Application in progress'].includes(personal.licensedByRbbc)) return { error: 'Select your Reigate & Banstead licensing status.' };
    if (!['Yes', 'No', 'In progress'].includes(compliance.dbsCheck)) return { error: 'Select your DBS check status.' };
    if (!['Yes', 'No', 'Not applicable'].includes(compliance.dbsUpdateService)) return { error: 'Select your DBS Update Service status.' };
    if (!['Yes', 'No', 'In progress'].includes(compliance.medicalAssessment) || !['Yes', 'No', 'In progress'].includes(compliance.safeguardingTraining) || !['Yes', 'No', 'In progress'].includes(compliance.knowledgeTest)) return { error: 'Select each compliance status.' };
    if (!['Yes', 'No'].includes(compliance.driverLicenceValid)) return { error: 'Select your driver licence status.' };

    const declarationKeys = ['informationAccurate', 'licencesAccurate', 'reportLicensingChanges', 'insuranceCommitment', 'noWorkGuarantee', 'privacyNoticeRead'];
    if (declarationKeys.some((key) => declarations[key] !== true)) return { error: 'Please accept each required declaration before submitting.' };
    if (declarations.marketingConsent !== undefined && typeof declarations.marketingConsent !== 'boolean') return { error: 'Invalid marketing consent value.' };

    for (const key of ['driverLicenceIssueDate', 'driverLicenceExpiryDate']) {
        if (!validDate(personal[key])) return { error: 'Enter valid driver licence dates.' };
    }
    for (const key of ['year', 'passengerSeats']) {
        const value = vehicle[key];
        if (value !== '' && value !== null && value !== undefined && !/^\d{1,4}$/.test(String(value))) return { error: 'Vehicle year and passenger seats must be numbers.' };
    }
    for (const key of ['licenceIssueDate', 'licenceExpiryDate', 'motExpiryDate', 'insuranceExpiryDate']) {
        if (!validDate(vehicle[key])) return { error: 'Enter valid vehicle document dates.' };
    }
    if (!Array.isArray(availability.workTypes) || !Array.isArray(availability.airports) || !Array.isArray(availability.days) || !Array.isArray(availability.hours)) {
        return { error: 'Availability information is invalid.' };
    }
    if (!validDate(availability.startDate)) return { error: 'Enter a valid available start date.' };

    const documents = isPlainObject(input.documents) ? input.documents : {};
    if (Object.keys(documents).some((key) => !DOCUMENTS[key])) return { error: 'One of the document types is invalid.' };
    for (const [documentType, document] of Object.entries(documents)) {
        if (!isPlainObject(document)) return { error: 'A document record is invalid.' };
        const extension = getDocumentExtension(documentType, document.mimeType);
        const expectedPath = `applications/${body.uploadSessionId}/${documentType}.${extension}`;
        if (!extension || document.path !== expectedPath || typeof document.fileName !== 'string' || document.fileName.length > 100) {
            return { error: 'A document upload does not match this application.' };
        }
        if (!Number.isSafeInteger(document.size) || document.size <= 0 || document.size > MAX_DOCUMENT_BYTES) return { error: 'Each document must be 8 MB or smaller.' };
        if (!validDate(document.issueDate) || !validDate(document.expiryDate)) return { error: 'A document has an invalid date.' };
    }

    const normalized = {
        personal: {
            fullName: cleanString(personal.fullName, 120), dateOfBirth: personal.dateOfBirth,
            address: cleanString(personal.address, 300), postcode: cleanString(personal.postcode, 16).toUpperCase(),
            phone: cleanString(personal.phone, 30), email: cleanString(personal.email, 254).toLowerCase(),
            licensingAuthority: cleanString(personal.licensingAuthority, 120), driverLicenceNumber: cleanString(personal.driverLicenceNumber, 80),
            driverLicenceIssueDate: personal.driverLicenceIssueDate || null, driverLicenceExpiryDate: personal.driverLicenceExpiryDate || null,
            licensedByRbbc: personal.licensedByRbbc,
        },
        experience: cleanString(input.experience, 4000),
        compliance: {
            dbsCheck: compliance.dbsCheck, dbsUpdateService: compliance.dbsUpdateService, medicalAssessment: compliance.medicalAssessment,
            safeguardingTraining: compliance.safeguardingTraining, knowledgeTest: compliance.knowledgeTest, driverLicenceValid: compliance.driverLicenceValid,
            confidentialRestrictions: cleanString(compliance.confidentialRestrictions, 2000),
        },
        vehicle: {
            registration: cleanString(vehicle.registration, 16).toUpperCase(), make: cleanString(vehicle.make, 60), model: cleanString(vehicle.model, 60),
            year: vehicle.year ? Number(vehicle.year) : null, colour: cleanString(vehicle.colour, 40), passengerSeats: vehicle.passengerSeats ? Number(vehicle.passengerSeats) : null,
            licensingAuthority: cleanString(vehicle.licensingAuthority, 120), licenceNumber: cleanString(vehicle.licenceNumber, 80),
            licenceIssueDate: vehicle.licenceIssueDate || null, licenceExpiryDate: vehicle.licenceExpiryDate || null,
            motExpiryDate: vehicle.motExpiryDate || null, insuranceExpiryDate: vehicle.insuranceExpiryDate || null,
            registeredKeeper: cleanString(vehicle.registeredKeeper, 120), applicantIsKeeper: cleanString(vehicle.applicantIsKeeper, 30),
            licensedByRbbc: cleanString(vehicle.licensedByRbbc, 40), insuranceCoversApplicant: cleanString(vehicle.insuranceCoversApplicant, 60),
        },
        availability: {
            workTypes: availability.workTypes.slice(0, 12).map((value) => cleanString(value, 80)),
            airports: availability.airports.slice(0, 10).map((value) => cleanString(value, 80)),
            otherAirport: cleanString(availability.otherAirport, 120), days: availability.days.slice(0, 7).map((value) => cleanString(value, 20)),
            hours: availability.hours.slice(0, 8).map((value) => cleanString(value, 40)), operatingAreas: cleanString(availability.operatingAreas, 1000),
            startDate: availability.startDate || null, earlyMorningTransfers: cleanString(availability.earlyMorningTransfers, 20), lateNightCollections: cleanString(availability.lateNightCollections, 20),
        },
        declarations: {
            informationAccurate: true, licencesAccurate: true, reportLicensingChanges: true, insuranceCommitment: true,
            noWorkGuarantee: true, privacyNoticeRead: true, marketingConsent: declarations.marketingConsent === true,
        },
        documents: Object.fromEntries(Object.entries(documents).map(([key, value]) => [key, {
            path: value.path, fileName: cleanString(value.fileName, 100), mimeType: value.mimeType, size: value.size,
            issueDate: value.issueDate || null, expiryDate: value.expiryDate || null, issuingAuthority: cleanString(value.issuingAuthority, 120),
        }])),
    };

    return { application: normalized, uploadSessionId: body.uploadSessionId };
}

module.exports = {
    APPLICATION_STATUSES,
    BUCKET,
    DOCUMENTS,
    MAX_DOCUMENT_BYTES,
    getDocumentExtension,
    getDueExpiryReminders,
    secretsMatch,
    validateApplicationPayload,
    validateSessionId,
};
