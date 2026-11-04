const { createHash, randomBytes } = require('node:crypto');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CHAT_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const PROFILE_STATUSES = Object.freeze(['draft', 'active', 'inactive']);

function cleanString(value, maxLength) {
    return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function isUuid(value) {
    return typeof value === 'string' && UUID_PATTERN.test(value);
}

function createChatToken() {
    return randomBytes(32).toString('base64url');
}

function hashChatToken(token) {
    if (typeof token !== 'string' || !CHAT_TOKEN_PATTERN.test(token)) return null;
    return createHash('sha256').update(token).digest('hex');
}

function normalizeDriverProfile(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: 'Driver profile details are required.' };
    const displayName = cleanString(input.displayName, 120);
    const headline = cleanString(input.headline, 140);
    const bio = cleanString(input.bio, 1800);
    const baseLocation = cleanString(input.baseLocation, 120);
    const photoUrl = cleanString(input.photoUrl, 500);
    const status = input.status || 'draft';
    const isPublic = input.isPublic === true;
    const applicationId = cleanString(input.applicationId, 64);
    const driverUserId = cleanString(input.driverUserId, 128);
    const vehicleInput = input.vehicle && typeof input.vehicle === 'object' && !Array.isArray(input.vehicle) ? input.vehicle : {};
    const vehicle = {
        make: cleanString(vehicleInput.make, 60),
        model: cleanString(vehicleInput.model, 60),
        year: cleanString(String(vehicleInput.year || ''), 4),
        colour: cleanString(vehicleInput.colour, 40),
        category: cleanString(vehicleInput.category, 60),
    };
    const services = Array.isArray(input.services)
        ? [...new Set(input.services.slice(0, 12).map((item) => cleanString(item, 60)).filter(Boolean))]
        : [];

    if (displayName.length < 2) return { error: 'Enter the driver display name.' };
    if (!PROFILE_STATUSES.includes(status)) return { error: 'Choose a valid driver profile status.' };
    if (photoUrl && (!/^https:\/\//i.test(photoUrl) || photoUrl.length > 500)) return { error: 'Photo URL must use HTTPS.' };
    if (vehicle.year && !/^\d{4}$/.test(vehicle.year)) return { error: 'Enter a four digit vehicle year.' };
    if (isPublic && (status !== 'active' || bio.length < 20 || !baseLocation)) {
        return { error: 'A public profile needs an active status, a base location and a short biography.' };
    }

    return {
        profile: {
            display_name: displayName,
            headline,
            bio,
            base_location: baseLocation,
            photo_url: photoUrl || null,
            vehicle,
            services,
            application_id: applicationId || null,
            driver_user_id: driverUserId || null,
            status,
            is_public: isPublic,
        },
    };
}

function validateVisitorMessage(value) {
    const body = cleanString(value, 2000);
    return body.length ? body : null;
}

function validateVisitorIdentity(input = {}) {
    const name = cleanString(input.name, 100) || 'Website visitor';
    const email = cleanString(input.email, 254).toLowerCase();
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return { error: 'Enter a valid email address or leave it blank.' };
    return { identity: { name, email: email || null } };
}

async function loadRecentChatSummaries(supabase, limit = 5, offset = 0) {
    const { data: conversations, error } = await supabase.from('chat_conversations')
        .select('id,conversation_type,driver_profile_id,visitor_name,visitor_email,status,created_at,last_message_at')
        .order('last_message_at', { ascending: false })
        .range(offset, offset + limit - 1);
    if (error) throw error;
    if (!conversations?.length) return [];

    const ids = conversations.map((conversation) => conversation.id);
    const profileIds = [...new Set(conversations.map((conversation) => conversation.driver_profile_id).filter(Boolean))];
    const [{ data: messages, error: messageError }, { data: profiles, error: profileError }] = await Promise.all([
        supabase.from('chat_messages').select('conversation_id,sender_role,body,created_at')
            .in('conversation_id', ids).order('created_at', { ascending: false }).limit(Math.max(limit * 20, 100)),
        profileIds.length
            ? supabase.from('driver_profiles').select('id,display_name').in('id', profileIds)
            : Promise.resolve({ data: [], error: null }),
    ]);
    if (messageError || profileError) throw (messageError || profileError);

    const latestMessage = new Map();
    for (const message of messages || []) {
        if (!latestMessage.has(message.conversation_id)) latestMessage.set(message.conversation_id, message);
    }
    const profileById = new Map((profiles || []).map((profile) => [profile.id, profile.display_name]));
    return conversations.map((conversation) => ({
        ...conversation,
        driver_name: conversation.driver_profile_id ? profileById.get(conversation.driver_profile_id) || 'Driver' : null,
        latest_message: latestMessage.get(conversation.id) || null,
    }));
}

module.exports = {
    PROFILE_STATUSES,
    createChatToken,
    hashChatToken,
    isUuid,
    loadRecentChatSummaries,
    normalizeDriverProfile,
    validateVisitorIdentity,
    validateVisitorMessage,
};
