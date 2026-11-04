import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Plus, Save, UserRound, X } from "lucide-react";

type DriverProfile = {
    id: string;
    display_name: string;
    headline?: string;
    bio?: string;
    base_location?: string;
    photo_url?: string | null;
    vehicle?: { make?: string; model?: string; year?: string; colour?: string; category?: string };
    services?: string[];
    status: "draft" | "active" | "inactive";
    is_public: boolean;
    application_id?: string | null;
    driver_user_id?: string | null;
};

type FormState = Omit<DriverProfile, "id" | "display_name" | "vehicle" | "services" | "is_public" | "status"> & {
    id: string | null;
    displayName: string;
    headline: string;
    bio: string;
    baseLocation: string;
    photoUrl: string;
    vehicleMake: string;
    vehicleModel: string;
    vehicleYear: string;
    vehicleColour: string;
    vehicleCategory: string;
    servicesText: string;
    status: "draft" | "active" | "inactive";
    isPublic: boolean;
    applicationId: string;
    driverUserId: string;
};

const blankForm = (): FormState => ({
    id: null, displayName: "", headline: "", bio: "", baseLocation: "", photoUrl: "",
    vehicleMake: "", vehicleModel: "", vehicleYear: "", vehicleColour: "", vehicleCategory: "",
    servicesText: "", status: "draft", isPublic: false, applicationId: "", driverUserId: "",
});

export function DriverProfileManager({ getHeaders }: { getHeaders: (json?: boolean) => Promise<Record<string, string>> }) {
    const [profiles, setProfiles] = useState<DriverProfile[]>([]);
    const [form, setForm] = useState<FormState>(blankForm);
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const loadProfiles = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/admin/driver-profiles", { headers: await getHeaders() });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.message || "Driver profiles could not be loaded.");
            setProfiles(result.profiles || []);
            setError("");
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Driver profiles could not be loaded.");
        } finally { setLoading(false); }
    }, [getHeaders]);

    useEffect(() => { loadProfiles(); }, [loadProfiles]);

    const editProfile = (profile: DriverProfile) => {
        setForm({
            id: profile.id, displayName: profile.display_name || "", headline: profile.headline || "", bio: profile.bio || "",
            baseLocation: profile.base_location || "", photoUrl: profile.photo_url || "", vehicleMake: profile.vehicle?.make || "",
            vehicleModel: profile.vehicle?.model || "", vehicleYear: profile.vehicle?.year || "", vehicleColour: profile.vehicle?.colour || "",
            vehicleCategory: profile.vehicle?.category || "", servicesText: (profile.services || []).join(", "), status: profile.status,
            isPublic: profile.is_public, applicationId: profile.application_id || "", driverUserId: profile.driver_user_id || "",
        });
        setEditing(true);
        setNotice("");
    };

    const saveProfile = async (event: FormEvent) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        setNotice("");
        const body = {
            displayName: form.displayName, headline: form.headline, bio: form.bio, baseLocation: form.baseLocation,
            photoUrl: form.photoUrl, status: form.status, isPublic: form.isPublic, applicationId: form.applicationId,
            driverUserId: form.driverUserId, services: form.servicesText.split(",").map((item) => item.trim()).filter(Boolean),
            vehicle: { make: form.vehicleMake, model: form.vehicleModel, year: form.vehicleYear, colour: form.vehicleColour, category: form.vehicleCategory },
        };
        try {
            const response = await fetch(form.id ? `/api/admin/driver-profiles/${form.id}` : "/api/admin/driver-profiles", {
                method: form.id ? "PATCH" : "POST",
                headers: await getHeaders(true),
                body: JSON.stringify(body),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.message || "Driver profile could not be saved.");
            setNotice(form.isPublic ? "Profile saved and published." : "Profile saved as private.");
            setForm(blankForm());
            setEditing(false);
            await loadProfiles();
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Driver profile could not be saved.");
        } finally { setSaving(false); }
    };

    const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));

    return (
        <div className="admin-driver-profiles">
            <div className="admin-section-heading">
                <div><p className="admin-eyebrow">Public directory · Admin managed</p><h2>Driver profiles</h2><p>Create and edit public profiles. Applicant-only details stay in Applications.</p></div>
                <button type="button" className="admin-pink-button" onClick={() => { setForm(blankForm()); setEditing(true); setError(""); setNotice(""); }}><Plus size={16} /> Add driver</button>
            </div>
            {notice && <p className="admin-chat-notice" role="status">{notice}</p>}
            {error && <p className="admin-chat-error" role="alert">{error}</p>}

            {editing && <form className="admin-driver-profile-form" onSubmit={saveProfile}>
                <div className="admin-form-heading"><div><p className="admin-eyebrow">{form.id ? "Edit profile" : "New profile"}</p><h3>{form.id ? form.displayName : "Add a driver"}</h3></div><button type="button" className="admin-icon-button" onClick={() => { setEditing(false); setForm(blankForm()); }} aria-label="Close editor"><X size={18} /></button></div>
                <div className="admin-profile-fields">
                    <label>Display name<input required minLength={2} maxLength={120} value={form.displayName} onChange={(event) => update("displayName", event.target.value)} /></label>
                    <label>Headline<input maxLength={140} value={form.headline} onChange={(event) => update("headline", event.target.value)} placeholder="Executive chauffeur · Surrey" /></label>
                    <label>Base location<input maxLength={120} value={form.baseLocation} onChange={(event) => update("baseLocation", event.target.value)} /></label>
                    <label>Profile image URL<input type="url" placeholder="https://…" value={form.photoUrl} onChange={(event) => update("photoUrl", event.target.value)} /></label>
                    <label className="wide">Biography<textarea minLength={form.isPublic ? 20 : 0} maxLength={1800} rows={4} value={form.bio} onChange={(event) => update("bio", event.target.value)} placeholder="A short, public introduction. Do not include private contact or licensing information." /></label>
                    <label>Services<input value={form.servicesText} onChange={(event) => update("servicesText", event.target.value)} placeholder="Airport transfers, Business travel" /></label>
                    <label>Vehicle category<input value={form.vehicleCategory} onChange={(event) => update("vehicleCategory", event.target.value)} placeholder="Executive saloon" /></label>
                    <label>Vehicle make<input value={form.vehicleMake} onChange={(event) => update("vehicleMake", event.target.value)} /></label>
                    <label>Vehicle model<input value={form.vehicleModel} onChange={(event) => update("vehicleModel", event.target.value)} /></label>
                    <label>Vehicle year<input inputMode="numeric" maxLength={4} value={form.vehicleYear} onChange={(event) => update("vehicleYear", event.target.value)} /></label>
                    <label>Vehicle colour<input value={form.vehicleColour} onChange={(event) => update("vehicleColour", event.target.value)} /></label>
                    <label>Application ID (optional)<input value={form.applicationId} onChange={(event) => update("applicationId", event.target.value)} /></label>
                    <label>Driver account ID (future sign-in)<input maxLength={128} value={form.driverUserId} onChange={(event) => update("driverUserId", event.target.value)} placeholder="Link an identity-provider user later" /></label>
                    <label>Status<select value={form.status} onChange={(event) => update("status", event.target.value as FormState["status"])}><option value="draft">Draft</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
                </div>
                <label className="admin-profile-publish"><input type="checkbox" checked={form.isPublic} onChange={(event) => update("isPublic", event.target.checked)} /> Publish in the public Drivers directory</label>
                <div className="admin-profile-form-footer"><span>Only profile details above appear publicly. Application records remain private.</span><button type="submit" className="admin-pink-button" disabled={saving}>{saving ? "Saving…" : <><Save size={16} /> Save profile</>}</button></div>
            </form>}

            {loading ? <div className="admin-profile-empty">Loading profiles…</div> : profiles.length === 0 ? (
                <div className="admin-profile-empty"><UserRound size={22} /><strong>No driver profiles yet</strong><span>Add one when a driver is ready to join the public directory.</span></div>
            ) : <div className="admin-profile-list">{profiles.map((profile) => <article key={profile.id} className="admin-profile-card">
                <div className="admin-profile-avatar">{profile.photo_url ? <img src={profile.photo_url} alt="" /> : <UserRound size={20} />}</div>
                <div className="admin-profile-card-main"><h3>{profile.display_name}</h3><p>{profile.headline || profile.base_location || "Driver profile"}</p><span className={`admin-profile-status ${profile.is_public && profile.status === "active" ? "published" : "private"}`}>{profile.is_public && profile.status === "active" ? "Published" : profile.status}</span></div>
                <button type="button" className="admin-outline-button" onClick={() => editProfile(profile)}>Edit profile</button>
            </article>)}</div>}
        </div>
    );
}
