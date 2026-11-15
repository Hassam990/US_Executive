import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { Show, useUser } from "@clerk/react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ChatWidgetProvider } from "./components/chat/ChatContext";
import { SeoManager } from "./components/SeoManager";

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

function NotFoundPage() {
    return (
        <main className="min-h-[55vh] flex flex-col items-center justify-center px-6 py-24 text-center text-white">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-pink-400">404 · Page not found</p>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">This journey has taken a wrong turn.</h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/60">The page may have moved, or the address may be mistyped. Head home or plan your journey with our team.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to="/" className="rounded-full bg-pink-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-400">Back to home</Link>
                <Link to="/book" className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Plan a journey</Link>
            </div>
        </main>
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
            <SeoManager />
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

                    {/* Branded fallback for unknown URLs */}
                    <Route path="*" element={<PublicLayout><NotFoundPage /></PublicLayout>} />
                </Routes>
            </Suspense>
        </>
    );
}

export default App;
