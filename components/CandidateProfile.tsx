"use client";

import { CandidateProfile } from "../lib/resumeParser";
import { Briefcase, GraduationCap, Code2, User } from "lucide-react";

interface CandidateProfileProps {
    profile: CandidateProfile;
    onProceed: () => void;
}

export default function CandidateProfileDisplay({ profile, onProceed }: CandidateProfileProps) {
    return (
        <div className="w-full max-w-3xl mx-auto mt-8 animate-slide-up space-y-6">
            <div className="glass-card rounded-2xl p-8 shadow-lg">
                <div className="flex items-start gap-6 mb-8">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-md">
                        {profile.name.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-[var(--foreground)]">{profile.name}</h2>
                        <p className="text-[var(--muted-foreground)] flex items-center gap-2 mt-1">
                            <User size={16} /> {profile.email || "No email provided"}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Skills Section */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold flex items-center gap-2 text-[var(--foreground)]">
                            <Code2 size={20} className="text-primary" /> Key Skills
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {profile.skills.slice(0, 12).map((skill, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-medium"
                                >
                                    {skill}
                                </span>
                            ))}
                            {profile.skills.length > 12 && (
                                <span className="px-3 py-1 bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full text-sm font-medium">
                                    +{profile.skills.length - 12} more
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Experience Section */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold flex items-center gap-2 text-[var(--foreground)]">
                            <Briefcase size={20} className="text-primary" /> Experience
                        </h3>
                        <div className="space-y-4 border-l-2 border-[var(--border)] pl-4 ml-2">
                            {profile.experience.slice(0, 2).map((exp, idx) => (
                                <div key={idx} className="relative">
                                    <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-background"></div>
                                    <p className="font-semibold text-[var(--foreground)]">{exp.role}</p>
                                    <p className="text-sm text-[var(--muted-foreground)]">{exp.company}</p>
                                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{exp.duration}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-[var(--border)] flex justify-end">
                    <button
                        onClick={onProceed}
                        className="px-8 py-3 bg-primary hover:bg-indigo-600 text-white font-semibold rounded-full shadow-lg hover:shadow-primary/25 transition-all w-full md:w-auto flex items-center justify-center gap-2"
                    >
                        Generate Questions & Start Interview
                    </button>
                </div>
            </div>
        </div>
    );
}
