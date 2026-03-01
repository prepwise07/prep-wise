"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { CandidateProfile } from "../../lib/resumeParser";
import { Question } from "../../lib/questions";
import { FeedbackReport } from "../../lib/feedbackAnalyzer";
import FeedbackCard from "../../components/FeedbackCard";
import FeedbackReportComp from "../../components/FeedbackReport";
import Vapi from "@vapi-ai/web";

type InterviewStep = "UPLOAD" | "PREPARING" | "SETUP" | "READY" | "INTERVIEWING" | "ANALYZING" | "REPORT";

// Initialize VAPI
const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "dummy_key");

export default function InterviewPage() {
    const [step, setStep] = useState<InterviewStep>("UPLOAD");
    const [profile, setProfile] = useState<CandidateProfile | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [transcript, setTranscript] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [currentFeedback, setCurrentFeedback] = useState<FeedbackReport | null>(null);
    const [feedbackRecords, setFeedbackRecords] = useState<Record<string, FeedbackReport>>({});
    const [isDragging, setIsDragging] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [manualData, setManualData] = useState("");

    // Interview Configurations
    const [includeIntro, setIncludeIntro] = useState(true);
    const [questionCount, setQuestionCount] = useState(5);
    const [customConcepts, setCustomConcepts] = useState("");

    // Video & Frame Capture State
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [frames, setFrames] = useState<string[]>([]);
    const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [cameraError, setCameraError] = useState<string>("");

    // VAPI State
    const [volumeLevel, setVolumeLevel] = useState(0);
    const [aiSpeaking, setAiSpeaking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const currentQuestion = questions[currentQIndex];

    // Auto-scroll transcript
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [transcript]);

    // VAPI Listeners
    useEffect(() => {
        vapi.on("call-start", () => setIsRecording(true));
        vapi.on("call-end", () => {
            setIsRecording(false);
            setAiSpeaking(false);
            setVolumeLevel(0);
        });

        vapi.on("volume-level", (volume) => {
            setVolumeLevel(volume);
            if (volume > 0.05) setAiSpeaking(true);
            else setTimeout(() => setAiSpeaking(false), 500); // trailing off
        });

        vapi.on("message", (message: any) => {
            if (message.type === "transcript" && message.transcriptType === "final" && message.role === "user") {
                setTranscript((prev) => prev ? prev + " " + message.transcript : message.transcript);
            }
        });

        return () => {
            vapi.removeAllListeners();
            if (isRecording) vapi.stop();
        };
    }, [isRecording]);

    // Webcam Access
    useEffect(() => {
        let stream: MediaStream | null = null;
        if (step === "INTERVIEWING") {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(s => {
                    stream = s;
                    if (videoRef.current) videoRef.current.srcObject = stream;
                })
                .catch(err => setCameraError("Camera access denied or unavailable. Visual feedback will be disabled."));
        }
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (videoRef.current?.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
            }
            if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
        };
    }, [step]);

    // Frame Capture Interval
    useEffect(() => {
        if (isRecording) {
            frameIntervalRef.current = setInterval(() => {
                if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        canvasRef.current.width = videoRef.current.videoWidth;
                        canvasRef.current.height = videoRef.current.videoHeight;
                        ctx.drawImage(videoRef.current, 0, 0);
                        const base64Image = canvasRef.current.toDataURL('image/jpeg', 0.5); // compress
                        setFrames(prev => [...prev.slice(-4), base64Image]); // Keep max 5 frames per answer
                    }
                }
            }, 3000);
        } else {
            if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
        }
        return () => {
            if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
        }
    }, [isRecording]);

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
            if (!res.ok) throw new Error("Failed to parse resume");

            const profileData: CandidateProfile = await res.json();
            setProfile(profileData);
            setStep("SETUP");
        } catch (err: any) {
            setUploadError(err.message || "Something went wrong.");
            setStep("UPLOAD");
        }
    };

    const handleManualSubmit = async () => {
        if (!manualData.trim()) return;
        setUploadError(null);
        setStep("PREPARING");
        try {
            const dummyProfile: CandidateProfile = {
                name: "Candidate",
                email: "",
                skills: [manualData.substring(0, 30).trim() + "..."],
                experience: [],
                education: [],
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
                body: JSON.stringify({ profile, count: questionCount, includeIntro, customConcepts }),
            });
            if (!qRes.ok) throw new Error("Failed to generate questions");
            const qData = await qRes.json();
            setQuestions(qData.questions);
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

    const startVapiCall = async () => {
        setTranscript("");

        const questionList = questions.map((q, i) => `${i + 1}. [${q.category}] ${q.question}`).join("\\n");

        await vapi.start({
            model: {
                provider: "openai",
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `You are a friendly, conversational, and highly realistic Principal Engineer conducting a casual but thorough technical interview for PrepWise. Your tone is extremely human. Use conversational filler words occasionally (like 'uh', 'um', 'gotcha', 'makes sense'). NEVER act robotic. NEVER state you are an AI. 

You MUST exclusively follow this specific list of questions for the candidate:
${questionList}

CRITICAL RULES:
1. Act highly conversational. Don't sound like you're reading from a script.
2. Ask the very first question organically. 
3. When they answer, do NOT just say "Understood." React naturally to their answer (e.g., "Ah, okay, I see what you mean," or "Interesting approach. Okay, moving on...").
4. Keep all of your responses EXTREMELY short (under 15 words) except when asking the core question.
5. Move through your question list seamlessly. Do not evaluate them or give them the correct answers over voice.
6. Once you have finished the final question and they have answered, warmly thank them for their time and explicitly tell them: "That wraps it up on my end! You can go ahead and click the End Interview button whenever you're ready." and immediately stop talking.`
                    }
                ]
            },
            voice: {
                provider: "11labs",
                voiceId: "bIHbv24MWmeRgasZH58o", // premium voice
            }
        });
    };

    const endInterviewAndAnalyze = async () => {
        if (isRecording) vapi.stop();

        if (!transcript.trim()) {
            alert("No transcript found. Please talk during the interview before ending.");
            return;
        }

        setIsAnalyzing(true);
        setStep("ANALYZING");
        try {
            const res = await fetch("/api/analyze-answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questions: questions, fullTranscript: transcript, frames }),
            });
            if (!res.ok) throw new Error("Analysis failed");

            const records: Record<string, FeedbackReport> = await res.json();
            setFeedbackRecords(records);
            setStep("REPORT");
        } catch (err) {
            alert("Error analyzing interview.");
            setStep("INTERVIEWING");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleRestart = () => {
        setStep("UPLOAD");
        setProfile(null);
        setQuestions([]);
        setCurrentQIndex(0);
        setTranscript("");
        setCurrentFeedback(null);
        setFeedbackRecords({});
    };

    return (
        <div className="min-h-screen relative overflow-x-hidden">
            <div className="ambient-background" />
            <div className="grid-crosses opacity-50" />

            {/* Navbar */}
            <nav className="relative z-10 border-b border-white/5 backdrop-blur-md bg-black/50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2.5">
                        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                            <circle cx="16" cy="16" r="14" stroke="#e8985a" strokeWidth="2.5" fill="none" />
                            <circle cx="12" cy="16" r="3" fill="#e8985a" />
                            <path d="M18 13 C22 13 22 19 18 19" stroke="#e8985a" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M20 11 C25 11 25 21 20 21" stroke="#e8985a" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                        </svg>
                        <span className="font-bold text-lg">PrepWise</span>
                    </Link>
                    <Link href="/dashboard" className="btn-outline text-sm py-2 px-5 backdrop-blur-md">← Exit Session</Link>
                </div>
            </nav>

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
                                            setProfile({ name: "Candidate", email: "", skills: [module.title], experience: [], education: [], summary: "Custom Module Assessment" });
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
                                    <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-mono text-[var(--primary)]">GPT-4o</span>
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
                                        {profile.skills.slice(0, 4).map((s, i) => (
                                            <span key={i} className="text-xs px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)]">{s}</span>
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

                {/* STEP: Interviewing (The State-of-the-Art Room) */}
                {step === "INTERVIEWING" && (
                    <div className="animate-fade-in-up flex flex-col min-h-[75vh]">

                        {/* Header info */}
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center font-mono text-[var(--primary)] font-bold text-lg border border-[var(--primary)]/20 shadow-[0_0_15px_rgba(200,162,255,0.2)]">
                                    AI
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest">Active Session</h2>
                                    <p className="text-lg font-semibold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Continuous Neural Stream</p>
                                </div>
                            </div>
                            <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-sm font-bold flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                Live
                            </span>
                        </div>

                        {/* Floating Webcam Feed */}
                        <div className="absolute top-4 right-4 z-50 w-48 h-36 rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)] bg-black/50 backdrop-blur-md flex items-center justify-center">
                            {cameraError ? (
                                <p className="text-xs text-red-400 text-center px-2">{cameraError}</p>
                            ) : (
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                            )}
                            <canvas ref={canvasRef} className="hidden" />
                        </div>

                        {/* The Main Stage */}
                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-8">

                            {/* Left Column: AI Visualizer & Question */}
                            <div className="lg:col-span-3 flex flex-col gap-6">
                                <div className="glass-card p-10 relative overflow-hidden flex-1 flex flex-col justify-center items-center min-h-[350px] border-[var(--primary)]/10">
                                    {/* Dynamic background glow based on volume */}
                                    <div
                                        className="absolute inset-0 bg-[var(--primary)]/20 transition-opacity duration-75 mix-blend-screen"
                                        style={{ opacity: isRecording ? (volumeLevel * 1.5) : 0 }}
                                    />

                                    {/* The AI Voice Orb Visualizer */}
                                    <div className="relative mb-8 mt-4">
                                        {/* Ring 1 */}
                                        <div className="absolute inset-0 rounded-full border border-[var(--primary)]/30 animate-spin" style={{ animationDuration: '8s' }}></div>
                                        {/* Ring 2 */}
                                        <div className="absolute inset-[-10px] rounded-full border border-[var(--accent)]/20 animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }}></div>

                                        {/* Core Orb */}
                                        <div
                                            className={`w-32 h-32 rounded-full relative z-10 flex items-center justify-center transition-all duration-75 ${isRecording ? "bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] shadow-[0_0_60px_rgba(200,162,255,0.5)]" : "bg-white/5 border border-white/10"}`}
                                            style={{
                                                transform: `scale(${isRecording ? 1 + (volumeLevel * 0.4) : 1})`,
                                                boxShadow: isRecording ? `0 0 ${40 + (volumeLevel * 100)}px rgba(200,162,255,${0.3 + volumeLevel})` : 'none'
                                            }}
                                        >
                                            {isRecording ? (
                                                <div className="flex gap-1.5 items-center justify-center w-full h-full opacity-80 mix-blend-overlay">
                                                    {[1, 2, 3, 4, 5].map((i) => (
                                                        <div
                                                            key={i}
                                                            className="w-1.5 bg-white rounded-full transition-all duration-75"
                                                            style={{ height: `${20 + (volumeLevel * 100 * (Math.random() * 0.5 + 0.5))}%` }}
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <svg width="40" height="40" viewBox="0 0 32 32" fill="none" className="opacity-30">
                                                    <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="none" />
                                                    <circle cx="12" cy="16" r="3" fill="currentColor" />
                                                    <path d="M18 13 C22 13 22 19 18 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>

                                    {/* Question Text displayed boldly */}
                                    <div className="text-center relative z-10 w-full mb-4">
                                        <h1 className="text-2xl md:text-3xl font-bold leading-tight text-white/90">
                                            {isRecording ? "Live Interview In Progress" : "System Standby"}
                                        </h1>
                                        <p className="text-white/50 mt-2">{isRecording ? "Speak naturally to the AI interviewer. They will guide you through all questions." : "Initialize the system call to begin the gauntlet."}</p>
                                    </div>

                                    {!isRecording ? (
                                        <button onClick={startVapiCall} className="mt-6 btn-primary flex items-center gap-3 text-lg px-8 py-4 shadow-[0_0_30px_rgba(200,162,255,0.3)] animate-pulse-ring">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                            Start Call & Listen
                                        </button>
                                    ) : (
                                        <div className="mt-6 text-center bg-black/40 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/10 z-10 flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
                                            <span className="font-mono text-sm text-white/70">
                                                {aiSpeaking ? "INTERVIEWER IS SPEAKING..." : "LISTENING TO CANDIDATE..."}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Dynamic Transcript & Controls */}
                            <div className="lg:col-span-2 flex flex-col gap-6">
                                <div className="glass-card p-6 flex flex-col flex-1 relative overflow-hidden border-white/5">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-50"></div>

                                    <div className="flex items-center gap-3 mb-6">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--primary)]"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                                        <h3 className="font-semibold text-white/80 tracking-wide uppercase text-sm">Live Neural Transcript</h3>
                                    </div>

                                    <div className="flex-1 bg-black/40 rounded-xl p-5 text-base leading-relaxed overflow-y-auto max-h-[350px] border border-white/5 font-mono text-cyan-50/70 shadow-inner relative custom-scrollbar">
                                        {transcript ? (
                                            <div className="space-y-3">
                                                <span className="text-[var(--primary)] font-bold opacity-50">{profile?.name || "YOU"}: </span>
                                                {transcript}
                                                {isRecording && !aiSpeaking && <span className="inline-block w-2h-4 ml-1 bg-[var(--primary)] animate-pulse">_</span>}
                                                <div ref={messagesEndRef} />
                                            </div>
                                        ) : (
                                            <div className="h-full flex items-center justify-center flex-col opacity-30 text-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-3"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
                                                Awaiting voice input...
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={endInterviewAndAnalyze}
                                        disabled={isAnalyzing || (!transcript.trim() && !isRecording)}
                                        className="mt-6 w-full py-4 text-white hover:text-black font-extrabold rounded-xl transition-all disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed flex justify-center items-center gap-3 text-base group relative overflow-hidden bg-transparent border border-white/20 hover:bg-white"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:text-black text-red-400 group-hover:scale-110 transition-transform"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><line x1="9" x2="15" y1="9" y2="15" /><line x1="15" x2="9" y1="9" y2="15" /></svg>
                                        End Interview & Analyze Transcript
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
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
