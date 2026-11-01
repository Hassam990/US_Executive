import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Show, useUser } from "@clerk/react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { Services } from "./pages/Services";
import { Fleet } from "./pages/Fleet";
import { Contact } from "./pages/Contact";
import { Admin } from "./pages/Admin";
import { Dashboard } from "./pages/Dashboard";
import { DriverApply } from "./pages/DriverApply";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import Book from "./pages/Book";

function usePageTracking() {
    useEffect(() => {
        fetch("/api/track-visit", { method: "POST" }).catch(() => {});
    }, []);
}

function PublicLayout({ children }: { children: React.ReactNode }) {
    usePageTracking();
    return (
        <div className="min-h-screen bg-black font-sans antialiased text-white selection:bg-pink-500/30 flex flex-col">
            <Header />
            <div className="flex-grow">{children}</div>
            <Footer />
        </div>
    );
}

// Redirect signed-in users away from /login and /signup
function GuestRoute({ children }: { children: React.ReactNode }) {
    const { isSignedIn, isLoaded } = useUser();
    if (!isLoaded) return null;
    if (isSignedIn) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
}

// Require sign-in — uses Clerk v6 <Show> component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Show when="signed-in">{children}</Show>
            <Show when="signed-out"><Navigate to="/login" replace /></Show>
        </>
    );
}

function ScrollManager() {
    const { pathname, hash } = useLocation();

    useEffect(() => {
        const frame = window.requestAnimationFrame(() => {
            if (hash) {
                document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
            } else {
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        });

        return () => window.cancelAnimationFrame(frame);
    }, [pathname, hash]);

    return null;
}

function App() {
    return (
        <>
            <ScrollManager />
            <Routes>
                {/* Public */}
                <Route path="/"         element={<PublicLayout><Home /></PublicLayout>} />
                <Route path="/services" element={<PublicLayout><Services /></PublicLayout>} />
                <Route path="/fleet"    element={<PublicLayout><Fleet /></PublicLayout>} />
                <Route path="/contact"  element={<PublicLayout><Contact /></PublicLayout>} />
                <Route path="/book"     element={<PublicLayout><Book /></PublicLayout>} />
                <Route path="/apply"    element={<PublicLayout><DriverApply /></PublicLayout>} />

                {/* Auth — redirect to dashboard if already signed in */}
                <Route path="/login"  element={<GuestRoute><Login /></GuestRoute>} />
                <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />

                {/* Protected user dashboard */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

                {/* Admin */}
                <Route path="/admin" element={<Admin />} />
            </Routes>
        </>
    );
}

export default App;
