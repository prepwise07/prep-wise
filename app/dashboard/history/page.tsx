"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../../lib/supabase-browser";
import { User } from "@supabase/supabase-js";

type InterviewHistory = {
    id: string;
    date: string;
    role: string;
    skills: string[];
    score: number;
    feedback: string;
    trend: "up" | "down" | "flat";
};

// Dummy local data to showcase "improvement" graph concept
const mockHistoryData: InterviewHistory[] = [
    { id: "h1", date: "Today", role: "Frontend Dev (Custom)", skills: ["React", "State Management"], score: 85, feedback: "Excellent explanation of hooks. Struggled slightly on strict DOM rendering.", trend: "up" },
    { id: "h2", date: "Yesterday", role: "Software Engineer", skills: ["DSA", "System Design"], score: 72, feedback: "Very solid problem-solving skills but edge case handling was rushed.", trend: "up" },
    { id: "h3", date: "Oct 24", role: "Backend Engineer", skills: ["Node.js", "SQL"], score: 65, feedback: "Good core knowledge. Needs improvement on advanced DB query optimization.", trend: "flat" },
    { id: "h4", date: "Oct 18", role: "General Tech", skills: ["Soft Skills", "Communication"], score: 60, feedback: "Lacked eye contact and seemed hesitant on technical definitions.", trend: "flat" }
];

export default function HistoryPage() {
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();
    const [user, setUser] = useState<User | null>(null);
    const [mounted, setMounted] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/sign-in");
            } else {
                setUser(session.user);
            }
        };
        checkAuth();
    }, [router]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/sign-in");
    };

    if (!mounted || !user) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 rounded-full border-t-2 border-[var(--primary)] animate-spin"></div></div>;

    const userInitial = user.user_metadata?.full_name?.[0] || user.email?.[0] || "U";

    return (
        <div className="min-h-screen relative overflow-x-hidden flex flex-col bg-[#0a0514]">
            <div className="ambient-background" />
            <div className="grid-crosses opacity-50" />

            {/* Navbar (Sticky) */}
            <nav className="relative z-50 border-b border-white/5 backdrop-blur-md bg-black/70 sticky top-0">
                <div className="max-w-[100rem] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Hamburger Menu for Mobile */}
                        <button
                            className="lg:hidden text-white/70 hover:text-white p-2 -ml-2 rounded-lg hover:bg-white/5 transition-colors"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            {isSidebarOpen ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
                            )}
                        </button>

                        <Link href="/dashboard" className="flex items-center gap-2.5 group">
                            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="shrink-0 group-hover:scale-110 transition-transform">
                                <circle cx="16" cy="16" r="14" stroke="#e8985a" strokeWidth="2.5" fill="none" />
                                <circle cx="12" cy="16" r="3" fill="#e8985a" />
                                <path d="M18 13 C22 13 22 19 18 19" stroke="#e8985a" strokeWidth="2.5" strokeLinecap="round" />
                                <path d="M20 11 C25 11 25 21 20 21" stroke="#e8985a" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                            </svg>
                            <span className="font-bold text-lg hidden sm:block tracking-tight text-white/90">PrepWise</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6">
                        <Link href="/interview" className="hidden lg:inline-flex px-5 py-2 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 hover:bg-[var(--primary)]/20 transition-all text-sm font-bold shadow-[0_0_15px_rgba(200,162,255,0.15)] hover:shadow-[0_0_25px_rgba(200,162,255,0.3)]">
                            Launch Session →
                        </Link>

                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 flex items-center justify-center font-bold text-sm sm:text-base rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)] shadow-[0_0_15px_rgba(200,162,255,0.2)]">
                                {userInitial.toUpperCase()}
                            </div>
                            <div className="hidden md:block text-sm">
                                <p className="font-semibold text-white/90 truncate max-w-[120px]">{user.user_metadata?.full_name || "Candidate"}</p>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="ml-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5"
                                title="Log Out"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                                <span className="hidden sm:inline">Log Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Application Layout Wrap */}
            <div className="flex flex-1 relative z-10 max-w-[100rem] mx-auto w-full">

                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Left Sidebar */}
                <aside className={`fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-[260px] bg-[#0a0514]/95 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none border-r border-white/5 z-40 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} p-6 overflow-y-auto flex flex-col gap-8`}>

                    {/* Mobile Only Quick Action */}
                    <div className="lg:hidden mt-2">
                        <Link onClick={() => setIsSidebarOpen(false)} href="/interview" className="w-full flex items-center justify-center py-3.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-black font-extrabold shadow-[0_0_20px_rgba(200,162,255,0.3)]">
                            Start New Session
                        </Link>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Nav Menu</p>
                        <nav className="space-y-2">
                            <Link onClick={() => setIsSidebarOpen(false)} href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all font-medium">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                                Overview
                            </Link>
                            <Link onClick={() => setIsSidebarOpen(false)} href="/dashboard/history" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 text-[var(--primary)] font-bold border border-white/5 shadow-inner transition-colors">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                                History logs
                            </Link>
                            <Link onClick={() => setIsSidebarOpen(false)} href="/interview" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all font-medium hidden lg:flex">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                Workspace
                            </Link>
                        </nav>
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/5 pb-4 lg:pb-0">
                        <div className="flex items-center justify-center gap-2 text-xs text-white/30 font-medium tracking-wide">
                            <span>🟢</span> Core system stable
                        </div>
                    </div>
                </aside>

                {/* Main Right Content Pane */}
                <main className="flex-1 w-full max-w-full px-4 sm:px-8 py-6 md:py-10 space-y-8 md:space-y-12 overflow-x-hidden min-w-0">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">Improvements Tracker</h1>
                            <p className="text-white/50 text-sm sm:text-base max-w-xl leading-relaxed">Review past interview outcomes, track growth across advanced sessions, and instantly identify the exact vector paths requiring optimization.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                        <div className="glass-card p-5 sm:p-6 border-white/5 text-center shadow-[0_4px_30px_rgba(200,162,255,0.05)] flex flex-col justify-center">
                            <p className="text-white/40 text-xs sm:text-sm font-bold uppercase tracking-widest mb-1 sm:mb-2">Total Mock Sessions</p>
                            <p className="text-3xl sm:text-4xl font-black text-white">{mockHistoryData.length}</p>
                        </div>
                        <div className="glass-card p-5 sm:p-6 border-[var(--primary)]/20 text-center shadow-[0_0_30px_rgba(200,162,255,0.1)] relative overflow-hidden flex flex-col justify-center">
                            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-[var(--primary)]/20 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none"></div>
                            <p className="text-white/40 text-xs sm:text-sm font-bold uppercase tracking-widest mb-1 sm:mb-2">Overall Growth Indicator</p>
                            <p className="text-3xl sm:text-4xl font-black text-green-400 flex items-center justify-center gap-1.5 sm:gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
                                +25%
                            </p>
                        </div>
                        <div className="glass-card p-5 sm:p-6 border-[var(--accent)]/20 text-center shadow-[0_0_30px_rgba(0,255,255,0.05)] flex flex-col justify-center">
                            <p className="text-white/40 text-xs sm:text-sm font-bold uppercase tracking-widest mb-1 sm:mb-2">Highest Score Output</p>
                            <p className="text-3xl sm:text-4xl font-black text-cyan-400">85<span className="text-lg sm:text-xl text-white/30">/100</span></p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-3">Historical Session Logs</h2>
                        {mockHistoryData.map((session, i) => (
                            <div key={session.id} className="relative glass-card p-5 sm:p-6 border border-white/5 hover:border-[var(--primary)]/30 transition-colors group">
                                <div className="flex flex-col lg:flex-row justify-between gap-5 sm:gap-6">
                                    <div className="space-y-3 flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                            <span className="px-2.5 sm:px-3 py-1 rounded bg-white/5 text-white/60 text-[10px] sm:text-xs font-mono font-bold uppercase">{session.date}</span>
                                            {session.trend === "up" && (
                                                <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
                                                    IMPROVED
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-lg sm:text-xl font-bold text-white break-words">{session.role}</h3>
                                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                            {session.skills.map(s => (
                                                <span key={s} className="px-2 py-1 rounded border border-white/10 bg-black/50 text-[10px] sm:text-xs text-white/40 break-words">{s}</span>
                                            ))}
                                        </div>
                                        <p className="text-xs sm:text-sm text-white/50 border-l-2 border-[var(--primary)]/30 pl-2 sm:pl-3 w-full break-words leading-relaxed pt-1">
                                            "{session.feedback}"
                                        </p>
                                    </div>
                                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between text-right shrink-0 mt-2 lg:mt-0 pt-4 lg:pt-0 border-t border-white/5 lg:border-t-0">
                                        <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[var(--primary)] to-cyan-400">
                                            {session.score}
                                        </div>
                                        <button className="text-[10px] sm:text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1 group-hover:drop-shadow-[0_0_10px_rgba(200,162,255,0.8)] transition-all">
                                            Review Transcripts →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </main>
            </div>
        </div>
    );
}
