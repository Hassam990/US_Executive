import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { Services } from "./pages/Services";
import { Fleet } from "./pages/Fleet";
import { Contact } from "./pages/Contact";
import { Admin } from "./pages/Admin";
import { DriverApply } from "./pages/DriverApply";
import { Login } from "./pages/Login";

// Tracking Hook
function usePageTracking() {
  useEffect(() => {
    fetch("/api/track-visit", { method: "POST" })
      .catch(() => console.warn("Analytics ping failed"));
  }, []);
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  usePageTracking();
  return (
    <div className="min-h-screen bg-black font-sans antialiased text-white selection:bg-pink-500/30 flex flex-col">
      <Header />
      <div className="flex-grow">
        {children}
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
      <Route path="/services" element={<PublicLayout><Services /></PublicLayout>} />
      <Route path="/fleet" element={<PublicLayout><Fleet /></PublicLayout>} />
      <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />

      {/* Admin Route - Isolated from public layout components */}
      <Route path="/admin" element={<Admin />} />
      <Route path="/apply" element={<PublicLayout><DriverApply /></PublicLayout>} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

export default App;
