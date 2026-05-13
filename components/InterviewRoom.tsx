"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Question } from "../lib/questions";
import {
    Mic, MicOff, Video, VideoOff, PhoneOff, Loader2,
    Sparkles, MessageSquare, User, Bot, Clock, AlertCircle,
    Eye, EyeOff, Smile, Frown, Meh, Activity, Brain
} from "lucide-react";
import Vapi from "@vapi-ai/web";
import { FeedbackReport, FrameAnalysis, VisualAnalysisSummary } from "../lib/feedbackAnalyzer";

interface InterviewRoomProps {
    questions: Question[];
    onInterviewComplete: (feedbackRecords: Record<string, FeedbackReport>) => void;
}

const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "dummy_key");

// ── Emotion icon helper ──────────────────────────────────────────────────────
function EmotionIcon({ emotion, size = 14 }: { emotion: string; size?: number }) {
    if (["happy", "surprise"].includes(emotion)) return <Smile size={size} className="text-green-400" />;
    if (["angry", "disgust", "fear", "sad"].includes(emotion)) return <Frown size={size} className="text-red-400" />;
    return <Meh size={size} className="text-yellow-400" />;
}

// ── Confidence colour ────────────────────────────────────────────────────────
function confColour(score: number) {
    if (score >= 70) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
}

// ── Confidence bar width ─────────────────────────────────────────────────────
function confBar(score: number) {
    if (score >= 70) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
}

export default function InterviewRoom({ questions, onInterviewComplete }: InterviewRoomProps) {

    // ── Interview state ──────────────────────────────────────────────────────
    const [isCallActive, setIsCallActive] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [displayedQuestion, setDisplayedQuestion] = useState<string>("");
    const [transcript, setTranscript] = useState<string>("");
    const [conversationLog, setConversationLog] = useState<Array<{ role: string; text: string; time: string }>>([]);
    const [interviewDuration, setInterviewDuration] = useState(0);
    const [isEnding, setIsEnding] = useState(false);
    const [cameraError, setCameraError] = useState<string>("");
    const [hasStarted, setHasStarted] = useState(false);

    // ── Face detection state ─────────────────────────────────────────────────
    const [faceAnalysis, setFaceAnalysis] = useState<FrameAnalysis | null>(null);
    const [frameHistory, setFrameHistory] = useState<FrameAnalysis[]>([]);
    const [serviceOnline, setServiceOnline] = useState<boolean | null>(null);  // null = checking
    const [isAnalysingFrame, setIsAnalysingFrame] = useState(false);

    // ── Refs ─────────────────────────────────────────────────────────────────
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);        // hidden canvas for capture
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const faceIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const questionIndexRef = useRef(0);
    const frameHistoryRef = useRef<FrameAnalysis[]>([]);     // keep in sync for closure access

    // ── Keep frameHistoryRef in sync ─────────────────────────────────────────
    useEffect(() => {
        frameHistoryRef.current = frameHistory;
    }, [frameHistory]);

    // ── Check Python service health ──────────────────────────────────────────
    useEffect(() => {
        fetch("/api/analyse-frame")
            .then(r => r.json())
            .then(d => setServiceOnline(d.status === "ok"))
            .catch(() => setServiceOnline(false));
    }, []);

    // ── Webcam ───────────────────────────────────────────────────────────────
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
            setCameraError("");
        } catch {
            setCameraError("Camera access denied. Interview will continue without video.");
        }
    }, []);

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
    }, []);

    const toggleCamera = useCallback(() => {
        if (isCameraOn) { stopCamera(); setIsCameraOn(false); }
        else { startCamera(); setIsCameraOn(true); }
    }, [isCameraOn, startCamera, stopCamera]);

    useEffect(() => {
        startCamera();
        return () => { stopCamera(); if (timerRef.current) clearInterval(timerRef.current); };
    }, [startCamera, stopCamera]);

    // ── Re-attach stream when the active video element swaps (pre → active screen) ──
    useEffect(() => {
        if (videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [hasStarted]);

    // ── Interview timer ──────────────────────────────────────────────────────
    useEffect(() => {
        if (isCallActive) {
            timerRef.current = setInterval(() => setInterviewDuration(p => p + 1), 1000);
        } else {
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isCallActive]);

    // ── Auto-scroll chat ─────────────────────────────────────────────────────
    useEffect(() => {
        if (chatContainerRef.current)
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }, [conversationLog]);

    // ── Face detection loop (every 4 seconds while call active) ─────────────
    const captureAndAnalyse = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current || !isCameraOn) return;
        const video = videoRef.current;
        if (video.readyState < 2) return;   // not ready yet

        const canvas = canvasRef.current;
        canvas.width = 320;                 // small = faster
        canvas.height = 240;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Mirror-flip so it's the correct orientation for DeepFace
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const frame = canvas.toDataURL("image/jpeg", 0.7);

        setIsAnalysingFrame(true);
        try {
            const res = await fetch("/api/analyse-frame", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ frame }),
            });
            const data: FrameAnalysis = await res.json();
            setFaceAnalysis(data);
            if (!data.service_offline) {
                setFrameHistory(prev => [...prev, data]);
            }
        } catch { /* silent fail — service may be offline */ }
        finally { setIsAnalysingFrame(false); }
    }, [isCameraOn]);

    useEffect(() => {
        if (isCallActive) {
            faceIntervalRef.current = setInterval(captureAndAnalyse, 4000);
        } else {
            if (faceIntervalRef.current) { clearInterval(faceIntervalRef.current); faceIntervalRef.current = null; }
        }
        return () => { if (faceIntervalRef.current) clearInterval(faceIntervalRef.current); };
    }, [isCallActive, captureAndAnalyse]);

    // ── Helpers ──────────────────────────────────────────────────────────────
    const formatTime = (s: number) =>
        `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    const getTimeString = () =>
        new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    // ── AI System Prompt ─────────────────────────────────────────────────────
    const buildSystemPrompt = () => {
        const questionList = questions.map((q, i) =>
            `Question ${i + 1}: "${q.question}" [Category: ${q.category}, Difficulty: ${q.difficulty}]`
        ).join("\n");

        return `You are a warm, professional, experienced senior technical interviewer named Alex conducting a mock interview for PrepWise. You have a natural, human-like conversational style — friendly but serious about evaluation.

PERSONALITY & TONE:
- Speak naturally like a real human interviewer, not robotic
- Use natural filler words: "great", "interesting", "sure", "alright", "okay so..."
- Show genuine interest in the candidate's responses
- Give brief encouraging reactions before moving on
- Vary your transitions between questions
- Maintain a professional but warm demeanor

INTERVIEW STRUCTURE:
1. Start: "Hi there! Welcome to your PrepWise mock interview. I'm Alex, I'll be your interviewer today. Are you ready to get started?"
2. Wait for a response, then begin Question 1.
3. After each answer: brief acknowledgment (1-2 sentences), then naturally move to the next question.
4. After the LAST question wrap up: "That wraps up all our questions for today! Thank you so much for your time — best of luck with your preparation!"

QUESTIONS TO ASK (in order):
${questionList}

CRITICAL RULES:
- Ask EVERY question in the list, in order, one at a time
- NEVER skip a question
- Wait for the candidate to finish before moving on
- Keep your reactions brief — this is THEIR interview
- If they don't know, say "No worries, let's move to the next one."
- Do NOT provide the answer yourself
- Announce each topic area naturally: "Alright, let's move on to [category]..."
- After the final question, give a warm closing statement and say goodbye`;
    };

    // ── Question detection from AI text ─────────────────────────────────────
    const detectQuestionFromAIText = useCallback((text: string) => {
        const lowerText = text.toLowerCase();
        for (let i = questionIndexRef.current; i < questions.length; i++) {
            const qWords = questions[i].question.toLowerCase().split(" ").slice(0, 6).join(" ");
            if (lowerText.includes(qWords) ||
                lowerText.includes(`question ${i + 1}`) ||
                lowerText.includes(questions[i].category.toLowerCase())) {
                questionIndexRef.current = i;
                setCurrentQuestionIndex(i);
                setDisplayedQuestion(questions[i].question);
                return;
            }
        }
    }, [questions]);

    // ── VAPI events ──────────────────────────────────────────────────────────
    useEffect(() => {
        vapi.on("call-start", () => {
            setIsCallActive(true);
            setIsStarting(false);
            setHasStarted(true);
            setDisplayedQuestion(questions[0]?.question || "");
        });
        vapi.on("call-end", () => setIsCallActive(false));
        vapi.on("message", (msg: any) => {
            if (msg.type === "transcript" && msg.transcriptType === "final") {
                const t = getTimeString();
                if (msg.role === "user") {
                    setTranscript(p => p ? p + " " + msg.transcript : msg.transcript);
                    setConversationLog(p => [...p, { role: "user", text: msg.transcript, time: t }]);
                } else if (msg.role === "assistant") {
                    setConversationLog(p => [...p, { role: "assistant", text: msg.transcript, time: t }]);
                    detectQuestionFromAIText(msg.transcript);
                }
            }
        });
        vapi.on("error", (e) => {
            console.error("VAPI Error:", e);
            setIsCallActive(false);
            setIsStarting(false);
        });
        return () => { vapi.removeAllListeners(); };
    }, [questions, detectQuestionFromAIText]);

    // ── Start interview ──────────────────────────────────────────────────────
    const startInterview = async () => {
        setIsStarting(true);
        setTranscript("");
        setConversationLog([]);
        setFrameHistory([]);
        frameHistoryRef.current = [];
        setCurrentQuestionIndex(0);
        questionIndexRef.current = 0;
        setInterviewDuration(0);
        try {
            await vapi.start({
                model: {
                    provider: "groq",
                    model: "llama-3.3-70b-versatile",
                    messages: [{ role: "system", content: buildSystemPrompt() }],
                },
                voice: { provider: "11labs", voiceId: "bIHbv24MWmeRgasZH58o" },
            });
        } catch {
            setIsStarting(false);
        }
    };

    // ── End interview ────────────────────────────────────────────────────────
    const endInterview = async () => {
        setIsEnding(true);
        if (isCallActive) vapi.stop();
        if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
        stopCamera();

        // Fetch visual summary from Python service
        let visualSummary: VisualAnalysisSummary | undefined;
        if (frameHistoryRef.current.length > 0) {
            try {
                const r = await fetch("/api/analyse-frame", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "summarise", frames: frameHistoryRef.current }),
                });
                if (r.ok) visualSummary = await r.json();
            } catch { /* graceful */ }
        }

        const interviewId = localStorage.getItem("pw_current_interview_id");
        if (transcript.trim()) {
            try {
                const res = await fetch("/api/analyze-answer", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        questions,
                        fullTranscript: transcript,
                        interviewId,
                        timeTaken: interviewDuration,
                        currentDifficulty: "Medium",
                        visualSummary,
                    }),
                });
                if (res.ok) {
                    const data = await res.json();
                    // Attach visual summary to every feedback entry
                    const records = data.feedback || {};
                    if (visualSummary) {
                        Object.keys(records).forEach(k => {
                            records[k].visualSummary = visualSummary;
                            records[k].bodyLanguageFeedback = visualSummary.summary;
                        });
                    }
                    onInterviewComplete(records);
                    setIsEnding(false);
                    return;
                }
            } catch { /* fall through */ }
        }

        // Fallback
        const fallback: Record<string, FeedbackReport> = {};
        questions.forEach(q => {
            fallback[q.id] = {
                score: 50,
                metrics: { relevance: 5, semantic_similarity: 5, technical_depth: 5, communication: 5 },
                strengths: ["Attempted the interview"],
                weaknesses: ["Analysis could not be completed"],
                missedPoints: [],
                overallFeedback: "Interview completed. Detailed analysis unavailable.",
                suggestedAnswer: "Refer to documentation.",
                bodyLanguageFeedback: visualSummary?.summary,
                visualSummary,
            };
        });
        onInterviewComplete(fallback);
        setIsEnding(false);
    };

    // ── Mute ─────────────────────────────────────────────────────────────────
    const toggleMute = () => {
        setIsMuted(m => { vapi.setMuted(!m); return !m; });
    };

    // ═════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═════════════════════════════════════════════════════════════════════════
    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 py-6 animate-fade-in-up">
            {/* Hidden canvas for frame capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                        <Bot size={16} className="text-[var(--primary)]" />
                        <span className="text-sm font-bold text-white/80">PrepWise AI Interview</span>
                    </div>
                    {isCallActive && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full animate-pulse">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <span className="text-[10px] font-black text-red-400 uppercase tracking-wider">Live Session</span>
                        </div>
                    )}
                    {/* Face detection badge — only show when online or still checking */}
                    {serviceOnline !== false && (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${serviceOnline === null ? 'bg-white/5 border-white/10 text-white/30' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                            <Activity size={11} />
                            {serviceOnline === null ? "Checking Vision..." : "Vision Active"}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {isCallActive && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                            <Clock size={14} className="text-white/40" />
                            <span className="text-sm font-mono text-white/60">{formatTime(interviewDuration)}</span>
                        </div>
                    )}
                    <div className="text-xs font-mono text-white/30">Q {currentQuestionIndex + 1} / {questions.length}</div>
                </div>
            </div>

            {/* ── Pre-interview screen ── */}
            {!hasStarted ? (
                <div className="glass-card p-16 flex flex-col items-center justify-center text-center min-h-[500px] border-white/5 relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-30" />

                    <div className="relative w-48 h-48 rounded-full overflow-hidden border-2 border-[var(--primary)]/30 mb-8 shadow-[0_0_60px_rgba(200,162,255,0.15)]">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                        {cameraError && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                <User size={48} className="text-white/20" />
                            </div>
                        )}
                    </div>

                    <h2 className="text-3xl font-extrabold tracking-tight mb-3">Ready for Your Interview?</h2>
                    <p className="text-white/40 text-lg max-w-lg mb-2">
                        AI interviewer Alex will conduct a live, interactive session covering {questions.length} questions.
                    </p>
                    <p className="text-white/30 text-sm mb-4">
                        The interview continues until you press <span className="text-red-400 font-bold">End Interview</span>.
                    </p>

                    {cameraError && (
                        <div className="flex items-center gap-2 px-4 py-2 mb-6 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                            <AlertCircle size={16} className="text-yellow-400" />
                            <span className="text-xs text-yellow-400">{cameraError}</span>
                        </div>
                    )}

                    <button
                        onClick={startInterview}
                        disabled={isStarting}
                        className="group relative px-12 py-4 bg-white text-black font-extrabold text-lg rounded-full overflow-hidden transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <span className="relative z-10 flex items-center gap-3">
                            {isStarting ? <><Loader2 className="animate-spin" size={20} /> Connecting...</> : <><Mic size={20} /> Begin Interview</>}
                        </span>
                    </button>
                </div>
            ) : (
                /* ── Active interview ── */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Left column: video + face analysis + controls ── */}
                    <div className="lg:col-span-1 space-y-4">

                        {/* Video feed */}
                        <div className="glass-card overflow-hidden border-white/5 relative aspect-[4/3] bg-black">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                onLoadedMetadata={e => { (e.target as HTMLVideoElement).play().catch(() => { }); }}
                                className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${!isCameraOn ? 'opacity-0' : 'opacity-100'}`}
                            />
                            {!isCameraOn && (
                                <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a1a] to-[#1a1a2e] flex flex-col items-center justify-center">
                                    <User size={64} className="text-white/10 mb-3" />
                                    <span className="text-xs text-white/20 uppercase tracking-widest">Camera Off</span>
                                </div>
                            )}
                            {isCallActive && (
                                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-[9px] font-bold text-white/80 uppercase">You</span>
                                </div>
                            )}

                            {/* Face detection overlay badge on video */}
                            {faceAnalysis && !faceAnalysis.service_offline && (
                                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm border border-white/10">
                                    {faceAnalysis.face_detected ? (
                                        <>
                                            <Eye size={10} className="text-green-400" />
                                            <span className="text-[9px] text-green-400 font-bold capitalize">{faceAnalysis.dominant_emotion}</span>
                                        </>
                                    ) : (
                                        <>
                                            <EyeOff size={10} className="text-red-400" />
                                            <span className="text-[9px] text-red-400 font-bold">No Face</span>
                                        </>
                                    )}
                                    {isAnalysingFrame && <span className="text-[8px] text-white/30 ml-1 animate-pulse">●</span>}
                                </div>
                            )}

                            <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
                                <span className="text-xs font-semibold text-white/80">Candidate</span>
                            </div>
                        </div>

                        {/* Face Analysis Panel */}
                        {serviceOnline && (
                            <div className="glass-card p-4 border-white/5">
                                <h4 className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-3 flex items-center gap-2">
                                    <Brain size={11} /> Live Visual Analysis
                                </h4>
                                {faceAnalysis && !faceAnalysis.service_offline ? (
                                    <div className="space-y-3">
                                        {/* Emotion */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-white/40 flex items-center gap-1.5">
                                                <EmotionIcon emotion={faceAnalysis.dominant_emotion} size={13} />
                                                Emotion
                                            </span>
                                            <span className="text-xs font-bold text-white/80 capitalize">
                                                {faceAnalysis.dominant_emotion || "—"}
                                            </span>
                                        </div>

                                        {/* Confidence */}
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-xs text-white/40">Confidence</span>
                                                <span className={`text-xs font-bold ${confColour(faceAnalysis.confidence_score)}`}>
                                                    {faceAnalysis.confidence_score}%
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 rounded-full bg-white/10">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-700 ${confBar(faceAnalysis.confidence_score)}`}
                                                    style={{ width: `${faceAnalysis.confidence_score}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Eye contact */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-white/40">Eye Contact</span>
                                            <span className={`text-xs font-bold ${faceAnalysis.eye_contact ? "text-green-400" : "text-red-400"}`}>
                                                {faceAnalysis.eye_contact ? "✓ Good" : "✗ Look at camera"}
                                            </span>
                                        </div>

                                        {/* Feedback text */}
                                        {faceAnalysis.feedback_text && (
                                            <p className="text-[10px] text-white/30 italic border-t border-white/5 pt-2 leading-relaxed">
                                                {faceAnalysis.feedback_text}
                                            </p>
                                        )}

                                        {/* Frames count */}
                                        <div className="text-[9px] text-white/20 text-right">
                                            {frameHistory.length} frame{frameHistory.length !== 1 ? "s" : ""} analysed
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center py-4 gap-2">
                                        <div className="w-8 h-8 border-2 border-white/10 border-t-[var(--primary)] rounded-full animate-spin" />
                                        <span className="text-[10px] text-white/30">Waiting for first frame...</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* AI Interviewer card */}
                        <div className="glass-card p-5 border-white/5">
                            <div className="flex items-center gap-4">
                                <div className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 ${isCallActive ? "bg-[var(--primary)]/20 shadow-[0_0_30px_rgba(200,162,255,0.2)]" : "bg-white/5"}`}>
                                    {isCallActive && <div className="absolute inset-0 rounded-full border-2 border-[var(--primary)] animate-ping opacity-20" />}
                                    <Bot size={24} className="text-[var(--primary)]" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white/90 text-sm">Alex — AI Interviewer</h4>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">
                                        {isCallActive ? (
                                            <span className="flex items-center gap-1.5">
                                                <span className="flex gap-0.5">
                                                    <span className="w-1 h-3 bg-[var(--primary)] rounded-full animate-bounce" />
                                                    <span className="w-1 h-2 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                                                    <span className="w-1 h-3 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                                                </span>
                                                Speaking
                                            </span>
                                        ) : "Offline"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex gap-3 justify-center">
                            <button onClick={toggleMute}
                                className={`p-3 rounded-full border transition-all ${isMuted ? "bg-red-500/20 border-red-500/30 text-red-400" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"}`}
                                title={isMuted ? "Unmute" : "Mute"}>
                                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                            </button>
                            <button onClick={toggleCamera}
                                className={`p-3 rounded-full border transition-all ${!isCameraOn ? "bg-red-500/20 border-red-500/30 text-red-400" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"}`}
                                title={isCameraOn ? "Turn off camera" : "Turn on camera"}>
                                {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
                            </button>
                            <button onClick={endInterview} disabled={isEnding}
                                className="px-6 py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] end-btn-pulse">
                                {isEnding ? <><Loader2 className="animate-spin" size={16} /> Ending...</> : <><PhoneOff size={16} /> End Interview</>}
                            </button>
                        </div>
                    </div>

                    {/* ── Right column ── */}
                    <div className="lg:col-span-2 space-y-4 flex flex-col">

                        {/* Current question banner */}
                        <div className="glass-card p-6 border-[var(--primary)]/15 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-50" />
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex-shrink-0">
                                    <MessageSquare size={18} className="text-[var(--primary)]" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-[10px] text-[var(--primary)] font-black uppercase tracking-[0.3em]">
                                            Current Question — {currentQuestionIndex + 1}/{questions.length}
                                        </span>
                                        <span className={`text-[9px] px-2 py-0.5 rounded border uppercase font-mono ${questions[currentQuestionIndex]?.difficulty === "Hard" ? "text-red-400 bg-red-400/10 border-red-400/20" : questions[currentQuestionIndex]?.difficulty === "Easy" ? "text-green-400 bg-green-400/10 border-green-400/20" : "text-cyan-400 bg-cyan-400/10 border-cyan-400/20"}`}>
                                            {questions[currentQuestionIndex]?.difficulty} • {questions[currentQuestionIndex]?.category}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white/90 leading-relaxed">
                                        {displayedQuestion || questions[currentQuestionIndex]?.question || "Waiting for AI to start..."}
                                    </h3>
                                </div>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="flex gap-1.5 px-1">
                            {questions.map((_, i) => (
                                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i < currentQuestionIndex ? "bg-[var(--primary)]" : i === currentQuestionIndex ? "bg-[var(--primary)] animate-pulse" : "bg-white/10"}`} />
                            ))}
                        </div>

                        {/* Live conversation */}
                        <div className="glass-card border-white/5 flex flex-col" style={{ height: '320px' }}>
                            <div className="px-5 pt-4 pb-0">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/25 flex items-center gap-2">
                                    <Sparkles size={12} /> Live Conversation
                                </h3>
                            </div>
                            <div
                                ref={chatContainerRef}
                                className="flex-1 overflow-y-auto custom-scrollbar space-y-3 px-5 py-3"
                                style={{ scrollBehavior: 'smooth' }}
                            >
                                {conversationLog.length === 0 && (
                                    <div className="flex items-center justify-center h-full">
                                        {isCallActive ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="flex gap-1.5 h-6 items-center">
                                                    <span className="w-1.5 h-full bg-[var(--primary)] rounded-full animate-bounce" />
                                                    <span className="w-1.5 h-2/3 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                                                    <span className="w-1.5 h-full bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                                                </div>
                                                <p className="text-sm text-white/30">AI Interviewer is connecting...</p>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-white/20">Conversation will appear here once the interview begins.</p>
                                        )}
                                    </div>
                                )}
                                {conversationLog.map((entry, i) => (
                                    <div key={i} className={`flex gap-3 ${entry.role === "user" ? "flex-row-reverse" : ""}`}>
                                        <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${entry.role === "user" ? "bg-[var(--accent)]/20 border border-[var(--accent)]/30" : "bg-[var(--primary)]/20 border border-[var(--primary)]/30"}`}>
                                            {entry.role === "user" ? <User size={12} className="text-[var(--accent)]" /> : <Bot size={12} className="text-[var(--primary)]" />}
                                        </div>
                                        <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${entry.role === "user" ? "bg-[var(--accent)]/10 border border-[var(--accent)]/15 text-white/80 rounded-tr-sm" : "bg-white/5 border border-white/10 text-white/70 rounded-tl-sm"}`}>
                                            <p>{entry.text}</p>
                                            <span className="text-[9px] text-white/20 mt-1 block">
                                                {entry.role === "user" ? "You" : "Alex"} • {entry.time}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Upcoming questions */}
                        {currentQuestionIndex < questions.length - 1 && (
                            <div className="glass-card p-4 border-white/5">
                                <h4 className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-3">Upcoming Questions</h4>
                                <div className="space-y-2">
                                    {questions.slice(currentQuestionIndex + 1, currentQuestionIndex + 3).map((q, i) => (
                                        <div key={q.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5">
                                            <span className="text-[9px] font-mono text-white/20 w-5 flex-shrink-0">{currentQuestionIndex + 2 + i}</span>
                                            <span className="text-xs text-white/30 truncate">{q.question}</span>
                                            <span className={`text-[8px] px-1.5 py-0.5 rounded flex-shrink-0 ${q.difficulty === "Hard" ? "text-red-400/50 bg-red-400/5" : q.difficulty === "Easy" ? "text-green-400/50 bg-green-400/5" : "text-cyan-400/50 bg-cyan-400/5"}`}>
                                                {q.difficulty}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
