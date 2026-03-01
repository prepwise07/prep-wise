"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";
import { User } from "@supabase/supabase-js";

type Interview = {
    id: string;
    type: string;
    role: string;
    date: string;
    score: number | null;
    status: "completed" | "in-progress" | "available";
};

const mockInterviews: Interview[] = [
    { id: "1", type: "Technical", role: "Frontend Developer", date: "Oct 24, 2023", score: 85, status: "completed" },
    { id: "2", type: "System Design", role: "Backend Engineer", date: "Oct 20, 2023", score: 72, status: "completed" }
];

const availableCourses = [
    { id: "c1", title: "SQL Mastery", category: "Database", difficulty: "Medium", icon: "🗄️" },
    { id: "c2", title: "Basic Java", category: "Language", difficulty: "Easy", icon: "☕" },
    { id: "c3", title: "Advance Java", category: "Language", difficulty: "Hard", icon: "🚀" },
    { id: "c4", title: "Python Core", category: "Language", difficulty: "Medium", icon: "🐍" },
    { id: "c5", title: "Java Full Stack", category: "Full Stack", difficulty: "Hard", icon: "🌐" },
    { id: "c6", title: "C Programming", category: "Systems", difficulty: "Medium", icon: "⚙️" },
    { id: "c7", title: "C++ Systems", category: "Systems", difficulty: "Hard", icon: "⚡" },
    { id: "c8", title: "Gen. Communication", category: "Soft Skills", difficulty: "Easy", icon: "🗣️" },
    { id: "c9", title: "Self Introduction", category: "Soft Skills", difficulty: "Easy", icon: "👋" },
];

export default function DashboardPage() {
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();
    const [user, setUser] = useState<User | null>(null);
    const [pastInterviews, setPastInterviews] = useState<Interview[]>(mockInterviews);

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

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/sign-in");
    };

    const difficultyColor = (d: string) => {
        if (d === "Easy") return "text-green-400 bg-green-400/10 border-green-400/20";
        if (d === "Medium") return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
        return "text-red-400 bg-red-400/10 border-red-400/20";
    };

    if (!mounted || !user) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 rounded-full border-t-2 border-[var(--primary)] animate-spin"></div></div>;

    const userInitial = user.user_metadata?.full_name?.[0] || user.email?.[0] || "U";

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
                        <span className="font-bold text-lg">PrepWise</span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard" className="hidden sm:block text-sm font-bold text-[var(--primary)] drop-shadow-[0_0_10px_rgba(200,162,255,0.4)] border-b-2 border-[var(--primary)] pb-1">Overview</Link>
                        <Link href="/dashboard/history" className="hidden sm:block text-sm font-medium text-white/60 hover:text-white transition-colors">Performance History</Link>
                        <Link href="/interview" className="hidden sm:block px-5 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-medium ml-4">New Session→</Link>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 flex items-center justify-center font-bold text-lg rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/20 text-[var(--primary)] shadow-[0_0_15px_rgba(200,162,255,0.2)]">
                                {userInitial.toUpperCase()}
                            </div>
                            <div className="hidden md:block text-sm">
                                <p className="font-semibold text-white truncate max-w-[120px]">{user.user_metadata?.full_name || "Candidate"}</p>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="ml-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-sm font-bold transition-all shadow-sm flex items-center gap-2"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 space-y-12">

                {/* Hero Banner */}
                <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#1a0b2e] to-[#0a0514] p-10 md:p-14 flex flex-col md:flex-row items-center gap-10 shadow-[0_0_80px_rgba(200,162,255,0.05)]">
                    {/* Ambient light inside banner */}
                    <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[var(--primary)]/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
                    <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[var(--accent)]/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>

                    <div className="flex-1 space-y-6 relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-semibold border border-[var(--primary)]/20 shadow-[0_0_15px_rgba(200,162,255,0.1)]">
                            <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse"></span>
                            System Online
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
                            Elevate Your <br />
                            <span className="bg-gradient-to-r from-[var(--primary)] to-cyan-400 bg-clip-text text-transparent">Interview Mastery</span>
                        </h1>
                        <p className="text-white/60 text-lg max-w-md leading-relaxed">
                            Engage with our elite AI engine in real-time. Upload your resume and practice technical simulations tailored exactly to your skill vector.
                        </p>
                        <div className="pt-2">
                            <Link href="/interview" className="group relative inline-flex px-8 py-3.5 bg-white text-black font-extrabold text-base rounded-full overflow-hidden transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <span className="relative z-10 flex items-center gap-2">
                                    Initialize Simulation
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                </span>
                            </Link>
                        </div>
                    </div>

                    <div className="w-full md:w-[420px] flex-shrink-0 animate-float relative z-10">
                        <Image
                            src="/robot-hero.png"
                            alt="AI Interview Robot"
                            width={420}
                            height={360}
                            className="w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                            priority
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Recent Performance */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-2xl font-bold tracking-tight">Last Interview Performance</h2>

                        {pastInterviews.length > 0 ? (
                            <div className="glass-card p-8 border border-[var(--primary)]/30 relative overflow-hidden group hover:border-[var(--primary)]/60 transition-all duration-500 shadow-[0_10px_40px_rgba(200,162,255,0.05)]">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none group-hover:bg-[var(--primary)]/20 transition-all duration-700"></div>

                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-xs font-bold px-2.5 py-1 rounded bg-[var(--primary)]/20 text-[var(--primary)] uppercase tracking-wider">
                                                {pastInterviews[0].type}
                                            </span>
                                            <span className="text-white/40 text-sm font-mono">{pastInterviews[0].date}</span>
                                        </div>
                                        <h3 className="text-3xl font-extrabold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent mb-1">
                                            {pastInterviews[0].role}
                                        </h3>
                                        <p className="text-white/50 text-base">Your most recent technical gauntlet evaluation.</p>
                                    </div>

                                    <div className="flex items-center gap-5">
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-white/40 uppercase tracking-widest mb-1">Score</p>
                                            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[var(--primary)] to-cyan-400 drop-shadow-[0_0_15px_rgba(200,162,255,0.3)]">
                                                {pastInterviews[0].score}/100
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10 relative z-10">
                                    <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                                        <p className="text-white/40 text-xs font-bold uppercase mb-1">Clarity</p>
                                        <p className="text-[var(--primary)] font-bold text-lg">92%</p>
                                    </div>
                                    <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                                        <p className="text-white/40 text-xs font-bold uppercase mb-1">Accuracy</p>
                                        <p className="text-cyan-400 font-bold text-lg">85%</p>
                                    </div>
                                    <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                                        <p className="text-white/40 text-xs font-bold uppercase mb-1">Tone</p>
                                        <p className="text-[var(--accent)] font-bold text-lg">Professional</p>
                                    </div>
                                    <div onClick={() => router.push("/dashboard/history")} className="bg-black/30 p-4 rounded-xl border border-[var(--primary)]/20 hover:bg-[var(--primary)]/10 transition-colors cursor-pointer flex items-center justify-center flex-col text-center shadow-[0_0_20px_rgba(200,162,255,0.1)] group/btn">
                                        <p className="text-white font-bold text-sm group-hover/btn:scale-105 transition-transform">View Full History</p>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--primary)] mt-1 group-hover/btn:translate-x-1 transition-transform"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="glass-card p-10 flex flex-col items-center justify-center text-center border-white/10">
                                <p className="text-white/50 mb-4">No past interview data found.</p>
                            </div>
                        )}

                        <div onClick={() => router.push("/interview")} className="w-full relative group overflow-hidden rounded-2xl p-[1px]">
                            <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-cyan-400 opacity-30 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative bg-[#0a0514] px-6 py-5 rounded-2xl flex items-center justify-between cursor-pointer border border-white/10 group-hover:bg-transparent transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Start a New Custom Session</h3>
                                        <p className="text-white/50 text-sm">Upload resume or select a specialized topic</p>
                                    </div>
                                </div>
                                <span className="text-[var(--primary)] font-bold opacity-0 group-hover:opacity-100 group-hover:-translate-x-2 transition-all">Go →</span>
                            </div>
                        </div>
                    </div>

                    {/* Skill Radar / Stats Box */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold tracking-tight">Skill Matrix</h2>
                        <div className="glass-card p-8 h-[calc(100%-3rem)] flex flex-col items-center justify-center relative overflow-hidden border-white/5">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--primary)]/5"></div>

                            {/* Faux Radar Chart */}
                            <div className="relative w-48 h-48 mb-6">
                                {/* Hexagon Rings */}
                                <svg viewBox="0 0 200 200" className="w-full h-full opacity-20">
                                    <polygon points="100,10 180,50 180,150 100,190 20,150 20,50" fill="none" stroke="white" strokeWidth="1" />
                                    <polygon points="100,40 155,70 155,130 100,160 45,130 45,70" fill="none" stroke="white" strokeWidth="1" />
                                    <polygon points="100,70 125,85 125,115 100,130 75,115 75,85" fill="none" stroke="white" strokeWidth="1" />
                                    {/* Axes */}
                                    <line x1="100" y1="10" x2="100" y2="190" stroke="white" strokeWidth="1" />
                                    <line x1="20" y1="50" x2="180" y2="150" stroke="white" strokeWidth="1" />
                                    <line x1="20" y1="150" x2="180" y2="50" stroke="white" strokeWidth="1" />
                                </svg>
                                {/* Data Polygon */}
                                <svg viewBox="0 0 200 200" className="w-full h-full absolute inset-0">
                                    <polygon points="100,30 150,60 160,140 100,170 50,120 70,60" fill="rgba(200,162,255,0.3)" stroke="var(--primary)" strokeWidth="2" className="animate-pulse" />
                                </svg>

                                {/* Labels */}
                                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-mono text-[var(--primary)]">FRONTEND</span>
                                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-mono text-[var(--primary)]">BACKEND</span>
                                <span className="absolute top-1/4 -right-6 text-[10px] font-mono text-cyan-400">SYSTEM</span>
                                <span className="absolute bottom-1/4 -right-6 text-[10px] font-mono text-cyan-400">DSA</span>
                                <span className="absolute top-1/4 -left-6 text-[10px] font-mono text-[var(--accent)]">PYTHON</span>
                                <span className="absolute bottom-1/4 -left-6 text-[10px] font-mono text-[var(--accent)]">REACT</span>
                            </div>

                            <div className="text-center relative z-10 w-full">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-white/50">Overall Readiness</span>
                                    <span className="text-[var(--primary)] font-bold">78%</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-[var(--primary)] to-cyan-400 w-[78%]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Specialized Modules */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold tracking-tight">Specialized Modules</h2>
                        <Link href="/interview" className="text-sm text-[var(--primary)] hover:underline">View All →</Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {availableCourses.map((course, idx) => (
                            <button
                                key={course.id}
                                onClick={() => router.push("/interview")}
                                className="glass-card p-6 text-left group cursor-pointer border border-white/5 hover:border-[var(--primary)]/50 hover:bg-white-[0.02] transform transition-all hover:-translate-y-1 shadow-lg"
                            >
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform border border-white/10 shadow-inner">
                                    {course.icon}
                                </div>
                                <h3 className="font-bold text-lg mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[var(--primary)] group-hover:to-cyan-400 transition-all">
                                    {course.title}
                                </h3>
                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{course.category}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${difficultyColor(course.difficulty)}`}>
                                        {course.difficulty}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

            </main>
        </div>
    );
}
