"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Mic, LayoutDashboard, Terminal, User, LogOut, ChevronDown, LogIn, UserPlus, FileText } from "lucide-react";
import Logo from "@/components/Logo";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function Navbar() {
    const supabase = createSupabaseBrowserClient();
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch initial user
        const fetchUser = async () => {
            const { data } = await supabase.auth.getUser();
            setUser(data.user);
        };
        fetchUser();

        // Listen for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
            (event: string, session: any) => {
                setUser(session?.user ?? null);
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    // Close dropdown when typing outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/sign-in");
        router.refresh(); // Refresh to update server components and middleware if necessary
    };

    const navLinks = (pathname === "/" && !user) ? [
        { name: "Features", href: "#features", icon: null },
        { name: "How it Works", href: "#how-it-works", icon: null },
    ] : [
        { name: "Home", href: "/", icon: Home },
        { name: "Start Interview", href: "/interview", icon: Mic },
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "ATS Checker", href: "/ats-checker", icon: FileText },
        { name: "Compiler", href: "/compiler", icon: Terminal },
    ];

    return (
        <header className="fixed top-0 left-0 z-[100] w-full border-b border-white/5 bg-black/40 backdrop-blur-2xl transition-all duration-300">
            <div className="max-w-[1600px] mx-auto px-10 h-20 flex items-center justify-between">
                <div className="flex items-center gap-16">
                    <Link href="/" className="flex items-center gap-2 group transition-transform hover:scale-105 active:scale-95">
                        <Logo className="h-12" />
                    </Link>

                    <nav className="hidden md:flex items-center gap-10">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href || (link.name === "Candidate Profile" && pathname.includes("/dashboard"));
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`relative group flex items-center gap-2 text-[13px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${isActive ? "text-[var(--primary)]" : "text-white/40 hover:text-white"
                                        }`}
                                >
                                    {Icon && <Icon className="w-4 h-4" />}
                                    {link.name}
                                    <span className={`absolute -bottom-1 left-0 w-0 h-[2px] bg-[var(--primary)] transition-all duration-300 group-hover:w-full ${isActive ? 'w-full' : ''}`} />
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex items-center gap-6">
                    {user && (
                        <Link
                            href="/interview"
                            className="hidden lg:inline-flex px-6 py-2.5 rounded-full bg-[var(--primary)] text-black font-black text-xs uppercase tracking-widest hover:brightness-125 transition-all shadow-[0_0_20px_rgba(200,162,255,0.3)] active:scale-95"
                        >
                            Launch Session
                        </Link>
                    )}
                    {user ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center gap-3 group px-2 py-1 rounded-xl hover:bg-white/5 transition-all text-left"
                            >
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                                    {user.user_metadata?.avatar_url ? (
                                        <img src={user.user_metadata.avatar_url} alt="User Avatar" className="w-full h-full object-cover rounded-xl" />
                                    ) : (
                                        <span className="text-white font-extrabold text-lg">{user.user_metadata?.full_name?.charAt(0) || "U"}</span>
                                    )}
                                </div>
                                <div className="hidden sm:block">
                                    <p className="text-white font-bold text-sm leading-none">{user.user_metadata?.full_name || "Member"}</p>
                                    <p className="text-white/40 text-[10px] uppercase font-black tracking-wider mt-1">Active</p>
                                </div>
                            </button>

                            {dropdownOpen && (
                                <div className="absolute right-0 mt-4 w-48 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-[#0c0c16] border border-white/10 overflow-hidden text-sm flex flex-col origin-top-right animate-in zoom-in-95 fade-in duration-200">
                                    <div className="p-2">
                                        <button
                                            onClick={() => {
                                                setDropdownOpen(false);
                                                handleSignOut();
                                            }}
                                            className="w-full text-left px-4 py-3 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-3 font-bold"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Terminate Session
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-6">
                            <Link href="/sign-in" className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 hover:text-white transition-all">
                                Sign In
                            </Link>
                            <Link
                                href="/sign-up"
                                className="bg-white text-black px-7 py-3 rounded-full font-black text-[11px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                            >
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
