"use client";

import IdeWorkspace from "@/components/IDE/IdeWorkspace";
import Navbar from "@/components/Navbar";
import LiveBackground from "@/components/LiveBackground";

export default function FullIdePage() {
    return (
        <main className="min-h-screen bg-black overflow-hidden flex flex-col">
            <LiveBackground />
            <Navbar />

            <div className="flex-1 pt-20 relative z-10">
                <IdeWorkspace />
            </div>
        </main>
    );
}
