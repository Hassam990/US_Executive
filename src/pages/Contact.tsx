import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

export function Contact() {
    return (
        <main className="min-h-screen bg-[#160008] pt-32 pb-24 relative overflow-hidden">
            {/* Background */}
            <div className="absolute top-[10%] right-[-10%] w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[150px] pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
                        Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-pink-500">Touch</span>
                    </h1>
                    <p className="text-xl text-white/70 font-light leading-relaxed">
                        We are here to assist you 24 hours a day, 7 days a week. Whether you have a special request, need to open a corporate account, or wish to apply as a driver.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                    {/* Contact Info */}
                    <div className="space-y-6">
                        <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                            <CardContent className="p-8 flex items-start gap-6">
                                <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                                    <Phone className="w-6 h-6 text-pink-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Call Us</h3>
                                    <p className="text-white/60 mb-2">Available 24/7 for instant bookings and support.</p>
                                    <a href="tel:07412671467" className="text-2xl font-bold text-pink-300 hover:text-pink-200 transition-colors">07412671467</a>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                            <CardContent className="p-8 flex items-start gap-6">
                                <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-6 h-6 text-pink-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Email Us</h3>
                                    <p className="text-white/60 mb-2">For quotes, corporate accounts, and inquiries.</p>
                                    <a href="mailto:hello@us-executivetravel.com" className="text-lg font-bold text-pink-300 hover:text-pink-200 transition-colors">hello@us-executivetravel.com</a>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                            <CardContent className="p-8 flex items-start gap-6">
                                <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-6 h-6 text-pink-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Operating Hours</h3>
                                    <p className="text-white/60">Our dispatch and chauffeur teams operate 24 hours a day, 365 days a year to serve you.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Contact Form */}
                    <Card className="bg-white/5 border-white/10 backdrop-blur-xl relative overflow-hidden h-full">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-pink-300" />
                        <CardContent className="p-8 md:p-10 flex flex-col h-full">
                            <h3 className="text-3xl font-bold text-white mb-2">Send a Message</h3>
                            <p className="text-white/60 mb-8">Fill out the form below and our team will get back to you promptly.</p>

                            <form className="space-y-6 flex-grow flex flex-col">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-white/80">Full Name</Label>
                                        <Input placeholder="John Doe" className="bg-black/40 border-white/10 text-white h-12 focus-visible:ring-pink-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-white/80">Phone Number</Label>
                                        <Input placeholder="+44 7000 000000" className="bg-black/40 border-white/10 text-white h-12 focus-visible:ring-pink-500" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-white/80">Email Address</Label>
                                    <Input type="email" placeholder="john@example.com" className="bg-black/40 border-white/10 text-white h-12 focus-visible:ring-pink-500" />
                                </div>

                                <div className="space-y-2 flex-grow flex flex-col">
                                    <Label className="text-white/80">Message or Inquiry</Label>
                                    <textarea
                                        placeholder="How can we help you?"
                                        className="w-full flex-grow min-h-[120px] p-4 bg-black/40 border border-white/10 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                                    ></textarea>
                                </div>

                                <Button className="w-full h-12 bg-pink-600 hover:bg-pink-500 text-white font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all mt-auto">
                                    Send Message
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}
