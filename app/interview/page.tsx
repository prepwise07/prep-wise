"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { CandidateProfile } from "../../lib/resumeParser";
import { Question } from "../../lib/questions";
import { FeedbackReport } from "../../lib/feedbackAnalyzer";
import FeedbackCard from "../../components/FeedbackCard";
import FeedbackReportComp from "../../components/FeedbackReport";
import Logo from "@/components/Logo";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import InterviewRoom from "@/components/InterviewRoom";

type InterviewStep = "UPLOAD" | "PREPARING" | "SETUP" | "READY" | "INTERVIEWING" | "ANALYZING" | "REPORT";

// Removed redundant Vapi local instance

export default function InterviewPage() {
    const [step, setStep] = useState<InterviewStep>("UPLOAD");
    const [profile, setProfile] = useState<CandidateProfile | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [feedbackRecords, setFeedbackRecords] = useState<Record<string, FeedbackReport>>({});
    const [isDragging, setIsDragging] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [manualData, setManualData] = useState("");

    // Interview Configurations
    const [includeIntro, setIncludeIntro] = useState(true);
    const [questionCount, setQuestionCount] = useState(5);
    const [customConcepts, setCustomConcepts] = useState("");
    const supabase = createSupabaseBrowserClient();

    const [cameraError, setCameraError] = useState<string>("");

    useEffect(() => {
        // Auto-load profile if user comes fully configured
        try {
            const savedProfile = localStorage.getItem("prep_wise_current_profile");
            const urlParams = new URLSearchParams(window.location.search);
            const isFromProfileRedirect = urlParams.get("from_profile") === "true";

            if (savedProfile && isFromProfileRedirect) {
                const parsedProfile = JSON.parse(savedProfile);
                setProfile(parsedProfile);
                setStep("SETUP");
            }
        } catch (e) {
            console.error("Failed to parse prep_wise_current_profile", e);
        }
    }, []);

    // Webcam Access logic removed from page level as InterviewRoom handles simulation UI

    // Upload handling
    const handleFile = async (file: File) => {
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const isValidType = file.type.includes("pdf") || file.type.includes("document") || file.type.includes("msword") || ["pdf", "doc", "docx"].includes(fileExt || "");

        if (!isValidType) {
            setUploadError("Please upload a PDF or DOCX file. (Found: " + (file.type || fileExt || "Unknown") + ")");
            return;
        }

        setStep("PREPARING");
        setUploadError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/parse-resume", { method: "POST", body: formData });

            if (!res.ok) {
                let errText = "Failed to parse resume";
                try {
                    const errObj = await res.json();
                    if (errObj.error) errText = errObj.error;
                } catch (e) { }
                throw new Error(errText);
            }

            const profileData: CandidateProfile = await res.json();
            setProfile(profileData);
            setStep("SETUP");
        } catch (err: any) {
            setUploadError(err.message || "Something went wrong.");
            setStep("UPLOAD");
        }
    };

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("from_profile") === "true") {
            const savedProfile = localStorage.getItem("prep_wise_current_profile");
            if (savedProfile) {
                setProfile(JSON.parse(savedProfile));
                setStep("SETUP");
                localStorage.removeItem("prep_wise_current_profile"); // Cleanup
            }
        }
    }, []);

    const handleManualSubmit = async () => {
        if (!manualData.trim()) return;
        setUploadError(null);
        setStep("PREPARING");
        try {
            const dummyProfile: CandidateProfile = {
                name: "Candidate",
                email: "",
                skills: {
                    programming: [{ name: manualData.substring(0, 30).trim() + "...", level: "Intermediate" }],
                    web: [], databases: [], tools: []
                },
                projects: [],
                experience: [],
                education: [],
                achievements: [], certifications: [], strengths: [], hobbies: [], objective: "",
                summary: manualData
            };
            setProfile(dummyProfile);
            setStep("SETUP");
        } catch (err: any) {
            setUploadError(err.message || "Failed. Please try again.");
            setStep("UPLOAD");
        }
    };

    const generateInterviewPlan = async () => {
        if (!profile) return;
        setStep("PREPARING");
        try {
            const qRes = await fetch("/api/select-questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profile, count: questionCount, includeIntro, customConcepts, difficulty: "Medium" }),
            });
            if (!qRes.ok) throw new Error("Failed to generate questions");
            const qData = await qRes.json();
            setQuestions(qData.questions);

            // Create Interview Record in Supabase
            const { data: { user } } = await supabase.auth.getUser();
            const { data: interview, error } = await supabase
                .from("interviews")
                .insert([{
                    user_id: user?.id,
                    role: profile.objective || "General Technical",
                    status: "in_progress",
                    overall_score: 0
                }])
                .select()
                .single();

            if (interview) {
                localStorage.setItem("pw_current_interview_id", interview.id);
            }

            setStep("READY");
        } catch (err: any) {
            alert(err.message);
            setStep("SETUP");
        }
    };

    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false);
        if (e.dataTransfer.files?.[0]) await handleFile(e.dataTransfer.files[0]);
    }, []);

    const handleRestart = () => {
        setStep("UPLOAD");
        setProfile(null);
        setQuestions([]);
        setFeedbackRecords({});
    };

    return (
        <div className="min-h-screen relative overflow-x-hidden">
            <div className="ambient-background" />
            <div className="grid-crosses opacity-50" />


            <main className="relative z-10 max-w-5xl mx-auto px-6 py-10">

                {/* STEP: Upload Resume */}
                {step === "UPLOAD" && (
                    <div className="animate-fade-in-up space-y-8 mt-12">
                        <div className="text-center max-w-xl mx-auto">
                            <div className="inline-flex items-center justify-center p-3 mb-6 rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 border border-white/10 shadow-[0_0_30px_rgba(200,162,255,0.15)]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <defs><linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#c8a2ff" /><stop offset="100%" stopColor="#e8985a" /></linearGradient></defs>
                                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight mb-4">Initialize Your Session</h1>
                            <p className="text-white/50 text-lg">Upload your resume to calibrate the AI interviewer's neural pathways to your exact skill profile.</p>
                        </div>

                        <div
                            className={`glass-card p-16 flex flex-col items-center justify-center text-center cursor-pointer border-2 border-dashed transition-all duration-300 ${isDragging ? "border-[var(--primary)] bg-[var(--primary)]/10 scale-[1.02]" : "border-white/10 hover:border-white/20 hover:bg-white/5"}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById("file-input")?.click()}
                        >
                            <input id="file-input" type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                            <div className="w-20 h-20 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(200,162,255,0.1)]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--primary)]">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                            </div>
                            <p className="text-2xl font-semibold mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Drop Resume Document</p>
                            <p className="text-base text-white/40 max-w-sm">Supported formats: PDF, DOCX. We prioritize strict parsing and instant analysis.</p>
                            {uploadError && <p className="text-red-400 mt-5 text-sm font-medium px-4 py-2 bg-red-400/10 rounded-lg">{uploadError}</p>}
                        </div>

                        {/* Manual Data Input */}
                        <div className="mt-12 max-w-2xl mx-auto w-full group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
                                <span className="text-sm font-bold tracking-widest uppercase text-white/40">Or Enter Data Manually</span>
                                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
                            </div>
                            <div className="glass-card p-2 rounded-2xl border-white/10 border transition-all focus-within:border-[var(--primary)]/50 focus-within:shadow-[0_0_30px_rgba(200,162,255,0.1)]">
                                <textarea
                                    value={manualData}
                                    onChange={(e) => setManualData(e.target.value)}
                                    placeholder="Paste your LinkedIn summary, specific skills required for the job, or raw resume text here to instantly generate questions..."
                                    className="w-full bg-transparent border-none p-4 text-sm font-mono text-white/80 outline-none min-h-[120px] custom-scrollbar resize-y"
                                />
                                <div className="flex justify-end p-2 border-t border-white/5">
                                    <button
                                        onClick={handleManualSubmit}
                                        disabled={!manualData.trim()}
                                        className="btn-primary py-2 px-6 rounded-xl text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        Extract Skills
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Optional Module Selection */}
                        <div className="mt-16 border-t border-white/10 pt-12">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold tracking-tight mb-2">Or Choose a Specific Module</h2>
                                <p className="text-white/40">Skip resume upload and test yourself on specific skills instantly</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {[
                                    { title: "SQL Mastery", cat: "Database", icon: "🗄️" },
                                    { title: "Basic Java", cat: "Language", icon: "☕" },
                                    { title: "Advance Java", cat: "Language", icon: "🚀" },
                                    { title: "Python Core", cat: "Language", icon: "🐍" },
                                    { title: "Java Full Stack", cat: "Full Stack", icon: "🌐" },
                                    { title: "C Programming", cat: "Systems", icon: "⚙️" },
                                    { title: "C++ Systems", cat: "Systems", icon: "⚡" },
                                    { title: "Gen. Communication", cat: "Soft Skills", icon: "🗣️" },
                                    { title: "Self Introduction", cat: "Soft Skills", icon: "👋" }
                                ].map((module) => (
                                    <button
                                        key={module.title}
                                        onClick={() => {
                                            // Mocking questions for the chosen module
                                            setProfile({
                                                name: "Candidate", email: "",
                                                skills: { programming: [{ name: module.title, level: "Intermediate" }], web: [], databases: [], tools: [] },
                                                projects: [], experience: [], education: [],
                                                achievements: [], certifications: [], strengths: [], hobbies: [], objective: "",
                                                summary: "Custom Module Assessment"
                                            });
                                            setQuestions([
                                                { id: "q1", category: module.cat, difficulty: "Medium", question: `Can you explain a core concept in ${module.title}?`, keyPoints: ["Definition", "Use Case"] },
                                                { id: "q2", category: module.cat, difficulty: "Hard", question: `What are some common pitfalls or advanced optimizations one should know about ${module.title}?`, keyPoints: ["Optimization", "Error handling"] }
                                            ]);
                                            setStep("READY");
                                        }}
                                        className="glass-card p-5 text-left group cursor-pointer border border-white/5 hover:border-[var(--primary)]/50 hover:bg-white-[0.02] transform transition-all hover:-translate-y-1 shadow-lg flex flex-col items-center justify-center text-center space-y-3"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl group-hover:scale-110 transition-transform border border-white/10 shadow-inner">
                                            {module.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-white/90 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[var(--primary)] group-hover:to-cyan-400 transition-all">{module.title}</h3>
                                            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{module.cat}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP: SETUP */}
                {step === "SETUP" && (
                    <div className="animate-fade-in-up mt-16 max-w-2xl mx-auto glass-card p-10">
                        <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-center">Configure Interview Parameters</h2>
                        <p className="text-white/50 text-center mb-10">Customize the AI session behavior before generating the gauntlet.</p>

                        <div className="space-y-8">
                            <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/10">
                                <div>
                                    <h3 className="font-bold text-lg text-white">Include Introduction?</h3>
                                    <p className="text-white/40 text-sm">Start the interview with "Tell me about yourself"</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={includeIntro} onChange={(e) => setIncludeIntro(e.target.checked)} className="sr-only peer" />
                                    <div className="w-14 h-7 rounded-full bg-white/10 peer-focus:outline-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[var(--primary)] shadow-inner"></div>
                                </label>
                            </div>

                            <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-white">Number of Questions</h3>
                                        <p className="text-white/40 text-sm">How deep should the technical grill go?</p>
                                    </div>
                                    <span className="text-2xl font-bold font-mono text-[var(--accent)]">{questionCount}</span>
                                </div>
                                <input
                                    type="range" min="3" max="10" step="1"
                                    value={questionCount}
                                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                                />
                                <div className="flex justify-between text-xs text-white/30 mt-2 font-mono">
                                    <span>3 (Fast)</span>
                                    <span>10 (Exhaustive)</span>
                                </div>
                            </div>

                            <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-white">Specific Concepts to Test</h3>
                                        <p className="text-white/40 text-sm">Force the AI to generate questions focusing exactly on these topics.</p>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={customConcepts}
                                    onChange={(e) => setCustomConcepts(e.target.value)}
                                    placeholder="e.g., React Lifecycle, Redux Saga, Binary Trees..."
                                    className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-sm font-mono text-white outline-none focus:border-[var(--primary)]"
                                />
                            </div>

                            <button onClick={generateInterviewPlan} className="w-full btn-primary py-4 text-lg font-bold mt-6 shadow-[0_0_30px_rgba(200,162,255,0.2)] hover:scale-[1.02] transition-transform">
                                Generate Interview Framework
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP: Preparing */}
                {step === "PREPARING" && (
                    <div className="animate-fade-in-up flex flex-col items-center justify-center min-h-[60vh] text-center">
                        <div className="relative w-32 h-32 mb-8">
                            <div className="absolute inset-0 border-t-2 border-r-2 border-[var(--primary)] rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
                            <div className="absolute inset-2 border-l-2 border-b-2 border-[var(--accent)] rounded-full animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
                            <div className="absolute inset-4 border-t-2 border-l-2 border-cyan-400 rounded-full animate-spin" style={{ animationDuration: '4s' }}></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-mono text-[var(--primary)] animate-pulse">ANALYZING</span>
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold mb-3 tracking-tight">Extracting Skill Vectors...</h2>
                        <p className="text-white/40 text-lg">AI is processing your resume and matching millions of data points to generate your personalized technical gauntlet.</p>
                    </div>
                )}

                {/* STEP: Ready */}
                {step === "READY" && (
                    <div className="animate-fade-in-up space-y-12 mt-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-extrabold tracking-tight mb-2">Simulation Ready</h2>
                            <p className="text-white/50 text-lg">Your technical profile has been mapped.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            {/* AI Interview Card */}
                            <div className="glass-card hover:bg-white/5 p-10 flex flex-col items-center justify-center text-center shadow-[0_0_50px_rgba(200,162,255,0.05)] transition-all transform hover:-translate-y-2 group border-[var(--primary)]/20">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-transparent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-[inset_0_0_20px_rgba(200,162,255,0.2)]">
                                    <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
                                        <circle cx="16" cy="16" r="14" stroke="var(--primary)" strokeWidth="2" fill="none" />
                                        <circle cx="12" cy="16" r="3" fill="var(--primary)" />
                                        <path d="M18 13 C22 13 22 19 18 19" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold mb-2">PrepWise AI Engine</h3>
                                <p className="text-base text-white/40">{questions.length} adaptive questions generated</p>
                                <div className="mt-6 flex gap-2">
                                    <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-mono text-[var(--primary)]">Groq Llama 3.3</span>
                                    <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-mono text-cyan-400">11Labs Voice</span>
                                </div>
                            </div>

                            {/* User Card */}
                            <div className="glass-card hover:bg-white/5 p-10 flex flex-col items-center justify-center text-center shadow-[0_0_50px_rgba(232,152,90,0.05)] transition-all transform hover:-translate-y-2 border-[var(--accent)]/20">
                                <div className="w-24 h-24 rounded-full overflow-hidden mb-6 border-2 border-[var(--accent)]/40 p-1">
                                    <div className="w-full h-full rounded-full overflow-hidden relative">
                                        <Image src="/user-avatar.png" alt="User" layout="fill" objectFit="cover" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold mb-2">{profile?.name || "Candidate"}</h3>
                                {profile && (
                                    <div className="flex flex-wrap gap-2 mt-4 justify-center">
                                        {[...(profile.skills?.programming || []), ...(profile.skills?.web || []), ...(profile.skills?.databases || []), ...(profile.skills?.tools || [])].slice(0, 4).map((s, i) => (
                                            <span key={i} className="text-xs px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)]">{s.name}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-center pt-8">
                            <button
                                onClick={() => setStep("INTERVIEWING")}
                                className="group relative px-12 py-4 bg-white text-black font-extrabold text-lg rounded-full overflow-hidden transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                            >
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <span className="relative z-10 flex items-center gap-3">
                                    Initiate System Call
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                </span>
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP: Interviewing (Now using InterviewRoom for adaptation) */}
                {step === "INTERVIEWING" && (
                    <InterviewRoom
                        questions={questions}
                        onInterviewComplete={(records) => {
                            setFeedbackRecords(records);
                            setStep("REPORT");
                        }}
                    />
                )}

                {/* STEP: Analyzing */}
                {step === "ANALYZING" && (
                    <div className="animate-fade-in-up flex flex-col items-center justify-center min-h-[60vh] text-center">
                        <div className="w-24 h-24 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin mb-8"></div>
                        <h2 className="text-3xl font-bold mb-3 tracking-tight">Processing Full Transcript</h2>
                        <p className="text-white/40 max-w-lg mx-auto">Evaluating communication skills, mapping responses to technical concepts, and generating personalized growth pathways.</p>
                    </div>
                )}



                {/* STEP: Final Report */}
                {step === "REPORT" && (
                    <div className="mt-8">
                        <FeedbackReportComp
                            records={feedbackRecords}
                            questions={questions}
                            onRestart={handleRestart}
                        />
                    </div>
                )}

            </main>
        </div>
    );
}
