"use client";

import CasualTalkRoom from "../../components/CasualTalkRoom";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";

export default function CasualTalkPage() {
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
                            <span className="text-white/30 text-sm">Casual Talk</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20">
                        <MessageCircle size={14} className="text-[var(--accent)]" />
                        <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">Free Conversation Mode</span>
                    </div>
                </div>

                {/* Page title */}
                <div className="mb-8 text-center">
                    <p className="text-[var(--accent)] font-black text-[10px] uppercase tracking-[0.4em] mb-3">
                        No Pressure. No Evaluation.
                    </p>
                    <h1 className="text-4xl lg:text-5xl font-black tracking-tighter mb-3">
                        Casual Talk with Alex
                    </h1>
                    <p className="text-white/40 text-lg max-w-xl mx-auto">
                        A relaxed AI conversation partner for practicing communication, thinking out loud, or just a friendly chat.
                    </p>
                </div>

                {/* The main room */}
                <CasualTalkRoom />
            </main>
        </div>
    );
}
