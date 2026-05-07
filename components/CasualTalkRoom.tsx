"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
    Mic, MicOff, Video, VideoOff, PhoneOff, Loader2,
    Sparkles, MessageSquare, User, Bot, Clock, AlertCircle,
    Eye, EyeOff, Smile, Frown, Meh, Activity, Brain,
    Heart, Zap, Coffee, MessageCircle, Volume2, VolumeX
} from "lucide-react";
import Vapi from "@vapi-ai/web";
import { FrameAnalysis } from "../lib/feedbackAnalyzer";

const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "dummy_key");

// ── Emotion icon helper ────────────────────────────────────────────────────
function EmotionIcon({ emotion, size = 14 }: { emotion: string; size?: number }) {
    if (["happy", "surprise"].includes(emotion)) return <Smile size={size} className="text-green-400" />;
    if (["angry", "disgust", "fear", "sad"].includes(emotion)) return <Frown size={size} className="text-red-400" />;
    return <Meh size={size} className="text-yellow-400" />;
}

// ── Vibe label from emotion ────────────────────────────────────────────────
function vibeLabel(emotion: string): string {
    const map: Record<string, string> = {
        happy: "Great Vibe ✨",
        surprise: "Surprised!",
        sad: "A bit down",
        angry: "Fired Up 🔥",
        disgust: "Not feeling it",
        fear: "Nervous",
        neutral: "Chill 😌",
        unknown: "Reading...",
    };
    return map[emotion] || emotion;
}

// ── Confidence colour ──────────────────────────────────────────────────────
function confColour(score: number) {
    if (score >= 70) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
}

function confBar(score: number) {
    if (score >= 70) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
}

export default function CasualTalkRoom() {
    // ── Session state ────────────────────────────────────────────────────
    const [isCallActive, setIsCallActive] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [sessionDuration, setSessionDuration] = useState(0);
    const [conversationLog, setConversationLog] = useState<
        Array<{ role: string; text: string; time: string }>
    >([]);
    const [cameraError, setCameraError] = useState<string>("");
    const [hasStarted, setHasStarted] = useState(false);
    const [aiStatus, setAiStatus] = useState<"idle" | "listening" | "speaking">("idle");

    // ── Face detection state ───────────────────────────────────────────
    const [faceAnalysis, setFaceAnalysis] = useState<FrameAnalysis | null>(null);
    const [serviceOnline, setServiceOnline] = useState<boolean | null>(null);
    const [isAnalysingFrame, setIsAnalysingFrame] = useState(false);
    const [totalFrames, setTotalFrames] = useState(0);

    // ── Refs ──────────────────────────────────────────────────────────
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const faceIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // ── Check Python service health ────────────────────────────────────
    useEffect(() => {
        fetch("/api/analyse-frame")
            .then(r => r.json())
            .then(d => setServiceOnline(d.status === "ok"))
            .catch(() => setServiceOnline(false));
    }, []);

    // ── Webcam ────────────────────────────────────────────────────────
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
            setCameraError("Camera access denied. Session will continue without video.");
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
        return () => {
            stopCamera();
            if (timerRef.current) clearInterval(timerRef.current);
            if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
        };
    }, [startCamera, stopCamera]);

    // Re-attach stream when view changes (pre → active)
    useEffect(() => {
        if (videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [hasStarted]);

    // ── Session timer ──────────────────────────────────────────────────
    useEffect(() => {
        if (isCallActive) {
            timerRef.current = setInterval(() => setSessionDuration(p => p + 1), 1000);
        } else {
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isCallActive]);

    // ── Auto-scroll chat ───────────────────────────────────────────────
    useEffect(() => {
        if (chatContainerRef.current)
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }, [conversationLog]);

    // ── Face detection loop (every 5s, always-on while camera is on) ──
    const captureAndAnalyse = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current || !isCameraOn) return;
        const video = videoRef.current;
        if (video.readyState < 2) return;

        const canvas = canvasRef.current;
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

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
            if (!data.service_offline) setTotalFrames(p => p + 1);
        } catch { /* silent fail */ }
        finally { setIsAnalysingFrame(false); }
    }, [isCameraOn]);

    // Start face detection immediately when camera is on, every 5s
    useEffect(() => {
        if (isCameraOn) {
            captureAndAnalyse(); // immediate first frame
            faceIntervalRef.current = setInterval(captureAndAnalyse, 5000);
        } else {
            if (faceIntervalRef.current) { clearInterval(faceIntervalRef.current); faceIntervalRef.current = null; }
        }
        return () => { if (faceIntervalRef.current) clearInterval(faceIntervalRef.current); };
    }, [isCameraOn, captureAndAnalyse]);

    // ── Helpers ────────────────────────────────────────────────────────
    const formatTime = (s: number) =>
        `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    const getTimeString = () =>
        new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    // ── Casual AI System Prompt ────────────────────────────────────────
    const buildSystemPrompt = () => {
        const emotionHint = faceAnalysis?.dominant_emotion && !faceAnalysis.service_offline
            ? `\n\nNOTE: The user's current visible emotion is "${faceAnalysis.dominant_emotion}". Be sensitive to this — if they look nervous, be extra encouraging; if they look happy, match that energy!`
            : "";

        return `You are Alex, a warm, witty, and encouraging AI companion for PrepWise. This is NOT an interview — it's a casual conversation to help the user feel comfortable talking, practice expressing their thoughts, and just enjoy a relaxed chat.

YOUR PERSONALITY:
- Warm, friendly, and genuinely interested in what the user says
- Occasionally playful and humorous — you can crack light jokes
- Encouraging: celebrate their thoughts, build confidence
- Never critical or judgemental
- Use casual language: "Hey!", "Oh nice!", "That's interesting!", "I get that!", "Totally makes sense"
- Keep responses SHORT and conversational — 2-3 sentences max unless asked something deep
- Ask follow-up questions to keep the conversation flowing

WHAT YOU CAN TALK ABOUT:
- Career goals and aspirations
- Tech topics the user wants to explore
- Mock soft-skill scenarios (how to explain yourself, how to pitch an idea)
- Life, work-life balance, impostor syndrome
- Anything the user brings up — just be a good listener!

HOW TO START:
"Hey! Great to meet you 😊 I'm Alex — think of me as your friendly chat partner. No pressure here, no evaluation, just a relaxed conversation. What's on your mind today — want to chat about your career, practice explaining a technical concept, or just talk about whatever?"

RULES:
- Keep it casual and short
- Never ask interview-style questions (no "tell me your weaknesses")
- If they want to practice something specific, help them naturally
- Be a positive presence${emotionHint}`;
    };

    // ── VAPI events ────────────────────────────────────────────────────
    useEffect(() => {
        vapi.on("call-start", () => {
            setIsCallActive(true);
            setIsStarting(false);
            setHasStarted(true);
            setAiStatus("listening");
        });
        vapi.on("call-end", () => {
            setIsCallActive(false);
            setAiStatus("idle");
        });
        vapi.on("speech-start", () => setAiStatus("speaking"));
        vapi.on("speech-end", () => setAiStatus("listening"));
        vapi.on("message", (msg: any) => {
            if (msg.type === "transcript" && msg.transcriptType === "final") {
                const t = getTimeString();
                if (msg.role === "user") {
                    setConversationLog(p => [...p, { role: "user", text: msg.transcript, time: t }]);
                } else if (msg.role === "assistant") {
                    setConversationLog(p => [...p, { role: "assistant", text: msg.transcript, time: t }]);
                }
            }
        });
        return () => { vapi.removeAllListeners(); };
    }, []);

    // ── Start session ──────────────────────────────────────────────────
    const startSession = async () => {
        setIsStarting(true);
        setConversationLog([]);
        setSessionDuration(0);
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

    // ── End session ────────────────────────────────────────────────────
    const endSession = () => {
        if (isCallActive) vapi.stop();
        setHasStarted(false);
        setIsCallActive(false);
        setConversationLog([]);
        setSessionDuration(0);
        setAiStatus("idle");
    };

    // ── Mute ──────────────────────────────────────────────────────────
    const toggleMute = () => {
        setIsMuted(m => { vapi.setMuted(!m); return !m; });
    };

    // ═══════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════
    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 py-6 animate-fade-in-up">
            {/* Hidden canvas for frame capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                        <MessageCircle size={16} className="text-[var(--accent)]" />
                        <span className="text-sm font-bold text-white/80">Casual Talk with Alex</span>
                    </div>
                    {isCallActive && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full animate-pulse">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-[10px] font-black text-green-400 uppercase tracking-wider">
                                {aiStatus === "speaking" ? "Alex is Talking" : "Listening..."}
                            </span>
                        </div>
                    )}
                    {/* Vision badge */}
                    {serviceOnline !== false && (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${serviceOnline === null ? 'bg-white/5 border-white/10 text-white/30' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                            <Activity size={11} />
                            {serviceOnline === null ? "Checking Vision..." : "Vision Active"}
                        </div>
                    )}
                </div>
                {isCallActive && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                        <Clock size={14} className="text-white/40" />
                        <span className="text-sm font-mono text-white/60">{formatTime(sessionDuration)}</span>
                    </div>
                )}
            </div>

            {/* ── Pre-session screen ── */}
            {!hasStarted ? (
                <div className="glass-card p-16 flex flex-col items-center justify-center text-center min-h-[500px] border-white/5 relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-30" />

                    {/* Camera preview */}
                    <div className="relative w-48 h-48 rounded-full overflow-hidden border-2 border-[var(--accent)]/30 mb-8 shadow-[0_0_60px_rgba(232,152,90,0.15)]">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                        {cameraError && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                <User size={48} className="text-white/20" />
                            </div>
                        )}
                        {/* Emotion overlay on pre-screen */}
                        {faceAnalysis && !faceAnalysis.service_offline && faceAnalysis.face_detected && (
                            <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                                <span className="px-2 py-0.5 rounded-full bg-black/70 text-[9px] font-bold text-green-400 capitalize">
                                    {faceAnalysis.dominant_emotion}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                        <Coffee size={20} className="text-[var(--accent)]" />
                        <h2 className="text-3xl font-extrabold tracking-tight">Ready to Chat?</h2>
                    </div>
                    <p className="text-white/40 text-lg max-w-lg mb-2">
                        No interviews, no pressure. Just a relaxed conversation with Alex — practice talking, think out loud, or just say hi.
                    </p>
                    <p className="text-white/25 text-sm mb-8">
                        Your camera stays on so Alex can pick up on your vibe 😊
                    </p>

                    {cameraError && (
                        <div className="flex items-center gap-2 px-4 py-2 mb-6 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                            <AlertCircle size={16} className="text-yellow-400" />
                            <span className="text-xs text-yellow-400">{cameraError}</span>
                        </div>
                    )}

                    <button
                        onClick={startSession}
                        disabled={isStarting}
                        className="group relative px-12 py-4 bg-white text-black font-extrabold text-lg rounded-full overflow-hidden transition-all hover:scale-105 shadow-[0_0_40px_rgba(232,152,90,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)] to-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <span className="relative z-10 flex items-center gap-3">
                            {isStarting
                                ? <><Loader2 className="animate-spin" size={20} /> Connecting...</>
                                : <><MessageCircle size={20} /> Start Chatting</>}
                        </span>
                    </button>
                </div>
            ) : (
                /* ── Active session ── */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Left: video + face panel + controls ── */}
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

                            {/* Live badge */}
                            {isCallActive && (
                                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[9px] font-bold text-white/80 uppercase">You</span>
                                </div>
                            )}

                            {/* Face detection overlay badge */}
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

                            {/* AI speaking wave on video bottom */}
                            {aiStatus === "speaking" && (
                                <div className="absolute bottom-3 left-0 right-0 flex flex-col items-center gap-1">
                                    <div className="flex gap-1 h-5 items-end">
                                        {[...Array(6)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="voice-wave-bar"
                                                style={{ animationDelay: `${i * 0.12}s`, height: `${8 + Math.random() * 12}px` }}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-[8px] text-[var(--accent)] font-bold uppercase tracking-wider">Alex Speaking</span>
                                </div>
                            )}

                            <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
                                <span className="text-xs font-semibold text-white/80">You</span>
                            </div>
                        </div>

                        {/* Vibe Check Panel */}
                        {serviceOnline && (
                            <div className="glass-card p-4 border-white/5">
                                <h4 className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-3 flex items-center gap-2">
                                    <Heart size={11} className="text-[var(--accent)]" /> Vibe Check
                                </h4>
                                {faceAnalysis && !faceAnalysis.service_offline ? (
                                    <div className="space-y-3">
                                        {/* Vibe / Emotion */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-white/40 flex items-center gap-1.5">
                                                <EmotionIcon emotion={faceAnalysis.dominant_emotion} size={13} />
                                                Your Vibe
                                            </span>
                                            <span className="text-xs font-bold text-white/80">
                                                {vibeLabel(faceAnalysis.dominant_emotion)}
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
                                            <span className={`text-xs font-bold ${faceAnalysis.eye_contact ? "text-green-400" : "text-yellow-400"}`}>
                                                {faceAnalysis.eye_contact ? "✓ Natural" : "Look at the camera"}
                                            </span>
                                        </div>

                                        {/* Feedback hint */}
                                        {faceAnalysis.feedback_text && (
                                            <p className="text-[10px] text-white/30 italic border-t border-white/5 pt-2 leading-relaxed">
                                                {faceAnalysis.feedback_text}
                                            </p>
                                        )}

                                        <div className="text-[9px] text-white/20 text-right">
                                            {totalFrames} snapshot{totalFrames !== 1 ? "s" : ""} taken
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center py-4 gap-2">
                                        <div className="w-8 h-8 border-2 border-white/10 border-t-[var(--accent)] rounded-full animate-spin" />
                                        <span className="text-[10px] text-white/30">Reading your vibe...</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Alex card */}
                        <div className="glass-card p-5 border-white/5">
                            <div className="flex items-center gap-4">
                                <div className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 ${isCallActive ? "bg-[var(--accent)]/20 shadow-[0_0_30px_rgba(232,152,90,0.2)]" : "bg-white/5"}`}>
                                    {isCallActive && <div className="absolute inset-0 rounded-full border-2 border-[var(--accent)] animate-ping opacity-20" />}
                                    <Bot size={24} className="text-[var(--accent)]" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white/90 text-sm">Alex — Chat Companion</h4>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">
                                        {aiStatus === "speaking" ? (
                                            <span className="flex items-center gap-1.5">
                                                <span className="flex gap-0.5">
                                                    <span className="w-1 h-3 bg-[var(--accent)] rounded-full animate-bounce" />
                                                    <span className="w-1 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                                                    <span className="w-1 h-3 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                                                </span>
                                                Talking
                                            </span>
                                        ) : aiStatus === "listening" ? (
                                            <span className="text-green-400">Listening...</span>
                                        ) : "Offline"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={toggleMute}
                                className={`p-3 rounded-full border transition-all ${isMuted ? "bg-red-500/20 border-red-500/30 text-red-400" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"}`}
                                title={isMuted ? "Unmute" : "Mute"}
                            >
                                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                            </button>
                            <button
                                onClick={toggleCamera}
                                className={`p-3 rounded-full border transition-all ${!isCameraOn ? "bg-red-500/20 border-red-500/30 text-red-400" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"}`}
                                title={isCameraOn ? "Turn off camera" : "Turn on camera"}
                            >
                                {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
                            </button>
                            <button
                                onClick={endSession}
                                className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white/80 font-bold text-sm flex items-center gap-2 transition-all border border-white/20"
                            >
                                <PhoneOff size={16} /> End Session
                            </button>
                        </div>
                    </div>

                    {/* ── Right: Conversation ── */}
                    <div className="lg:col-span-2 flex flex-col gap-4">

                        {/* Chat header */}
                        <div className="glass-card p-6 border-[var(--accent)]/15 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-50" />
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex-shrink-0">
                                    <Zap size={18} className="text-[var(--accent)]" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-[var(--accent)] font-black uppercase tracking-[0.3em]">Live Session</p>
                                    <h3 className="text-lg font-bold text-white/90">
                                        {aiStatus === "speaking"
                                            ? "Alex is responding..."
                                            : aiStatus === "listening"
                                                ? "I'm all ears — go ahead!"
                                                : "Chat freely, no pressure 😊"}
                                    </h3>
                                </div>
                            </div>
                        </div>

                        {/* Conversation log */}
                        <div className="glass-card border-white/5 flex flex-col flex-1" style={{ minHeight: '400px', maxHeight: '540px' }}>
                            <div className="px-5 pt-4 pb-0">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/25 flex items-center gap-2">
                                    <Sparkles size={12} /> Conversation
                                </h3>
                            </div>
                            <div
                                ref={chatContainerRef}
                                className="flex-1 overflow-y-auto custom-scrollbar space-y-3 px-5 py-3"
                                style={{ scrollBehavior: "smooth" }}
                            >
                                {conversationLog.length === 0 && (
                                    <div className="flex items-center justify-center h-full">
                                        {isCallActive ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="flex gap-1.5 h-6 items-center">
                                                    <span className="w-1.5 h-full bg-[var(--accent)] rounded-full animate-bounce" />
                                                    <span className="w-1.5 h-2/3 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                                                    <span className="w-1.5 h-full bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                                                </div>
                                                <p className="text-sm text-white/30">Alex is warming up...</p>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-white/20">Your conversation will appear here.</p>
                                        )}
                                    </div>
                                )}
                                {conversationLog.map((entry, i) => (
                                    <div key={i} className={`flex gap-3 chat-message ${entry.role === "user" ? "flex-row-reverse" : ""}`}>
                                        <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${entry.role === "user" ? "bg-[var(--primary)]/20 border border-[var(--primary)]/30" : "bg-[var(--accent)]/20 border border-[var(--accent)]/30"}`}>
                                            {entry.role === "user"
                                                ? <User size={12} className="text-[var(--primary)]" />
                                                : <Bot size={12} className="text-[var(--accent)]" />}
                                        </div>
                                        <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${entry.role === "user" ? "bg-[var(--primary)]/10 border border-[var(--primary)]/15 text-white/80 rounded-tr-sm" : "bg-[var(--accent)]/10 border border-[var(--accent)]/15 text-white/70 rounded-tl-sm"}`}>
                                            <p>{entry.text}</p>
                                            <span className="text-[9px] text-white/20 mt-1 block">
                                                {entry.role === "user" ? "You" : "Alex"} • {entry.time}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tips panel */}
                        <div className="glass-card p-4 border-white/5">
                            <h4 className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-3">Quick Conversation Starters</h4>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    "Tell me about my career options",
                                    "Help me explain REST APIs simply",
                                    "How do I manage interview nerves?",
                                    "Practice pitching myself",
                                    "What is system design?",
                                ].map((tip) => (
                                    <span
                                        key={tip}
                                        className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/40 cursor-default hover:text-white/60 transition-colors"
                                    >
                                        {tip}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
