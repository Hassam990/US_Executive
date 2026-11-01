// @ts-nocheck
import { SignIn } from '@clerk/react'
import { dark } from '@clerk/themes'

export function Login() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-900/10 via-black to-black opacity-80" />

            <div className="relative z-10 flex flex-col items-center gap-6">
                {/* Logo */}
                <img
                    src="/us_executive_logo.png"
                    alt="US Executive Travel"
                    className="h-16 w-auto opacity-90"
                />

                <SignIn
                    routing="hash"
                    appearance={{
                        baseTheme: dark,
                        variables: {
                            colorPrimary: '#ec4899',
                            colorBackground: '#1a000d',
                            borderRadius: '1rem',
                        },
                        elements: {
                            card: 'shadow-[0_20px_60px_rgba(236,72,153,0.15)] border border-white/10',
                            headerTitle: 'text-white font-black uppercase tracking-tight',
                            headerSubtitle: 'text-white/70',
                            socialButtonsBlockButton: 'border border-white/20 bg-white/5 hover:bg-white/10 text-white',
                            socialButtonsBlockButtonText: 'text-white font-bold',
                            dividerLine: 'bg-white/10',
                            dividerText: 'text-white/50',
                            formFieldLabel: 'text-white text-xs font-bold uppercase tracking-widest',
                            formFieldInput: `
                                bg-[#1a000d] border border-white/20 text-white rounded-xl h-12
                                focus:border-pink-500 focus:ring-0
                                placeholder:text-white/40
                            `,
                            formFieldHintText: 'text-white/50',
                            formFieldErrorText: 'text-red-400',
                            formButtonPrimary: 'bg-pink-600 hover:bg-pink-500 text-white font-black uppercase tracking-widest rounded-xl h-12',
                            footerActionLink: 'text-pink-400 hover:text-pink-300 font-bold',
                            footerActionText: 'text-white/60',
                            identityPreviewText: 'text-white',
                            identityPreviewEditButtonIcon: 'text-pink-400',
                            formResendCodeLink: 'text-pink-400 hover:text-pink-300',
                            otpCodeFieldInput: 'text-white border-white/20 bg-[#1a000d]',
                            alternativeMethodsBlockButton: 'text-white/70 hover:text-white border-white/10',
                            alternativeMethodsBlockButtonText: 'text-white/70',
                        },
                    }}
                />
            </div>
        </div>
    )
}
