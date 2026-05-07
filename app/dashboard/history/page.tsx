"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function HistoryPage() {
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/sign-in");
            } else {
                setUser(user);
            }
            setLoading(false);
        };
        checkUser();
    }, [router, supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/sign-in");
    };

    const [historyItems, setHistoryItems] = useState<any[]>([
        { id: 1, role: "Senior Frontend Engineer", date: "2 Mar 2026", score: 88, type: "Technical", feedback: "Strong React knowledge, could improve System Design depth." },
        { id: 2, role: "Product Manager", date: "28 Feb 2026", score: 92, type: "Behavioral", feedback: "Excellent communication and leadership examples." },
        { id: 3, role: "Backend Developer", date: "25 Feb 2026", score: 75, type: "Data Structures", feedback: "Need more practice with Dynamic Programming." },
    ]);

    useEffect(() => {
        try {
            const savedStr = localStorage.getItem("pw_past_interviews");
            if (savedStr) {
                const parsed = JSON.parse(savedStr);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setHistoryItems(parsed);
                }
            }
        } catch (e) {
            console.error("Failed to load interview history", e);
        }
    }, []);

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const userInitial = user.user_metadata?.full_name?.[0] || user.email?.[0] || "U";

    return (
        <div className="min-h-screen relative overflow-visible flex flex-col bg-[#0a0514]">
            <div className="ambient-background" />
            <div className="grid-crosses opacity-50" />

            <div className="flex flex-1 relative z-10 w-full max-w-[1700px] mx-auto">

                {/* Fixed Interactive Sidebar */}
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
                        <div>
                            <p className={`text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] mb-4 px-3 transition-opacity duration-500 ${isSidebarHovered ? 'opacity-100' : 'opacity-0'}`}>Navigation</p>
                            <nav className="space-y-1.5">
                                <Link href="/dashboard" className="flex items-center gap-4 px-3 py-3 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all duration-300">
                                    <div className="shrink-0 w-6 flex justify-center scale-110">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                                    </div>
                                    <span className={`transition-all duration-500 whitespace-nowrap text-[13px] ${isSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 pointer-events-none'}`}>
                                        Dashboard
                                    </span>
                                </Link>
                                <Link href="/dashboard/history" className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300 ${isSidebarHovered ? 'bg-white/5 text-[var(--primary)] font-bold shadow-inner' : 'text-white/40 hover:text-white'}`}>
                                    <div className="shrink-0 w-6 flex justify-center scale-110">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                                    </div>
                                    <span className={`transition-all duration-500 whitespace-nowrap text-[13px] ${isSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 pointer-events-none'}`}>
                                        History logs
                                    </span>
                                </Link>
                            </nav>
                        </div>
                    </div>

                    <div className="mt-auto pt-6 space-y-4">
                        {/* User Hub component omitted for brevity, keep consistent with Dashboard */}
                        <div className={`flex flex-col gap-3 rounded-2xl bg-white/5 border border-white/10 p-4 transition-all duration-500 ${isSidebarHovered ? 'opacity-100' : 'opacity-0 invisible h-0 overflow-hidden'}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center text-white border border-white/10">
                                    <span className="font-bold text-sm tracking-tighter">{userInitial}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate px-0.5">{user.user_metadata?.full_name || user.email?.split('@')[0]}</p>
                                    <p className="text-[9px] text-white/40 uppercase font-black tracking-widest px-0.5 leading-none">Active</p>
                                </div>
                            </div>
                            <button onClick={handleSignOut} className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold border border-red-500/10 transition-all">Sign Out</button>
                        </div>
                        <div className={`flex justify-center transition-all duration-300 ${isSidebarHovered ? 'hidden opacity-0 h-0' : 'opacity-100 h-12'}`}>
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 truncate">{userInitial}</div>
                        </div>
                    </div>
                </aside>

                {/* Full Scrolling Main Body */}
                <main className={`flex-1 min-h-screen px-6 sm:px-12 py-10 space-y-12 transition-all duration-500 ${isSidebarHovered ? 'lg:ml-4' : 'lg:ml-4'}`}>

                    <div className="pb-8 border-b border-white/10">
                        <h1 className="text-4xl font-black tracking-tighter mb-4">Performance History</h1>
                        <p className="text-white/40 font-medium">Review your past sessions and track your improvement trajectory.</p>
                    </div>

                    <div className="space-y-6">
                        {historyItems.map((item) => (
                            <div key={item.id} className="glass-card p-8 border border-white/5 hover:border-[var(--primary)]/30 transition-all duration-300 group">
                                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold px-3 py-1 rounded bg-white/5 text-white/60 uppercase tracking-widest">{item.type}</span>
                                            <span className="text-white/20 text-xs font-mono">{item.date}</span>
                                        </div>
                                        <h3 className="text-2xl font-black group-hover:text-[var(--primary)] transition-colors">{item.role}</h3>
                                        <p className="text-sm text-white/50 leading-relaxed max-w-2xl">{item.feedback}</p>
                                    </div>
                                    <div className="lg:text-right shrink-0">
                                        <div className="text-5xl font-black text-[var(--primary)]">{item.score}<span className="text-xl text-white/20">/100</span></div>
                                        <button className="mt-4 px-6 py-2 bg-white/5 hover:bg-[var(--primary)]/10 text-white font-bold text-xs rounded-full border border-white/10 transition-all">View Details</button>
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
