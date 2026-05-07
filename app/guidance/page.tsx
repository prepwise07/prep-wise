"use client";

import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import GuidanceChat from "../../components/GuidanceChat";

export default function GuidancePage() {
    return (
        <div className="min-h-screen relative overflow-x-hidden">
            <div className="ambient-background" />
            <div className="grid-crosses opacity-50" />

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
                {/* Top bar */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10 transition-all text-sm font-medium"
                        >
                            <ArrowLeft size={14} />
                            Dashboard
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-4 rounded-full bg-white/10" />
                            <span className="text-white/30 text-sm">Career Guidance</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 shadow-[0_0_20px_rgba(232,152,90,0.1)]">
                        <Compass size={14} className="text-[var(--accent)]" />
                        <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">Market Intelligence</span>
                    </div>
                </div>

                {/* Page title */}
                <div className="mb-8 text-center">
                    <p className="text-[var(--accent)] font-black text-[10px] uppercase tracking-[0.4em] mb-3">
                        Live Tech Industry Insights
                    </p>
                    <h1 className="text-4xl lg:text-5xl font-black tracking-tighter mb-3">
                        Career Guidance
                    </h1>
                    <p className="text-white/40 text-lg max-w-xl mx-auto">
                        Ask about current hiring trends, frameworks in demand, or plan your next career move using live web data.
                    </p>
                </div>

                {/* The main room */}
                <GuidanceChat />
            </main>
        </div>
    );
}
