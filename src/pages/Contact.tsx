import { useState } from "react";
import { Mail, Phone, Clock, Loader2 } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

export function Contact() {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        message: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setStatus("success");
                setFormData({ name: "", email: "", phone: "", message: "" });
            } else {
                setStatus("error");
            }
        } catch (error) {
            console.error(error);
            setStatus("error");
        }
    };

    return (
        <main className="site-page contact-page">
            <div className="site-container">
                <header className="page-intro">
                    <p className="eyebrow">Contact</p>
                    <h1>We’re here when you need us.</h1>
                    <p>Speak to our team about an upcoming journey, a corporate account or any special arrangements.</p>
                </header>

                <div className="contact-grid">
                    {/* Contact Info */}
                    <div className="contact-info-list">
                        <Card className="contact-card">
                            <CardContent className="p-8 flex items-start gap-6">
                                <div className="contact-icon">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Call Us</h3>
                                    <p className="text-white/60 mb-2">Available 24/7 for instant bookings and support.</p>
                                    <a href="tel:07412671467" className="contact-detail-link">07412 671467</a>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="contact-card">
                            <CardContent className="p-8 flex items-start gap-6">
                                <div className="contact-icon">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Email Us</h3>
                                    <p className="text-white/60 mb-2">For quotes, corporate accounts, and inquiries.</p>
                                    <a href="mailto:hello@us-executivetravel.com" className="contact-detail-link contact-email">hello@us-executivetravel.com</a>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="contact-card">
                            <CardContent className="p-8 flex items-start gap-6">
                                <div className="contact-icon">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Operating Hours</h3>
                                    <p className="text-white/60">Our dispatch and chauffeur teams operate 24 hours a day, 365 days a year to serve you.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Contact Form */}
                    <Card className="contact-form-card">
                        <CardContent className="p-8 md:p-10 flex flex-col h-full">
                            <h3 className="text-3xl font-bold text-white mb-2">Send a Message</h3>
                            <p className="text-white/60 mb-8">Fill out the form below and our team will get back to you promptly.</p>

                            <form onSubmit={handleSubmit} className="space-y-6 flex-grow flex flex-col">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-white/80">Full Name</Label>
                                        <Input 
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            placeholder="John Doe" 
                                    className="contact-input"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-white/80">Phone Number</Label>
                                        <Input 
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                            placeholder="+44 7000 000000" 
                                    className="contact-input"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-white/80">Email Address</Label>
                                    <Input 
                                        name="email"
                                        type="email" 
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="john@example.com" 
                                    className="contact-input"
                                    />
                                </div>

                                <div className="space-y-2 flex-grow flex flex-col">
                                    <Label className="text-white/80">Message or Inquiry</Label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        placeholder="How can we help you?"
                                        className="contact-input contact-message"
                                    ></textarea>
                                </div>

                                <Button 
                                    type="submit"
                                    disabled={status === "loading"}
                                    className="contact-submit"
                                >
                                    {status === "loading" ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : "Send Message"}
                                </Button>

                                {status === "success" && (
                                    <p className="text-green-400 text-center font-medium mt-2">Message sent successfully!</p>
                                )}
                                {status === "error" && (
                                    <p className="text-red-400 text-center font-medium mt-2">Failed to send message. Please try again.</p>
                                )}
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}
