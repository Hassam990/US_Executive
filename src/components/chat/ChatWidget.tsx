import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, ArrowUp, Check, ChevronRight, Headphones, MessageCircle, Phone, UserRound, X } from "lucide-react";
import type { ChatTarget } from "./ChatContext";

type ChatMessage = { id: string | number; sender_role: "visitor" | "admin" | "driver" | "assistant"; body: string; created_at: string };
type ChatSession = { id: string; token: string; status: "open" | "closed" };

const faqs = [
    { question: "How do I book a journey?", answer: "Choose ‘Book a journey’ in the menu or call our team on 07412 671467. We’ll confirm the details and availability with you." },
    { question: "Do you provide airport transfers?", answer: "Yes. We arrange airport transfers across Surrey and the UK. Share your flight, pickup and destination details with the team for a quote." },
    { question: "Can I ask about a specific driver?", answer: "Once a driver profile is published, open it from Our Drivers and choose ‘Message driver’ to start a conversation." },
    { question: "How can I speak to someone now?", answer: "Call 07412 671467 and our team will help with your journey or question." },
];

function getSessionKey(target: ChatTarget) {
    return target.type === "support" ? "us-exec-chat:support" : `us-exec-chat:driver:${target.driverId}`;
}

function ChatWidget({ open, target, onOpenChange }: { open: boolean; target: ChatTarget; onOpenChange: (open: boolean) => void }) {
    const [mode, setMode] = useState<"faq" | "human">("faq");
    const [session, setSession] = useState<ChatSession | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [faqMessages, setFaqMessages] = useState<ChatMessage[]>([]);
    const [message, setMessage] = useState("");
    const [visitorName, setVisitorName] = useState("");
    const [visitorEmail, setVisitorEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const sessionKey = useMemo(() => getSessionKey(target), [target]);
    const shuffledFaqs = useMemo(() => [...faqs].sort(() => Math.random() - 0.5), []);
    const title = target.type === "driver" ? target.driverName : "US Executive Support";

    const loadMessages = useCallback(async (chatSession: ChatSession) => {
        const response = await fetch(`/api/chat/conversations/${chatSession.id}/messages`, {
            headers: { "X-Chat-Token": chatSession.token },
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || "Chat messages could not be loaded.");
        setMessages(result.messages || []);
        if (result.conversation?.status) setSession((current) => current ? { ...current, status: result.conversation.status } : current);
    }, []);

    const startConversation = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const response = await fetch("/api/chat/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: target.type,
                    ...(target.type === "driver" ? { driverProfileId: target.driverId } : {}),
                    name: visitorName,
                    email: visitorEmail,
                }),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.message || "Chat is temporarily unavailable.");
            const nextSession: ChatSession = { id: result.conversation.id, token: result.chatToken, status: result.conversation.status };
            sessionStorage.setItem(sessionKey, JSON.stringify(nextSession));
            setSession(nextSession);
            setMode("human");
            setMessages([]);
            return nextSession;
        } catch (startError) {
            setError(startError instanceof Error ? startError.message : "Chat is temporarily unavailable.");
            return null;
        } finally {
            setLoading(false);
        }
    }, [sessionKey, target, visitorEmail, visitorName]);

    useEffect(() => {
        if (!open) return;
        setMode(target.type === "driver" ? "human" : "faq");
        setError("");
        setMessages([]);
        setFaqMessages([]);
        setSession(null);
        const stored = sessionStorage.getItem(sessionKey);
        if (!stored) return;
        try {
            const saved = JSON.parse(stored) as ChatSession;
            if (!saved.id || !saved.token) throw new Error("Invalid saved session.");
            setSession(saved);
            setMode("human");
            loadMessages(saved).catch(() => {
                sessionStorage.removeItem(sessionKey);
                setSession(null);
                setMessages([]);
            });
        } catch {
            sessionStorage.removeItem(sessionKey);
        }
    }, [open, sessionKey, target.type, loadMessages]);

    useEffect(() => {
        if (!open || !session || session.status !== "open") return;
        const timer = window.setInterval(() => loadMessages(session).catch(() => {}), 5000);
        return () => window.clearInterval(timer);
    }, [open, session, loadMessages]);

    const chooseFaq = (item: (typeof faqs)[number]) => {
        const now = new Date().toISOString();
        setFaqMessages((previous) => [
            ...previous,
            { id: `${now}-q`, sender_role: "visitor", body: item.question, created_at: now },
            { id: `${now}-a`, sender_role: "assistant", body: item.answer, created_at: now },
        ]);
    };

    const sendMessage = async (event: FormEvent) => {
        event.preventDefault();
        const body = message.trim();
        if (!body || sending || body.length > 2000) return;
        setSending(true);
        setError("");
        try {
            const activeSession = session || await startConversation();
            if (!activeSession) return;
            const response = await fetch(`/api/chat/conversations/${activeSession.id}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-Chat-Token": activeSession.token },
                body: JSON.stringify({ body }),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.message || "Your message could not be sent.");
            setMessage("");
            await loadMessages(activeSession);
        } catch (sendError) {
            setError(sendError instanceof Error ? sendError.message : "Your message could not be sent.");
        } finally {
            setSending(false);
        }
    };

    const startNewChat = () => {
        sessionStorage.removeItem(sessionKey);
        setSession(null);
        setMessages([]);
        setError("");
        if (target.type === "support") setMode("faq");
        else startConversation();
    };

    const visibleMessages = mode === "faq" ? faqMessages : messages;

    return (
        <div className="chat-widget-root">
            {open && (
                <section className="chat-panel" role="dialog" aria-modal="false" aria-label="Chat with US Executive Travel">
                    <header className="chat-panel-header">
                        {mode === "human" && target.type === "support" && !session && (
                            <button type="button" className="chat-header-back" onClick={() => { setMode("faq"); setError(""); }} aria-label="Back to quick answers"><ArrowLeft size={18} /></button>
                        )}
                        <div className="chat-panel-avatar"><Headphones size={19} /></div>
                        <div className="chat-panel-title"><strong>{title}</strong><span>{mode === "faq" ? "Quick answers · here to help" : session?.status === "closed" ? "This conversation is closed" : "Replies appear here"}</span></div>
                        <button type="button" className="chat-close" onClick={() => onOpenChange(false)} aria-label="Close chat"><X size={19} /></button>
                    </header>

                    <div className="chat-panel-body">
                        {target.type === "driver" && !session && (
                            <div className="chat-driver-note"><UserRound size={16} /> Your message will be visible to the driver and our support team. Driver accounts are being prepared, so management can help coordinate replies.</div>
                        )}
                        {mode === "faq" && faqMessages.length === 0 && (
                            <div className="chat-welcome"><span className="chat-welcome-kicker">Good day</span><h2>How can we help?</h2><p>Pick a quick answer or talk with our team.</p></div>
                        )}
                        {visibleMessages.map((item) => (
                            <div key={item.id} className={`chat-message-row ${item.sender_role === "visitor" ? "visitor" : "team"}`}>
                                <div className="chat-message-bubble">{item.body}</div>
                            </div>
                        ))}
                        {mode === "faq" && (
                            <div className="chat-faq-list" aria-label="Quick questions">
                                {shuffledFaqs.map((item) => <button key={item.question} type="button" onClick={() => chooseFaq(item)}>{item.question}<ChevronRight size={15} /></button>)}
                                <button type="button" className="chat-human-button" onClick={() => { setMode("human"); if (session) loadMessages(session).catch(() => {}); }}>Chat with our team <MessageCircle size={15} /></button>
                            </div>
                        )}
                        {mode === "human" && !session && target.type === "support" && (
                            <div className="chat-start-form">
                                <p>Leave a message and our team will reply here. You can add your contact details if you’d like a follow-up.</p>
                                <label>Your name <input value={visitorName} onChange={(event) => setVisitorName(event.target.value)} maxLength={100} placeholder="Name (optional)" /></label>
                                <label>Email address <input type="email" value={visitorEmail} onChange={(event) => setVisitorEmail(event.target.value)} maxLength={254} placeholder="Email (optional)" /></label>
                            </div>
                        )}
                        {mode === "human" && !session && target.type === "driver" && (
                            <div className="chat-start-form">
                                <p>Start a conversation with {target.driverName}. Add an email if you’d like the team to follow up outside this browser session.</p>
                                <label>Your name <input value={visitorName} onChange={(event) => setVisitorName(event.target.value)} maxLength={100} placeholder="Name (optional)" /></label>
                                <label>Email address <input type="email" value={visitorEmail} onChange={(event) => setVisitorEmail(event.target.value)} maxLength={254} placeholder="Email (optional)" /></label>
                                <button type="button" className="chat-start-button" disabled={loading} onClick={() => startConversation()}>{loading ? "Starting…" : "Start chat"}</button>
                            </div>
                        )}
                        {session?.status === "closed" && <div className="chat-closed-note"><span>This conversation has been closed by the team.</span><button type="button" onClick={startNewChat}>Start a new chat</button></div>}
                        {error && <p className="chat-error" role="alert">{error}</p>}
                    </div>

                    {mode === "human" && (
                        <form className="chat-composer" onSubmit={sendMessage}>
                            <a href="tel:07412671467" className="chat-call-link"><Phone size={16} /><span>Call</span></a>
                            <input value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} placeholder={session?.status === "closed" ? "Conversation closed" : "Write a message…"} disabled={sending || session?.status === "closed"} aria-label="Write a chat message" />
                            <button type="submit" disabled={!message.trim() || sending || session?.status === "closed"} aria-label="Send message">{sending ? <Check size={17} /> : <ArrowUp size={18} />}</button>
                        </form>
                    )}
                    <footer className="chat-panel-footer"><a href="tel:07412671467"><Phone size={13} /> 07412 671467</a><span>Private journey support</span></footer>
                </section>
            )}
            <button type="button" className={`chat-launcher ${open ? "is-open" : ""}`} onClick={() => onOpenChange(!open)} aria-expanded={open} aria-label={open ? "Close chat" : "Open chat support"}>
                {open ? <X size={23} /> : <><MessageCircle size={22} /><span>Chat with us</span><i /></>}
            </button>
        </div>
    );
}

export { ChatWidget };
