"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";
import { Loader2 } from "lucide-react";

export default function SignInPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg("");

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        setIsLoading(false);

        if (error) {
            setErrorMsg(error.message);
            return;
        }

        if (data.session) {
            router.push("/dashboard");
        }
    };

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);
        setErrorMsg("");

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setErrorMsg(error.message);
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative">
            <div className="grid-background" />
            <div className="grid-crosses" />

            <div className="auth-card w-full max-w-md mx-4 p-10 relative z-10 animate-scale-in">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2.5 mb-3">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="14" stroke="#e8985a" strokeWidth="2.5" fill="none" />
                        <circle cx="12" cy="16" r="3" fill="#e8985a" />
                        <path d="M18 13 C22 13 22 19 18 19" stroke="#e8985a" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M20 11 C25 11 25 21 20 21" stroke="#e8985a" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                    </svg>
                    <span className="text-xl font-bold tracking-tight">PrepWise</span>
                </div>

                <p className="text-center text-lg font-semibold mb-8 text-white/80">
                    Practice job interviews with AI
                </p>

                {/* Google Sign In */}
                <button
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                    className="btn-google w-full flex items-center justify-center gap-3"
                >
                    {isGoogleLoading ? (
                        <Loader2 className="animate-spin w-5 h-5" />
                    ) : (
                        <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </>
                    )}
                </button>

                {/* Divider */}
                <div className="auth-divider">
                    <span>or</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">Email</label>
                        <input
                            type="email"
                            placeholder="Your email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-field"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                            required
                        />
                    </div>

                    {errorMsg && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl font-medium">
                            {errorMsg}
                        </div>
                    )}

                    <button type="submit" disabled={isLoading} className="btn-primary w-full mt-2 flex justify-center items-center gap-2">
                        {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Sign In"}
                    </button>
                </form>

                <p className="text-center text-sm text-white/50 mt-6">
                    No account yet?{" "}
                    <Link href="/sign-up" className="text-white font-semibold hover:text-[var(--primary)] transition-colors">
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
}
