"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";
import Logo from "@/components/Logo";
import { Loader2 } from "lucide-react";

export default function SignUpPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isOAuthLoading, setIsOAuthLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg("");
        setSuccessMsg("");

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                },
            },
        });

        setIsLoading(false);

        if (error) {
            setErrorMsg(error.message);
            return;
        }

        // Supabase sends a confirmation email by default
        if (data.user && data.user.identities && data.user.identities.length === 0) {
            setErrorMsg("This email is already registered. Please sign in.");
            return;
        }

        setSuccessMsg("Success! Please check your email inbox (and spam folder) to confirm your account.");
    };

    const handleGoogleSignUp = async () => {
        setIsOAuthLoading(true);
        setErrorMsg("");

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setErrorMsg(error.message);
            setIsOAuthLoading(false);
        }
    };

    const handleGithubSignUp = async () => {
        setIsOAuthLoading(true);
        setErrorMsg("");

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "github",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setErrorMsg(error.message);
            setIsOAuthLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative bg-[#0a0514]">
            <div className="ambient-background" />
            <div className="particles-overlay" />
            <div className="grid-background" />
            <div className="grid-crosses" />

            <div className="auth-container">
                <div className={`auth-card w-full max-w-md mx-4 p-10 py-12 relative z-10 animate-scale-in ${(isOAuthLoading || isLoading) ? 'flipping' : ''}`}>
                    {/* Logo inside card */}
                    <div className="flex flex-col items-center justify-center mb-10">
                        <Logo className="h-14 mb-4" />
                        <h2 className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Create Account</h2>
                        <p className="text-sm text-white/40 mt-1">Start your AI interview journey</p>
                    </div>

                    <div className="flex flex-col gap-4 pb-2">
                        <button
                            onClick={handleGoogleSignUp}
                            disabled={isOAuthLoading}
                            className="btn-google w-full flex items-center justify-center gap-3 active:scale-95 transition-transform"
                        >
                            {isOAuthLoading ? (
                                <Loader2 className="animate-spin w-5 h-5" />
                            ) : (
                                <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    <span className="font-semibold text-white/90">Sign up with Google</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleGithubSignUp}
                            disabled={isOAuthLoading}
                            className="btn-github w-full flex items-center justify-center gap-3 active:scale-95 transition-transform"
                        >
                            {isOAuthLoading ? (
                                <Loader2 className="animate-spin w-5 h-5" />
                            ) : (
                                <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 1.27a11 11 0 00-3.48 21.46c.55.09.73-.24.73-.53v-1.84c-3.03.66-3.67-1.46-3.67-1.46-.5-1.27-1.22-1.6-1.22-1.6-1-.68.07-.66.07-.66 1.1.08 1.68 1.14 1.68 1.14.98 1.68 2.58 1.2 3.2.92.1-.7.38-1.2.69-1.48-2.42-.28-4.97-1.21-4.97-5.39 0-1.19.43-2.16 1.13-2.93-.11-.27-.49-1.38.11-2.89 0 0 .91-.29 3 1.12a10.33 10.33 0 015.5 0c2.09-1.41 3-1.12 3-1.12.6 1.51.22 2.62.11 2.89.7.77 1.13 1.74 1.13 2.93 0 4.2-2.55 5.1-4.98 5.37.39.33.73.99.73 1.99v2.96c0 .3.18.63.74.52A11 11 0 0012 1.27z" />
                                    </svg>
                                    <span className="font-semibold">Sign up with GitHub</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="auth-divider">
                        <span>OR</span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Full Name</label>
                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input-field py-4"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Email Address</label>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field py-4"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Password</label>
                            <input
                                type="password"
                                placeholder="Create a password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field py-4"
                                required
                            />
                        </div>

                        {errorMsg && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-2xl font-semibold animate-shake">
                                {errorMsg}
                            </div>
                        )}

                        {successMsg && (
                            <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-2xl font-semibold">
                                {successMsg}
                            </div>
                        )}

                        <button type="submit" disabled={isLoading} className="btn-primary-purple w-full py-4 mt-2 flex justify-center items-center gap-2">
                            {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Kickstart My Journey"}
                        </button>
                    </form>

                    <p className="text-center text-sm text-white/40 mt-10">
                        Already registered?{" "}
                        <Link href="/sign-in" className="text-[var(--primary)] font-bold hover:underline underline-offset-4 transition-all">
                            Sign In here →
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
