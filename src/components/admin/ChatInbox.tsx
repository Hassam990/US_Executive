import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowUp, Headphones, Mail, MessageCircle, RefreshCw, UserRound } from "lucide-react";

type Conversation = {
    id: string;
    conversation_type: "support" | "driver";
    driver_profile_id: string | null;
    driver_name?: string | null;
    visitor_name: string;
    visitor_email: string | null;
    status: "open" | "closed";
    created_at: string;
    last_message_at: string;
    latest_message?: { body: string; sender_role: string } | null;
};
type ChatMessage = { id: number; sender_role: string; body: string; created_at: string };

export function ChatInbox({ getHeaders }: { getHeaders: (json?: boolean) => Promise<Record<string, string>> }) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selected, setSelected] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [reply, setReply] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [nextOffset, setNextOffset] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

    const loadConversations = useCallback(async (append = false) => {
        try {
            const offset = append ? nextOffset : 0;
            const response = await fetch(`/api/admin/chats?offset=${offset}`, { headers: await getHeaders() });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.message || "Chat inbox could not be loaded.");
            const page = result.conversations || [];
            setConversations((current) => {
                if (append) {
                    const existing = new Set(current.map((item) => item.id));
                    return [...current, ...page.filter((item: Conversation) => !existing.has(item.id))];
                }
                const pageIds = new Set(page.map((item: Conversation) => item.id));
                return [...page, ...current.filter((item) => !pageIds.has(item.id))];
            });
            setNextOffset(result.nextOffset || 0);
            setHasMore(Boolean(result.hasMore));
            setError("");
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Chat inbox could not be loaded.");
        } finally { setLoading(false); }
    }, [getHeaders, nextOffset]);

    const loadThread = useCallback(async (conversation: Conversation) => {
        const response = await fetch(`/api/admin/chats/${conversation.id}/messages`, { headers: await getHeaders() });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || "Conversation could not be loaded.");
        setMessages(result.messages || []);
        setSelected(result.conversation || conversation);
    }, [getHeaders]);

    useEffect(() => { loadConversations(); const timer = window.setInterval(loadConversations, 10000); return () => window.clearInterval(timer); }, [loadConversations]);
    useEffect(() => {
        if (!selected || selected.status !== "open") return;
        const timer = window.setInterval(() => loadThread(selected).catch(() => {}), 5000);
        return () => window.clearInterval(timer);
    }, [selected, loadThread]);

    const chooseConversation = async (conversation: Conversation) => {
        setError("");
        try { await loadThread(conversation); }
        catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Conversation could not be loaded."); }
    };

    const sendReply = async (event: FormEvent) => {
        event.preventDefault();
        if (!selected || !reply.trim() || sending) return;
        setSending(true);
        setError("");
        try {
            const response = await fetch(`/api/admin/chats/${selected.id}/messages`, {
                method: "POST", headers: await getHeaders(true), body: JSON.stringify({ body: reply }),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.message || "Your reply could not be sent.");
            setReply("");
            await loadThread(selected);
            await loadConversations();
        } catch (sendError) { setError(sendError instanceof Error ? sendError.message : "Your reply could not be sent."); }
        finally { setSending(false); }
    };

    const toggleStatus = async () => {
        if (!selected) return;
        const status: "open" | "closed" = selected.status === "open" ? "closed" : "open";
        try {
            const response = await fetch(`/api/admin/chats/${selected.id}/status`, {
                method: "PATCH", headers: await getHeaders(true), body: JSON.stringify({ status }),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.message || "Conversation status could not be updated.");
            const nextSelected = { ...selected, status };
            setSelected(nextSelected);
            setConversations((current) => current.map((item) => item.id === selected.id ? nextSelected : item));
        } catch (updateError) { setError(updateError instanceof Error ? updateError.message : "Conversation status could not be updated."); }
    };

    const titleFor = (conversation: Conversation) => conversation.conversation_type === "driver"
        ? `${conversation.driver_name || "Driver"} · ${conversation.visitor_name}`
        : `Support · ${conversation.visitor_name}`;

    return (
        <section className="admin-chat-inbox">
            <div className="admin-section-heading"><div><p className="admin-eyebrow">Website conversations</p><h2>Chat inbox</h2><p>Support and driver enquiries appear here for the management team.</p></div><button type="button" className="admin-outline-button" onClick={() => loadConversations()}><RefreshCw size={15} /> Refresh</button></div>
            {error && <p className="admin-chat-error" role="alert">{error}</p>}
            <div className="admin-chat-layout">
                <aside className="admin-chat-list" aria-label="Conversations">
                    {loading ? <div className="admin-profile-empty">Loading conversations…</div> : conversations.length === 0 ? <div className="admin-profile-empty"><MessageCircle size={22} /><strong>No chats yet</strong><span>New website conversations will show up here.</span></div> : <>{conversations.map((conversation) => (
                        <button type="button" key={conversation.id} onClick={() => chooseConversation(conversation)} className={`admin-chat-list-item ${selected?.id === conversation.id ? "selected" : ""}`}>
                            <span className="admin-chat-list-icon">{conversation.conversation_type === "driver" ? <UserRound size={17} /> : <Headphones size={17} />}</span>
                            <span className="admin-chat-list-copy"><strong>{titleFor(conversation)}</strong><small>{conversation.latest_message?.body || "Conversation started"}</small><em>{new Date(conversation.last_message_at).toLocaleString()} · {conversation.status}</em></span>
                        </button>
                    ))}{hasMore && <button type="button" className="admin-chat-load-more" disabled={loadingMore} onClick={async () => { setLoadingMore(true); await loadConversations(true); setLoadingMore(false); }}>{loadingMore ? "Loading…" : "Load older conversations"}</button>}</>}
                </aside>

                <div className="admin-chat-thread">
                    {!selected ? <div className="admin-chat-empty"><MessageCircle size={27} /><h3>Choose a conversation</h3><p>Every message sent through the website chat is available to admins here.</p></div> : <>
                        <header className="admin-chat-thread-header"><div><p className="admin-eyebrow">{selected.conversation_type === "driver" ? `Driver chat · ${selected.driver_name || "Driver"}` : "Support chat"}</p><h3>{selected.visitor_name}</h3><p>{selected.visitor_email || "No email provided"}</p></div><button type="button" className="admin-outline-button" onClick={toggleStatus}>{selected.status === "open" ? "Close chat" : "Reopen chat"}</button></header>
                        {selected.conversation_type === "driver" && <p className="admin-chat-routing-note">Driver accounts are not enabled yet; this conversation is routed to management so the team can coordinate the reply.</p>}
                        <div className="admin-chat-messages">{messages.map((item) => <div className={`admin-chat-message ${item.sender_role === "visitor" ? "from-visitor" : "from-team"}`} key={item.id}><span>{item.sender_role === "visitor" ? selected.visitor_name : item.sender_role === "driver" ? "Driver" : "US Executive"}</span><p>{item.body}</p><time>{new Date(item.created_at).toLocaleString()}</time></div>)}</div>
                        {selected.status === "open" ? <form className="admin-chat-reply" onSubmit={sendReply}><input value={reply} onChange={(event) => setReply(event.target.value)} maxLength={2000} placeholder="Write a reply…" aria-label="Write a reply" /><button type="submit" disabled={sending || !reply.trim()} aria-label="Send reply"><ArrowUp size={18} /></button></form> : <div className="admin-chat-closed">This conversation is closed. Reopen it to reply.</div>}
                        {selected.visitor_email && <a className="admin-chat-call" href={`mailto:${selected.visitor_email}?subject=US%20Executive%20Travel%20chat%20follow-up`}><Mail size={14} /> Email visitor</a>}
                    </>}
                </div>
            </div>
        </section>
    );
}
