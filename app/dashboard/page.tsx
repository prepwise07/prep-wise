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

const faqs = [
    { q: "How does the AI grading work?", a: "The PrepWise AI evaluates your answers based on technical accuracy, clarity, and communication skills derived directly from our custom LLM integration." },
    { q: "Can I test custom concepts?", a: "Yes! Enter any exact topic in the 'Specific Concepts' box before starting your session (e.g. 'React Hooks')." },
    { q: "Are past interviews saved?", a: "Absolutely. All your historical sessions and scores are automatically saved to your Performance History tracking page." },
];

const developers = [
    { name: "Fahad Shajahan", role: "Lead Engineer", icon: "👨‍💻", desc: "Built the PrepWise Core Infrastructure and Next.js Architecture." },
    { name: "PrepWise AI Model", role: "Virtual Interviewer", icon: "🤖", desc: "Advanced language processing ensuring realistic voice simulations." }
];

export default function DashboardPage() {
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();
    const [user, setUser] = useState<User | null>(null);
    const [pastInterviews, setPastInterviews] = useState<Interview[]>(mockInterviews);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
        <div className="min-h-screen relative overflow-x-hidden flex flex-col bg-[#0a0514]">
            <div className="ambient-background" />
            <div className="grid-crosses opacity-50" />

            {/* Navbar (Stays Sticky on Top) */}
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

                {/* Mobile Sidebar Overlay (Closes sidebar when outside clicked) */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Main Dynamic Left Sidebar */}
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
                            <Link onClick={() => setIsSidebarOpen(false)} href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 text-[var(--primary)] font-bold border border-white/5 shadow-inner transition-colors">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                                Overview
                            </Link>
                            <Link onClick={() => setIsSidebarOpen(false)} href="/dashboard/history" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all font-medium">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                                History logs
                            </Link>
                        </nav>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Pro Tips & Setup</p>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-[var(--primary)]/10 to-transparent border border-[var(--primary)]/20 text-[13px] text-[var(--primary)] leading-relaxed shadow-[0_0_15px_rgba(200,162,255,0.05)]">
                            Ensure an extremely quiet environment. Our AI detects tone, hesitation, and answers simultaneously!
                        </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/5 pb-4 lg:pb-0">
                        <div className="flex items-center justify-center gap-2 text-xs text-white/30 font-medium tracking-wide">
                            <span>🟢</span> Server active
                        </div>
                    </div>
                </aside>

                {/* Main Right Content Pane */}
                <main className="flex-1 w-full max-w-full px-4 sm:px-8 py-6 md:py-10 space-y-12 overflow-x-hidden min-w-0">

                    {/* Hero Banner Grid Wrap */}
                    <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#1a0b2e] to-[#0a0514] p-8 sm:p-14 flex flex-col xl:flex-row items-center gap-10 shadow-[0_0_60px_rgba(200,162,255,0.05)]">
                        <div className="absolute top-0 right-1/4 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-[var(--primary)]/20 rounded-full blur-[100px] sm:blur-[120px] pointer-events-none mix-blend-screen"></div>
                        <div className="absolute bottom-0 left-1/4 w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] bg-[var(--accent)]/10 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none mix-blend-screen"></div>

                        <div className="flex-1 space-y-5 sm:space-y-6 relative z-10 w-full text-center xl:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs sm:text-sm font-semibold border border-[var(--primary)]/20">
                                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--primary)] animate-pulse"></span>
                                Interface v2.1 Ready
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
                                Prepare Smarter, <br className="hidden sm:block xl:hidden" />
                                <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(200,162,255,0.4)]">Master the Interview.</span>
                            </h1>
                            <p className="text-white/60 text-sm sm:text-lg max-w-md mx-auto xl:mx-0 leading-relaxed">
                                Experience hyper-realistic AI simulations. Upload your resume or type custom testing concepts to push your skill capabilities to the absolute limit.
                            </p>
                            <div className="pt-4 flex justify-center xl:justify-start">
                                <Link href="/interview" className="group relative inline-flex px-6 sm:px-8 py-3.5 bg-white text-black font-extrabold text-sm sm:text-base rounded-full overflow-hidden transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <span className="relative z-10 flex items-center gap-2">
                                        Initialize Simulation
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                    </span>
                                </Link>
                            </div>
                        </div>

                        <div className="w-48 sm:w-80 xl:w-[420px] flex-shrink-0 animate-float relative z-10 hidden sm:block">
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

                    {/* Stats & History Row */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
                        {/* Recent Performance */}
                        <div className="xl:col-span-2 space-y-4 sm:space-y-6">
                            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Recent Performance Pulse</h2>

                            {pastInterviews.length > 0 ? (
                                <div className="glass-card p-6 sm:p-8 border border-[var(--primary)]/30 relative overflow-hidden group hover:border-[var(--primary)]/60 transition-all duration-500 shadow-[0_10px_40px_rgba(200,162,255,0.05)]">
                                    <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-[var(--primary)]/10 rounded-full blur-[60px] sm:blur-[80px] sm:-mr-20 sm:-mt-20 pointer-events-none group-hover:bg-[var(--primary)]/20 transition-all duration-700"></div>

                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                                <span className="text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded bg-[var(--primary)]/20 text-[var(--primary)] uppercase tracking-wider">
                                                    {pastInterviews[0].type}
                                                </span>
                                                <span className="text-white/40 text-[11px] sm:text-sm font-mono">{pastInterviews[0].date}</span>
                                            </div>
                                            <h3 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent mb-1">
                                                {pastInterviews[0].role}
                                            </h3>
                                            <p className="text-white/50 text-xs sm:text-sm max-w-sm">Your most recent technical gauntlet evaluation matrix.</p>
                                        </div>

                                        <div className="text-left sm:text-right bg-black/40 sm:bg-transparent p-4 sm:p-0 rounded-xl w-full sm:w-auto">
                                            <p className="text-[10px] sm:text-sm font-bold text-white/40 uppercase tracking-widest mb-1 sm:mb-2">Score Output</p>
                                            <div className="text-4xl sm:text-5xl font-black text-[var(--primary)] drop-shadow-[0_0_15px_rgba(200,162,255,0.3)]">
                                                {pastInterviews[0].score}<span className="text-xl sm:text-2xl text-white/30">/100</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-white/10 relative z-10">
                                        <div className="bg-black/30 p-3 sm:p-4 rounded-xl border border-white/5">
                                            <p className="text-white/40 text-[10px] sm:text-xs font-bold uppercase mb-1">Clarity</p>
                                            <p className="text-[var(--primary)] font-bold text-sm sm:text-lg">92%</p>
                                        </div>
                                        <div className="bg-black/30 p-3 sm:p-4 rounded-xl border border-white/5">
                                            <p className="text-white/40 text-[10px] sm:text-xs font-bold uppercase mb-1">Accuracy</p>
                                            <p className="text-cyan-400 font-bold text-sm sm:text-lg">85%</p>
                                        </div>
                                        <div className="bg-black/30 p-3 sm:p-4 rounded-xl border border-white/5">
                                            <p className="text-white/40 text-[10px] sm:text-xs font-bold uppercase mb-1">Tone</p>
                                            <p className="text-[var(--accent)] font-bold text-sm sm:text-lg truncate">Pro</p>
                                        </div>
                                        <div onClick={() => router.push("/dashboard/history")} className="bg-black/50 sm:bg-black/30 p-3 sm:p-4 rounded-xl border border-[var(--primary)]/30 hover:bg-[var(--primary)]/15 transition-all cursor-pointer flex items-center justify-center flex-col text-center shadow-[0_0_20px_rgba(200,162,255,0.15)] group/btn">
                                            <p className="text-white font-bold text-[11px] sm:text-sm group-hover/btn:scale-105 transition-transform">Full History</p>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--primary)] mt-1 lg:mt-2 group-hover/btn:translate-x-1 transition-transform"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="glass-card p-10 flex flex-col items-center justify-center text-center border-white/10">
                                    <p className="text-white/50 mb-4">No past interview data found.</p>
                                </div>
                            )}
                        </div>

                        {/* Skill Radar Base */}
                        <div className="space-y-4 sm:space-y-6">
                            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Skill Matrix</h2>
                            <div className="glass-card p-6 sm:p-8 h-full min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden border-white/5">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--primary)]/5"></div>

                                {/* Faux Radar Chart */}
                                <div className="relative w-40 h-40 sm:w-48 sm:h-48 mb-6">
                                    <svg viewBox="0 0 200 200" className="w-full h-full opacity-20">
                                        <polygon points="100,10 180,50 180,150 100,190 20,150 20,50" fill="none" stroke="white" strokeWidth="1" />
                                        <polygon points="100,40 155,70 155,130 100,160 45,130 45,70" fill="none" stroke="white" strokeWidth="1" />
                                        <line x1="100" y1="10" x2="100" y2="190" stroke="white" strokeWidth="1" />
                                        <line x1="20" y1="50" x2="180" y2="150" stroke="white" strokeWidth="1" />
                                        <line x1="20" y1="150" x2="180" y2="50" stroke="white" strokeWidth="1" />
                                    </svg>
                                    <svg viewBox="0 0 200 200" className="w-full h-full absolute inset-0">
                                        <polygon points="100,30 150,60 160,140 100,170 50,120 70,60" fill="rgba(200,162,255,0.3)" stroke="var(--primary)" strokeWidth="2" className="animate-pulse" />
                                    </svg>
                                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] sm:text-[10px] font-mono text-[var(--primary)]">FRONTEND</span>
                                    <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] sm:text-[10px] font-mono text-[var(--primary)]">BACKEND</span>
                                    <span className="absolute top-1/4 -right-6 text-[9px] sm:text-[10px] font-mono text-cyan-400">SYSTEM</span>
                                    <span className="absolute bottom-1/4 -right-6 text-[9px] sm:text-[10px] font-mono text-[var(--accent)]">REACT</span>
                                    <span className="absolute top-1/4 -left-6 text-[9px] sm:text-[10px] font-mono text-cyan-400">CLOUD</span>
                                    <span className="absolute bottom-1/4 -left-6 text-[9px] sm:text-[10px] font-mono text-[var(--accent)]">DSA</span>
                                </div>

                                <div className="text-center relative z-10 w-full">
                                    <div className="flex justify-between text-xs sm:text-sm mb-2">
                                        <span className="text-white/50">Overall Readiness</span>
                                        <span className="text-[var(--primary)] font-bold">78%</span>
                                    </div>
                                    <div className="w-full h-1.5 sm:h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] w-[78%]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Specialized Modules Grid */}
                    <section className="space-y-4 sm:space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Specialized Mock Modules</h2>
                            <Link href="/interview" className="text-xs sm:text-sm text-[var(--primary)] font-bold hover:underline">View All →</Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                            {availableCourses.map((course) => (
                                <button
                                    key={course.id}
                                    onClick={() => router.push("/interview")}
                                    className="glass-card p-5 sm:p-6 text-left group cursor-pointer border border-white/5 hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5 transform transition-all hover:-translate-y-1 shadow-lg flex flex-row sm:flex-col items-center sm:items-start gap-4 sm:gap-0"
                                >
                                    <div className="w-12 h-12 sm:mb-4 rounded-xl bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform border border-white/10 shadow-inner shrink-0">
                                        {course.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-base sm:text-lg mb-0 sm:mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[var(--primary)] group-hover:to-cyan-400 transition-all truncate">
                                            {course.title}
                                        </h3>
                                        <div className="flex sm:hidden mt-0.5"><span className="text-xs text-white/50">{course.category}</span></div>
                                        <div className="hidden sm:flex items-center justify-between mt-3">
                                            <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest">{course.category}</span>
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${difficultyColor(course.difficulty)}`}>
                                                {course.difficulty}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="sm:hidden shrink-0">
                                        <span className={`text-[9px] font-bold px-2 py-1 rounded uppercase ${difficultyColor(course.difficulty)}`}>
                                            {course.difficulty}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>

                    <hr className="border-t border-white/5" />

                    {/* FAQ & Developers Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                        {/* FAQ Section */}
                        <section className="space-y-6">
                            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Platform FAQ</h2>
                            <div className="space-y-4">
                                {faqs.map((faq, i) => (
                                    <div key={i} className="glass-card p-5 border-white/5 hover:border-white/10 transition-colors">
                                        <h4 className="font-bold text-white mb-2 text-sm sm:text-base flex items-start gap-3">
                                            <span className="text-[var(--primary)]">Q.</span> {faq.q}
                                        </h4>
                                        <p className="text-sm text-white/60 leading-relaxed pl-6">{faq.a}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Developers / Info Section */}
                        <section className="space-y-6">
                            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Meet The Engine</h2>
                            <div className="flex flex-col gap-4">
                                {developers.map((dev, i) => (
                                    <div key={i} className="glass-card p-5 border-white/5 bg-black/40 flex items-center gap-5 hover:border-[var(--primary)]/20 transition-colors">
                                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/10 flex items-center justify-center text-3xl shrink-0 border border-white/10">
                                            {dev.icon}
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-base sm:text-lg text-white group-hover:text-[var(--primary)] transition-colors">{dev.name}</h4>
                                            <p className="text-xs font-bold text-[var(--primary)] uppercase tracking-widest mb-1.5">{dev.role}</p>
                                            <p className="text-xs sm:text-sm text-white/50">{dev.desc}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="p-5 rounded-2xl bg-[var(--primary)]/5 border border-[var(--primary)]/20 mt-2 text-center">
                                    <p className="text-sm text-white/70">
                                        Have ideas to improve the platform? Send feedback!
                                    </p>
                                    <button className="mt-3 px-6 py-2 rounded-full bg-white text-black font-bold text-xs hover:scale-105 transition-transform">Contact Team</button>
                                </div>
                            </div>
                        </section>
                    </div>

                </main>
            </div>
        </div>
    );
}
