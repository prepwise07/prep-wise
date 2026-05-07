"use client";

import Navbar from "@/components/Navbar";
import SimpleCompiler from "@/components/SimpleCompiler";
import LiveBackground from "@/components/LiveBackground";

export default function CompilerPage() {
    return (
        <main className="min-h-screen relative bg-black overflow-hidden flex flex-col">
            <LiveBackground />
            <Navbar />

            <div className="flex-1 relative z-10 pt-32 pb-12 px-6 sm:px-12 flex flex-col">
                <div className="max-w-[1600px] mx-auto w-full space-y-6 flex-1 flex flex-col">

                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-6 bg-[var(--primary)] rounded-full" />
                            <h1 className="text-4xl font-black tracking-tighter text-white">Advanced Compiler</h1>
                        </div>
                        <p className="text-white/40 text-sm max-w-2xl leading-relaxed">
                            A standalone, low-latency execution environment for rapid prototyping and technical experimentation across multiple high-performance languages.
                        </p>
                    </div>

                    <SimpleCompiler />
                </div>
            </div>
        </main>
    );
}
