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

    if (!mounted || !user) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 rounded-full border-t-2 border-[var(--primary)] animate-spin"></div></div>;

    return (
        <div className="min-h-screen relative overflow-x-hidden">
            <div className="ambient-background" />
            <div className="grid-crosses opacity-50" />

            {/* Navbar */}
            <nav className="relative z-10 border-b border-white/5 backdrop-blur-md bg-black/50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2.5">
                        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                            <circle cx="16" cy="16" r="14" stroke="#e8985a" strokeWidth="2.5" fill="none" />
                            <circle cx="12" cy="16" r="3" fill="#e8985a" />
                            <path d="M18 13 C22 13 22 19 18 19" stroke="#e8985a" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M20 11 C25 11 25 21 20 21" stroke="#e8985a" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                        </svg>
                        <span className="font-bold text-lg text-white">PrepWise</span>
                    </Link>
                    <div className="flex gap-6 items-center">
                        <Link href="/dashboard" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Overview</Link>
                        <Link href="/dashboard/history" className="text-sm font-bold text-[var(--primary)] drop-shadow-[0_0_10px_rgba(200,162,255,0.4)] border-b-2 border-[var(--primary)] pb-1">Performance History</Link>
                        <Link href="/interview" className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-medium hidden sm:block">New Interview</Link>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 max-w-5xl mx-auto px-6 py-10 space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight mb-2">My Improvements Tracker</h1>
                        <p className="text-white/50 text-base max-w-xl">Review past interview scores, track growth across sessions, and instantly identify the skill vectors requiring the most attention.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="glass-card p-6 border-white/5 text-center shadow-[0_4px_30px_rgba(200,162,255,0.05)]">
                        <p className="text-white/40 text-sm font-bold uppercase tracking-widest mb-2">Total Mock Sessions</p>
                        <p className="text-4xl font-black text-white">{mockHistoryData.length}</p>
                    </div>
                    <div className="glass-card p-6 border-[var(--primary)]/20 text-center shadow-[0_0_30px_rgba(200,162,255,0.1)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/20 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none"></div>
                        <p className="text-white/40 text-sm font-bold uppercase tracking-widest mb-2">Overall Growth</p>
                        <p className="text-4xl font-black text-green-400 flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
                            +25%
                        </p>
                    </div>
                    <div className="glass-card p-6 border-[var(--accent)]/20 text-center shadow-[0_0_30px_rgba(0,255,255,0.05)]">
                        <p className="text-white/40 text-sm font-bold uppercase tracking-widest mb-2">Highest Score</p>
                        <p className="text-4xl font-black text-cyan-400">85<span className="text-xl text-white/30">/100</span></p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight mb-4">Detailed Session Log</h2>
                    {mockHistoryData.map((session, i) => (
                        <div key={session.id} className="relative glass-card p-6 border border-white/5 hover:border-[var(--primary)]/30 transition-colors group">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 rounded bg-white/5 text-white/60 text-xs font-mono font-bold uppercase">{session.date}</span>
                                        {session.trend === "up" && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
                                                IMPROVED
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-white">{session.role}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {session.skills.map(s => (
                                            <span key={s} className="px-2 py-1 rounded border border-white/10 bg-black/50 text-xs text-white/40">{s}</span>
                                        ))}
                                    </div>
                                    <p className="text-sm text-white/50 border-l-2 border-[var(--primary)]/30 pl-3 leading-relaxed">"{session.feedback}"</p>
                                </div>
                                <div className="flex flex-col items-end justify-between text-right shrink-0 min-w-[120px]">
                                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[var(--primary)] to-cyan-400">
                                        {session.score}
                                    </div>
                                    <button className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1 group-hover:drop-shadow-[0_0_10px_rgba(200,162,255,0.8)] transition-all">
                                        Review Transcripts →
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </main>
        </div>
    );
}
