"use client";

import { useState, useRef, useEffect } from "react";
import {
    Send, Loader2, Compass, Sparkles, Globe,
    TrendingUp, Briefcase, Code2, MessagesSquare, User, Bot, AlertCircle,
    Mic, MicOff, PhoneOff, Phone, Video, VideoOff
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import Vapi from "@vapi-ai/web";

const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "dummy_key");

interface Message {
    role: "user" | "assistant";
    content: string;
}

const QUICK_PROMPTS = [
    { icon: <TrendingUp size={14} />, label: "Tech Trends", prompt: "What are the most in-demand frontend frameworks right now?" },
    { icon: <Briefcase size={14} />, label: "Hiring Market", prompt: "How is the hiring market for junior software engineers this month?" },
    { icon: <Globe size={14} />, label: "Recent News", prompt: "Summarize the major AI tech news from the past week." },
    { icon: <Code2 size={14} />, label: "Skill Gap", prompt: "I know React, what backend language should I learn next for fullstack?" }
];

export default function GuidanceChat() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Hello! I'm your Career Guidance Advisor. I have access to real-time Google Search to give you the most up-to-date information on tech trends, hiring markets, and interview timelines.\n\nHow can I help you navigate your career today?"
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Voice Session State
    const [isCallActive, setIsCallActive] = useState(false);
    const [isStartingCall, setIsStartingCall] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [aiStatus, setAiStatus] = useState<"idle" | "listening" | "speaking">("idle");

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // VAPI integration
    useEffect(() => {
        vapi.on("call-start", () => {
            setIsCallActive(true);
            setIsStartingCall(false);
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
                if (msg.role === "user") {
                    setMessages(prev => [...prev, { role: "user", content: msg.transcript }]);
                } else if (msg.role === "assistant") {
                    setMessages(prev => [...prev, { role: "assistant", content: msg.transcript }]);
                }
            }
        });
        vapi.on("error", (e) => {
            console.error("VAPI Error:", e);
            setIsCallActive(false);
            setIsStartingCall(false);
            setAiStatus("idle");
        });
        return () => { vapi.removeAllListeners(); };
    }, []);

    // Camera Handlers
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            console.error("Camera access denied:", err);
            setIsCameraOn(false);
        }
    };

    const stopCamera = () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
    };

    const startVoiceSession = async () => {
        setIsStartingCall(true);
        try {
            if (isCameraOn) {
                await startCamera();
            }
            await vapi.start({
                model: {
                    provider: "groq",
                    model: "llama-3.3-70b-versatile",
                    messages: [{
                        role: "system",
                        content: "You are an elite Technical Career Advisor and Tech News Analyst. The user is a software engineer using 'PrepWise' to prepare for interviews. Provide highly accurate, actionable career guidance. Be concise, professional, but friendly. Keep responses short and conversational since this is a voice call."
                    }],
                },
                voice: { provider: "11labs", voiceId: "bIHbv24MWmeRgasZH58o" }, // using same voice as casual talk
            });
        } catch {
            setIsStartingCall(false);
        }
    };

    const endVoiceSession = () => {
        if (isCallActive) vapi.stop();
        stopCamera();
        setIsCallActive(false);
        setAiStatus("idle");
    };

    const toggleMute = () => {
        setIsMuted(m => { vapi.setMuted(!m); return !m; });
    };

    const toggleCamera = () => {
        if (isCameraOn) { stopCamera(); setIsCameraOn(false); }
        else { startCamera(); setIsCameraOn(true); }
    };

    const sendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        setError(null);
        setInput("");

        const newMessages: Message[] = [...messages, { role: "user", content: text }];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            const res = await fetch("/api/guidance-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: newMessages }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to fetch response");

            setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col h-[calc(100vh-200px)] min-h-[500px] animate-fade-in-up">

            {/* Header */}
            <div className="glass-card mb-4 p-4 border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-[var(--accent)]/10 rounded-xl border border-[var(--accent)]/20">
                        <Compass className="text-[var(--accent)]" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white">Live Career Guidance</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-[9px] font-bold uppercase tracking-widest text-green-400">
                                <Sparkles size={10} /> {isCallActive ? "Live Call" : "Online"}
                            </span>
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold uppercase tracking-widest text-blue-400">
                                <Globe size={10} /> Search Grounded
                            </span>
                        </div>
                    </div>
                </div>

                {/* Voice Call & Camera Controls */}
                <div className="flex items-center gap-2">
                    {!isCallActive ? (
                        <button
                            onClick={startVoiceSession}
                            disabled={isStartingCall}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all text-xs font-bold text-white uppercase tracking-wider disabled:opacity-50"
                        >
                            {isStartingCall ? <Loader2 size={16} className="animate-spin" /> : <Phone size={16} />}
                            {isStartingCall ? "Connecting" : "Start Video Call"}
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-full border border-white/10">
                            {aiStatus === "speaking" && (
                                <div className="px-3 flex items-center gap-1">
                                    <span className="flex gap-0.5 h-3 items-end">
                                        <span className="w-1 h-full bg-[var(--accent)] rounded-full animate-bounce" />
                                        <span className="w-1 h-2/3 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                                        <span className="w-1 h-full bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                                    </span>
                                </div>
                            )}
                            <button
                                onClick={toggleMute}
                                className={`p-2 rounded-full border transition-all ${isMuted ? "bg-red-500/20 border-red-500/30 text-red-400" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"}`}
                                title={isMuted ? "Unmute" : "Mute"}
                            >
                                {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                            </button>
                            <button
                                onClick={toggleCamera}
                                className={`p-2 rounded-full border transition-all ${!isCameraOn ? "bg-red-500/20 border-red-500/30 text-red-400" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"}`}
                                title={isCameraOn ? "Turn off camera" : "Turn on camera"}
                            >
                                {isCameraOn ? <Video size={16} /> : <VideoOff size={16} />}
                            </button>
                            <button
                                onClick={endVoiceSession}
                                className="p-2 px-3 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all border border-red-500/30 flex items-center gap-1 text-xs font-bold"
                            >
                                <PhoneOff size={16} /> End
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Layout when call is active (shows camera beside chat) */}
            <div className={`flex flex-col md:flex-row gap-4 flex-1 overflow-hidden transition-all duration-500`}>

                {/* Camera Feed Side (Only visible during call) */}
                {isCallActive && (
                    <div className="md:w-1/3 glass-card border-white/5 overflow-hidden flex flex-col justify-between shrink-0 animate-fade-in-up">
                        <div className="relative w-full aspect-[4/3] bg-black">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                onLoadedMetadata={e => { (e.target as HTMLVideoElement).play().catch(() => { }); }}
                                className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${!isCameraOn ? 'opacity-0' : 'opacity-100'}`}
                            />
                            {!isCameraOn && (
                                <div className="absolute inset-0 bg-[#0a0a1a] flex flex-col items-center justify-center">
                                    <User size={48} className="text-white/10 mb-3" />
                                    <span className="text-xs text-white/20 uppercase tracking-widest">Camera Off</span>
                                </div>
                            )}
                            <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/60">
                                <span className="text-[10px] font-bold text-white/80">You</span>
                            </div>
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-center">
                            <div className="flex items-center gap-3">
                                <div className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all bg-[var(--accent)]/20 shadow-[0_0_20px_rgba(232,152,90,0.2)]`}>
                                    <div className="absolute inset-0 rounded-full border border-[var(--accent)] animate-ping opacity-20" />
                                    <Bot size={20} className="text-[var(--accent)]" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white/90 text-sm">Career Advisor</h4>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">
                                        {aiStatus === "speaking" ? <span className="text-[var(--accent)]">Speaking</span> : <span className="text-green-400">Listening</span>}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Chat Area */}
                <div className="glass-card flex-1 border-white/5 flex flex-col overflow-hidden relative min-w-0">

                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar space-y-6">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>

                                {/* Avatar */}
                                <div className="shrink-0 flex items-start">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${msg.role === "user" ? "bg-[var(--primary)]/20 border-[var(--primary)]/30 text-[var(--primary)]" : "bg-[var(--accent)]/20 border-[var(--accent)]/30 text-[var(--accent)]"}`}>
                                        {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                                    </div>
                                </div>

                                {/* Bubble */}
                                <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-sm ${msg.role === "user" ? "bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-white rounded-tr-sm" : "bg-black/40 border border-white/5 text-white/80 rounded-tl-sm chat-markdown-prose"}`}>
                                    {msg.role === "user" ? (
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                    ) : (
                                        <ReactMarkdown
                                            components={{
                                                a: ({ node, ...props }: any) => <a {...props} className="text-[var(--accent)] hover:underline" target="_blank" rel="noreferrer" />,
                                                code: ({ node, ...props }: any) => <code {...props} className="bg-white/10 px-1 py-0.5 rounded text-xs font-mono" />,
                                                strong: ({ node, ...props }: any) => <strong {...props} className="font-bold text-white" />
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-4">
                                <div className="shrink-0 w-8 h-8 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
                                    <Bot size={14} />
                                </div>
                                <div className="bg-black/40 border border-white/5 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-3">
                                    <span className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce" />
                                        <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                                        <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                                    </span>
                                    <span className="text-xs text-[var(--accent)] font-medium animate-pulse">Searching the live web...</span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-black/40 border-t border-white/5">

                        {/* Error Banner */}
                        {error && (
                            <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                                <AlertCircle size={14} className="text-red-400" />
                                <span className="text-xs font-bold text-red-400">{error}</span>
                            </div>
                        )}

                        {/* Quick Prompts (only show if no user messages yet, or randomly if we want, but let's just show if message count <= 2 to help get started) */}
                        {messages.length <= 2 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {QUICK_PROMPTS.map((qp, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(qp.prompt)}
                                        disabled={isLoading}
                                        className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/60 hover:text-white transition-all disabled:opacity-50"
                                    >
                                        <span className="text-[var(--accent)]">{qp.icon}</span>
                                        {qp.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="relative flex items-end gap-2">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading}
                                placeholder="Ask about hiring trends, tech news, or career paths..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[56px] max-h-[150px] resize-none focus:outline-none focus:border-[var(--accent)]/50 focus:bg-white/10 transition-all text-sm text-white placeholder:text-white/30 custom-scrollbar disabled:opacity-50"
                                rows={1}
                                style={{ overflowY: input.split("\\n").length > 2 ? 'auto' : 'hidden' }}
                            />
                            <button
                                onClick={() => sendMessage(input)}
                                disabled={!input.trim() || isLoading}
                                className="shrink-0 w-14 h-14 bg-[var(--accent)] text-white font-bold rounded-2xl flex items-center justify-center hover:bg-[var(--accent)]/90 transition-all shadow-[0_4px_14px_0_rgba(232,152,90,0.39)] hover:shadow-[0_6px_20px_rgba(232,152,90,0.23)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-1" />}
                            </button>
                        </div>
                        <div className="text-center mt-2">
                            <span className="text-[9px] text-white/30 uppercase tracking-[0.2em]">Press Enter to send, Shift + Enter for new line</span>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
