"use client";
import { useState, useEffect, useMemo } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/Logo";
import PerformanceChart from "@/components/PerformanceChart";
import { MessageCircle, Terminal, Compass } from "lucide-react";

export default function DashboardPage() {
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [performanceData, setPerformanceData] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [stats, setStats] = useState({
        avgScore: 0,
        technicalDepth: 0,
        communication: 0,
        atsScore: 82, // fallback
        weakTopics: [] as string[]
    });
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();

    useEffect(() => {
        const checkUserAndFetchData = async () => {
            const { data: { user: initialUser } } = await supabase.auth.getUser();
            if (!initialUser) {
                router.push("/sign-in");
                return;
            }
            setUser(initialUser);

            // Fetch Real Stats from session_data
            const { data: sessionData, error } = await supabase
                .from("session_data")
                .select("weighted_score, relevance_score, depth_score, clarity_score, created_at, category")
                .order("created_at", { ascending: true });

            if (sessionData && sessionData.length > 0) {
                setSessions(sessionData);

                // Map for chart
                const chartPoints = sessionData.map((s: any, i: number) => ({
                    name: `Intrv ${i + 1}`,
                    date: new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                    score: s.weighted_score
                }));
                setPerformanceData(chartPoints);

                // Calculate metrics
                const avg = Math.round(sessionData.reduce((acc: number, s: any) => acc + s.weighted_score, 0) / sessionData.length);
                const tech = Math.round((sessionData.reduce((acc: number, s: any) => acc + s.depth_score, 0) / sessionData.length) * 10);
                const comm = Math.round((sessionData.reduce((acc: number, s: any) => acc + s.clarity_score, 0) / sessionData.length) * 10);

                // Weak Topics: categories with low scores
                const categorySum: Record<string, { total: number, count: number }> = {};
                sessionData.forEach((s: any) => {
                    if (!categorySum[s.category]) categorySum[s.category] = { total: 0, count: 0 };
                    categorySum[s.category].total += s.weighted_score;
                    categorySum[s.category].count += 1;
                });
                const weak = Object.keys(categorySum)
                    .filter(cat => (categorySum[cat].total / categorySum[cat].count) < 65)
                    .slice(0, 3);

                setStats(prev => ({
                    ...prev,
                    avgScore: avg,
                    technicalDepth: tech,
                    communication: comm,
                    weakTopics: weak.length > 0 ? weak : ["N/A"]
                }));
            } else {
                setPerformanceData([
                    { date: '1 Mar', score: 65 },
                    { date: '2 Mar', score: 72 },
                    { date: '3 Mar', score: 78 }
                ]);
            }

            // Fetch Latest ATS Score from resumes table
            const { data: resumeData } = await supabase
                .from("resumes")
                .select("ats_score")
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (resumeData) {
                setStats(prev => ({ ...prev, atsScore: resumeData.ats_score }));
            }

            setLoading(false);
        };
        checkUserAndFetchData();
    }, [router, supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/sign-in");
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const userInitial = user.user_metadata?.full_name?.[0] || user.email?.[0] || "U";

    const availableCourses = [
        { id: 1, title: "React Masterclass", category: "Frontend", difficulty: "Expert", icon: "⚛️" },
        { id: 2, title: "System Design Pro", category: "Architecture", difficulty: "Advanced", icon: "🏗️" },
        { id: 3, title: "Behavioral Edge", category: "Soft Skills", difficulty: "Beginner", icon: "🤝" },
        { id: 4, title: "Data Structures", category: "Fundamentals", difficulty: "Advanced", icon: "📊" }
    ];

    return (
        <div className="min-h-screen relative overflow-visible flex flex-col bg-[#0a0514]">
            <div className="ambient-background" />
            <div className="grid-crosses opacity-50" />

            <div className="flex flex-1 relative z-10 w-full max-w-[1700px] mx-auto">

                {/* Sidebar */}
                <aside
                    onMouseEnter={() => setIsSidebarHovered(true)}
                    onMouseLeave={() => setIsSidebarHovered(false)}
                    className={`fixed lg:sticky top-0 h-screen bg-[#070310]/98 backdrop-blur-3xl border-r border-white/10 z-[110] transform transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSidebarHovered ? 'w-[280px]' : 'w-[90px]'} p-6 overflow-hidden flex flex-col group`}
                >
                    <div className="flex items-center gap-4 h-16 mb-8 px-1">
                        <div className={`transition-all duration-500 transform ${isSidebarHovered ? 'opacity-100 scale-110 translate-x-0' : 'opacity-100 scale-95 translate-x-1'} flex items-center gap-3`}>
                            <div className="w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-black font-black text-xs shadow-[0_0_20px_rgba(200,162,255,0.4)]">PW</div>
                            <div className={`transition-all duration-500 ${isSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 pointer-events-none'}`}>
                                <Logo className="h-10" />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 space-y-8 no-scrollbar overflow-hidden">
                        <nav className="space-y-1.5">
                            <Link href="/dashboard" className="flex items-center gap-4 px-3 py-3 rounded-xl bg-white/5 text-[var(--primary)] font-bold">
                                <div className="shrink-0 w-6 flex justify-center scale-110"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg></div>
                                <span className={`transition-all duration-500 whitespace-nowrap text-[13px] ${isSidebarHovered ? 'opacity-100' : 'opacity-0'}`}>Dashboard</span>
                            </Link>
                            <Link href="/dashboard/history" className="flex items-center gap-4 px-3 py-3 rounded-xl text-white/40 hover:text-white transition-all">
                                <div className="shrink-0 w-6 flex justify-center scale-110"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg></div>
                                <span className={`transition-all duration-500 whitespace-nowrap text-[13px] ${isSidebarHovered ? 'opacity-100' : 'opacity-0'}`}>History Logs</span>
                            </Link>
                            <Link href="/casual-talk" className="flex items-center gap-4 px-3 py-3 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all">
                                <div className="shrink-0 w-6 flex justify-center scale-110"><MessageCircle size={18} /></div>
                                <span className={`transition-all duration-500 whitespace-nowrap text-[13px] ${isSidebarHovered ? 'opacity-100' : 'opacity-0'}`}>Casual Talk</span>
                            </Link>
                            <Link href="/code-challenge" className="flex items-center gap-4 px-3 py-3 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all">
                                <div className="shrink-0 w-6 flex justify-center scale-110"><Terminal size={18} /></div>
                                <span className={`transition-all duration-500 whitespace-nowrap text-[13px] ${isSidebarHovered ? 'opacity-100' : 'opacity-0'}`}>Code Challenge</span>
                            </Link>
                            <Link href="/guidance" className="flex items-center gap-4 px-3 py-3 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all">
                                <div className="shrink-0 w-6 flex justify-center scale-110"><Compass size={18} className="text-[var(--accent)]" /></div>
                                <span className={`transition-all duration-500 whitespace-nowrap text-[13px] ${isSidebarHovered ? 'opacity-100' : 'opacity-0'}`}>Career Guidance</span>
                            </Link>
                            <Link href="/compiler" className="flex items-center gap-4 px-3 py-3 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all">
                                <div className="shrink-0 w-6 flex justify-center scale-110"><Terminal size={18} /></div>
                                <span className={`transition-all duration-500 whitespace-nowrap text-[13px] ${isSidebarHovered ? 'opacity-100' : 'opacity-0'}`}>Simple Compiler</span>
                            </Link>
                        </nav>

                        {isSidebarHovered && (
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-white/50 leading-relaxed font-mono">
                                <span className="text-[var(--primary)] font-bold block mb-1">AI Recommendation:</span>
                                Focus on <span className="text-white font-bold">{stats.weakTopics[0]}</span> to boost your Technical Depth score.
                            </div>
                        )}
                    </div>

                    <div className="mt-auto pt-6 space-y-4">
                        {isSidebarHovered ? (
                            <div className="flex flex-col gap-3 rounded-2xl bg-white/5 border border-white/10 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center text-white border border-white/10">
                                        <span className="font-bold text-sm">{userInitial}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{user.user_metadata?.full_name || user.email?.split('@')[0]}</p>
                                        <p className="text-[9px] text-white/40 uppercase font-black tracking-widest leading-none">Active Session</p>
                                    </div>
                                </div>
                                <button onClick={handleSignOut} className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold border border-red-500/10">Sign Out</button>
                            </div>
                        ) : (
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 lowercase font-bold">{userInitial}</div>
                        )}
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-h-screen px-6 sm:px-12 py-10 space-y-12">
                    {/* Header */}
                    <div className="pb-8 border-b border-white/10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <p className="text-[var(--primary)] font-black text-[10px] uppercase tracking-[0.4em] mb-3">Live Performance Suite</p>
                            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter">Performance Pulse</h1>
                            <p className="text-white/40 font-medium mt-3 max-w-2xl leading-relaxed">
                                Real-time AI analysis of your interview metadata. Your technical depth and semantic similarity are calculated weighted against Principal Engineering standards.
                            </p>
                        </div>
                        <Link href="/interview" className="px-8 py-4 bg-[var(--primary)] text-black font-black text-xs rounded-full hover:scale-105 transition-all shadow-[0_0_30px_rgba(200,162,255,0.2)]">
                            Launch Dynamic Interview →
                        </Link>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                        <div className="glass-card p-6 flex flex-col justify-between border-white/5">
                            <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Interview Score</span>
                            <h4 className="text-4xl font-black text-[var(--primary)] mt-2">{stats.avgScore}%</h4>
                            <div className="mt-4 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-[var(--primary)] transition-all duration-1000" style={{ width: `${stats.avgScore}%` }}></div>
                            </div>
                        </div>
                        <div className="glass-card p-6 flex flex-col justify-between border-white/5">
                            <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Technical Depth</span>
                            <h4 className="text-4xl font-black text-white mt-2">{stats.technicalDepth}%</h4>
                            <div className="mt-4 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-400 transition-all duration-1000" style={{ width: `${stats.technicalDepth}%` }}></div>
                            </div>
                        </div>
                        <div className="glass-card p-6 flex flex-col justify-between border-white/5">
                            <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest">ATS Compatibility</span>
                            <h4 className="text-4xl font-black text-[var(--accent)] mt-2">{stats.atsScore}%</h4>
                            <div className="mt-4 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-[var(--accent)] transition-all duration-1000" style={{ width: `${stats.atsScore}%` }}></div>
                            </div>
                        </div>
                        <div className="glass-card p-6 border-white/5">
                            <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest block mb-2">Weak Topics</span>
                            <div className="flex flex-wrap gap-2 mt-4">
                                {stats.weakTopics.map(topic => (
                                    <span key={topic} className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-mono border border-white/10 text-white/60">{topic}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Chart & History */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 glass-card p-8 border-white/10">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold">Preparation Trend</h3>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[var(--primary)]"></div><span className="text-[10px] text-white/40 font-bold uppercase">Weighted Score</span></div>
                                </div>
                            </div>
                            <PerformanceChart data={performanceData} />
                        </div>

                        <div className="glass-card p-8 border-white/5 flex flex-col">
                            <h3 className="text-xl font-bold mb-6">Recent Logs</h3>
                            <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
                                {sessions.length > 0 ? [...sessions].reverse().slice(0, 5).map((s, i) => (
                                    <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                                        <div>
                                            <p className="font-bold text-sm">{s.category}</p>
                                            <p className="text-[10px] text-white/30 uppercase mt-1 font-mono">{new Date(s.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`text-lg font-black ${s.weighted_score > 70 ? 'text-green-400' : 'text-orange-400'}`}>{s.weighted_score}%</span>
                                    </div>
                                )) : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20 text-center py-20">
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                                        <p className="text-xs font-bold mt-4 uppercase">No logs detected</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Courses / Suggested Content */}
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold tracking-tight">Personalized Assessment Paths</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {availableCourses.map((c) => (
                                <button key={c.id} className="glass-card p-8 text-left group hover:translate-y-[-4px] transition-all border-white/5 hover:border-[var(--primary)]/30">
                                    <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">{c.icon}</div>
                                    <h4 className="font-bold text-lg mb-4">{c.title}</h4>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{c.category}</span>
                                        <span className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-widest group-hover:translate-x-1 transition-transform">Start →</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
