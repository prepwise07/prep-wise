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

                {/* Advanced ATS Integration Display */}
                {profile.atsData && profile.atsData.ats_analysis && (
                    <div className="mb-8 p-6 rounded-2xl bg-black border border-white/10 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/10 to-transparent pointer-events-none"></div>
                        <div className="relative z-10 flex items-center flex-col shrink-0">
                            <div className="w-24 h-24 rounded-full border-4 border-white/10 flex items-center justify-center relative">
                                <svg className="absolute inset-0 w-full h-full -rotate-90">
                                    <circle cx="44" cy="44" r="44" className="stroke-white/10 fill-none" strokeWidth="4" />
                                    <circle cx="44" cy="44" r="44" className="stroke-[var(--primary)] fill-none transition-all duration-1000" strokeWidth="4" strokeDasharray="276" strokeDashoffset={276 - (276 * (profile.atsData.ats_analysis.overall_score / 100))} />
                                </svg>
                                <span className="text-3xl font-black text-white">{profile.atsData.ats_analysis.overall_score}</span>
                            </div>
                            <span className="text-[10px] uppercase tracking-widest text-white/40 mt-3 font-bold">ATS Match Score</span>
                        </div>
                        <div className="relative z-10 flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-white mb-1">
                                {profile.atsData.dashboard_display?.ats_status || "Resume Analysis Complete"}
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-3">
                                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-white/70">
                                    Difficulty: {profile.atsData.interview_control?.interview_difficulty_level}
                                </span>
                                {profile.atsData.interview_control?.resume_eligible ? (
                                    <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs font-bold text-green-400">
                                        Approved for AI Gauntlet
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-xs font-bold text-red-400">
                                        Fails Basic Minimum Standards
                                    </span>
                                )}
                            </div>
                            {profile.atsData.ats_analysis.risk_flags && profile.atsData.ats_analysis.risk_flags.length > 0 && (
                                <p className="text-xs text-red-400 mt-4 flex gap-2">
                                    <span className="font-bold shrink-0">🚩 RISKS:</span>
                                    {profile.atsData.ats_analysis.risk_flags[0]}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Skills Section */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold flex items-center gap-2 text-[var(--foreground)]">
                            <Code2 size={20} className="text-primary" /> Key Skills
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {[...(profile.skills?.programming || []), ...(profile.skills?.web || []), ...(profile.skills?.databases || []), ...(profile.skills?.tools || [])].slice(0, 12).map((skill, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-medium"
                                >
                                    {skill.name}
                                </span>
                            ))}
                            {[...(profile.skills?.programming || []), ...(profile.skills?.web || []), ...(profile.skills?.databases || []), ...(profile.skills?.tools || [])].length > 12 && (
                                <span className="px-3 py-1 bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full text-sm font-medium">
                                    +{[...(profile.skills?.programming || []), ...(profile.skills?.web || []), ...(profile.skills?.databases || []), ...(profile.skills?.tools || [])].length - 12} more
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
