import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Show, useUser } from "@clerk/react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ChatWidgetProvider } from "./components/chat/ChatContext";

const Home = lazy(() => import("./pages/Home").then((module) => ({ default: module.Home })));
const Services = lazy(() => import("./pages/Services").then((module) => ({ default: module.Services })));
const Fleet = lazy(() => import("./pages/Fleet").then((module) => ({ default: module.Fleet })));
const Drivers = lazy(() => import("./pages/Drivers").then((module) => ({ default: module.Drivers })));
const Contact = lazy(() => import("./pages/Contact").then((module) => ({ default: module.Contact })));
const Admin = lazy(() => import("./pages/Admin").then((module) => ({ default: module.Admin })));
const Dashboard = lazy(() => import("./pages/Dashboard").then((module) => ({ default: module.Dashboard })));
const DriverApply = lazy(() => import("./pages/DriverApply").then((module) => ({ default: module.DriverApply })));
const PrivacyNotice = lazy(() => import("./pages/PrivacyNotice").then((module) => ({ default: module.PrivacyNotice })));
const Login = lazy(() => import("./pages/Login").then((module) => ({ default: module.Login })));
const Signup = lazy(() => import("./pages/Signup").then((module) => ({ default: module.Signup })));
const Book = lazy(() => import("./pages/Book"));

function usePageTracking() {
    useEffect(() => {
        fetch("/api/track-visit", { method: "POST" }).catch(() => {});
    }, []);
}

function PublicLayout({ children }: { children: React.ReactNode }) {
    usePageTracking();
    return (
        <ChatWidgetProvider>
            <div className="site-shell min-h-screen flex flex-col">
                <Header />
                <div className="flex-grow">{children}</div>
                <Footer />
            </div>
        </ChatWidgetProvider>
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
            <Suspense fallback={<div className="page-loading" role="status">Loading your page…</div>}>
                <Routes>
                    {/* Public */}
                    <Route path="/"         element={<PublicLayout><Home /></PublicLayout>} />
                    <Route path="/services" element={<PublicLayout><Services /></PublicLayout>} />
                    <Route path="/fleet"    element={<PublicLayout><Fleet /></PublicLayout>} />
                    <Route path="/drivers"  element={<PublicLayout><Drivers /></PublicLayout>} />
                    <Route path="/contact"  element={<PublicLayout><Contact /></PublicLayout>} />
                    <Route path="/book"     element={<PublicLayout><Book /></PublicLayout>} />
                    <Route path="/apply"    element={<PublicLayout><DriverApply /></PublicLayout>} />
                    <Route path="/privacy-notice" element={<PublicLayout><PrivacyNotice /></PublicLayout>} />

                    {/* Auth — redirect to dashboard if already signed in */}
                    <Route path="/login"  element={<GuestRoute><Login /></GuestRoute>} />
                    <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />

                    {/* Protected user dashboard */}
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

                    {/* Admin */}
                    <Route path="/admin" element={<Admin />} />
                </Routes>
            </Suspense>
        </>
    );
}

export default App;
