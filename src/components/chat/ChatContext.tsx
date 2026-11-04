import { createContext, useContext, useMemo, useState } from "react";
import { ChatWidget } from "./ChatWidget";

export type ChatTarget =
    | { type: "support" }
    | { type: "driver"; driverId: string; driverName: string };

type ChatContextValue = { openChat: (target?: ChatTarget) => void };
const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatWidgetProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [target, setTarget] = useState<ChatTarget>({ type: "support" });
    const value = useMemo(() => ({
        openChat: (nextTarget: ChatTarget = { type: "support" }) => {
            setTarget(nextTarget);
            setOpen(true);
        },
    }), []);

    return (
        <ChatContext.Provider value={value}>
            {children}
            <ChatWidget open={open} target={target} onOpenChange={setOpen} />
        </ChatContext.Provider>
    );
}

export function useChatWidget() {
    const context = useContext(ChatContext);
    if (!context) throw new Error("useChatWidget must be used inside ChatWidgetProvider.");
    return context;
}
