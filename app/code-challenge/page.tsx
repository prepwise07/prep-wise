"use client";

import CodeChallengeRoom from "../../components/CodeChallengeRoom";
import Link from "next/link";
import { ArrowLeft, Terminal } from "lucide-react";

export default function CodeChallengePage() {
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
                            <span className="text-white/30 text-sm">Code Challenge</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 shadow-[0_0_20px_rgba(200,162,255,0.1)]">
                        <Terminal size={14} className="text-[var(--primary)]" />
                        <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">Skill Evaluator</span>
                    </div>
                </div>

                {/* Page title */}
                <div className="mb-8 text-center">
                    <p className="text-[var(--primary)] font-black text-[10px] uppercase tracking-[0.4em] mb-3">
                        Test Your Logical Execution
                    </p>
                    <h1 className="text-4xl lg:text-5xl font-black tracking-tighter mb-3">
                        Technical Code Challenge
                    </h1>
                    <p className="text-white/40 text-lg max-w-xl mx-auto">
                        Sharpen your algorithms. Write code in your browser, test against edge cases, and get an AI skill rating.
                    </p>
                </div>

                {/* The main room */}
                <CodeChallengeRoom />
            </main>
        </div>
    );
}
