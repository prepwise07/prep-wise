"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import IdeWorkspace from "@/components/IDE/IdeWorkspace";
import { getSharedProject } from "@/lib/compilerService";
import Navbar from "@/components/Navbar";
import LiveBackground from "@/components/LiveBackground";
import { Loader2 } from "lucide-react";

export default function SharedProjectPage() {
    const { id } = useParams();
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        const fetchProject = async () => {
            try {
                const data = await getSharedProject(id as string);
                setProject(data);
            } catch (err: any) {
                setError(err.message || "Project not found or link expired.");
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id]);

    return (
        <main className="min-h-screen bg-black overflow-hidden flex flex-col">
            <LiveBackground />
            <Navbar />

            <div className="flex-1 pt-20 relative z-10 flex flex-col">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                        <Loader2 size={40} className="text-indigo-500 animate-spin" />
                        <p className="text-white/20 font-black uppercase tracking-widest text-xs">Loading Shared Project...</p>
                    </div>
                ) : error ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4 text-center px-6">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                            <span className="text-red-400 text-2xl font-bold">!</span>
                        </div>
                        <h2 className="text-xl font-bold text-white">Project Unavailable</h2>
                        <p className="text-white/40 max-w-md">{error}</p>
                    </div>
                ) : (
                    <IdeWorkspace initialProject={project} readOnly={true} />
                )}
            </div>
        </main>
    );
}
