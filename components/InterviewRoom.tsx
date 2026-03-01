"use client";

import { useEffect, useState } from "react";
import { Question } from "../lib/questions";
import { Mic, MicOff, Square, Play, Loader2 } from "lucide-react";
import Vapi from "@vapi-ai/web";
import { FeedbackReport } from "../lib/feedbackAnalyzer";
import FeedbackCard from "./FeedbackCard";

interface InterviewRoomProps {
    questions: Question[];
    onInterviewComplete: (feedbackRecords: Record<string, FeedbackReport>) => void;
}

// Assuming the parent component provides the Vapi public key via env variables
const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "dummy_key");

export default function InterviewRoom({ questions, onInterviewComplete }: InterviewRoomProps) {
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [isCallActive, setIsCallActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Store feedback for each question ID
    const [feedbackRecords, setFeedbackRecords] = useState<Record<string, FeedbackReport>>({});
    const [currentFeedback, setCurrentFeedback] = useState<FeedbackReport | null>(null);

    const currentQuestion = questions[currentQIndex];

    useEffect(() => {
        vapi.on("call-start", () => {
            setIsCallActive(true);
        });

        vapi.on("call-end", () => {
            setIsCallActive(false);
            setTranscript("");
        });

        vapi.on("message", (message: any) => {
            if (message.type === "transcript" && message.transcriptType === "final" && message.role === "user") {
                setTranscript((prev) => prev + " " + message.transcript);
            }
        });

        return () => {
            vapi.removeAllListeners();
            if (isCallActive) {
                vapi.stop();
            }
        };
    }, [isCallActive]);

    const toggleCall = async () => {
        if (isCallActive) {
            vapi.stop();
        } else {
            // Start call with dynamic system prompt depending on question
            await vapi.start({
                model: {
                    provider: "openai",
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "system",
                            content: `You are a technical interviewer for PrepWise. Ask the candidate the following question: "${currentQuestion.question}". Listen to their answer. Do not give them the right answer. Just acknowledge their response briefly and say "Please click Next Question when you are ready to proceed."`
                        }
                    ]
                },
                voice: {
                    provider: "11labs",
                    voiceId: "bIHbv24MWmeRgasZH58o", // example realistic voice
                }
            });
        }
    };

    const toggleMute = () => {
        vapi.setMuted(!isMuted);
        setIsMuted(!isMuted);
    };

    const submitAnswer = async () => {
        if (isCallActive) {
            vapi.stop();
        }

        if (!transcript.trim()) {
            alert("No audio recorded. Please answer the question first.");
            return;
        }

        setIsAnalyzing(true);
        try {
            const res = await fetch("/api/analyze-answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: currentQuestion, candidateAnswer: transcript }),
            });

            if (!res.ok) {
                throw new Error("Failed to analyze answer");
            }

            const report: FeedbackReport = await res.json();
            setFeedbackRecords((prev) => ({ ...prev, [currentQuestion.id]: report }));
            setCurrentFeedback(report);
        } catch (error) {
            console.error(error);
            alert("Error analyzing answer. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const nextQuestion = () => {
        setTranscript("");
        setCurrentFeedback(null);
        if (currentQIndex < questions.length - 1) {
            setCurrentQIndex((prev) => prev + 1);
        } else {
            onInterviewComplete(feedbackRecords);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto mt-8 animate-slide-up space-y-6">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-[var(--muted-foreground)]">
                    Question {currentQIndex + 1} of {questions.length}
                </h2>
                <span className="px-3 py-1 bg-[var(--muted)] text-xs font-bold uppercase tracking-wider rounded-full">
                    {currentQuestion.category} • {currentQuestion.difficulty}
                </span>
            </div>

            <div className="glass-card rounded-2xl p-8 mb-6 relative overflow-hidden">
                {isCallActive && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-cyan-400 animate-pulse"></div>
                )}
                <h1 className="text-3xl font-bold leading-tight text-[var(--foreground)]">
                    {currentQuestion.question}
                </h1>
            </div>

            {!currentFeedback ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px]">
                        <div className={`relative flex items-center justify-center w-32 h-32 rounded-full mb-8 ${isCallActive ? 'bg-primary/20' : 'bg-[var(--muted)]'}`}>
                            {isCallActive && <div className="absolute inset-0 rounded-full animate-pulse-ring"></div>}
                            {isCallActive ? (
                                <div className="flex gap-1 items-center justify-center h-10">
                                    <span className="w-1.5 h-full bg-primary rounded-full animate-[bounce_1s_infinite_0.1s]"></span>
                                    <span className="w-1.5 h-2/3 bg-primary rounded-full animate-[bounce_1s_infinite_0.2s]"></span>
                                    <span className="w-1.5 h-full bg-primary rounded-full animate-[bounce_1s_infinite_0.3s]"></span>
                                    <span className="w-1.5 h-1/2 bg-primary rounded-full animate-[bounce_1s_infinite_0.4s]"></span>
                                </div>
                            ) : (
                                <Mic size={40} className="text-[var(--muted-foreground)]" />
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={toggleCall}
                                className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all shadow-lg ${isCallActive
                                    ? "bg-red-500 hover:bg-red-600 text-white"
                                    : "bg-primary hover:bg-indigo-600 text-white"
                                    }`}
                            >
                                {isCallActive ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                                {isCallActive ? "End Recording" : "Start Recording"}
                            </button>

                            {isCallActive && (
                                <button
                                    onClick={toggleMute}
                                    className="p-3 bg-[var(--muted)] hover:bg-[var(--border)] rounded-full text-[var(--foreground)] transition-colors"
                                >
                                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                                </button>
                            )}
                        </div>
                        {isCallActive && (
                            <p className="text-sm text-[var(--muted-foreground)] mt-4">VAPI Interviewer is listening. Speak clearly.</p>
                        )}
                    </div>

                    <div className="glass-card rounded-2xl p-6 flex flex-col">
                        <h3 className="font-semibold mb-4 text-[var(--foreground)]">Live Transcript</h3>
                        <div className="flex-1 bg-[var(--background)]/50 rounded-xl p-4 text-sm leading-relaxed overflow-y-auto max-h-[250px] border border-[var(--border)] text-[var(--muted-foreground)]">
                            {transcript ? transcript : "Your spoken answer will appear here..."}
                        </div>
                        <button
                            onClick={submitAnswer}
                            disabled={isAnalyzing || !transcript.trim()}
                            className="mt-4 w-full py-3 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {isAnalyzing ? (
                                <><Loader2 size={18} className="animate-spin" /> Analyzing...</>
                            ) : (
                                "Submit Answer & Get Feedback"
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="animate-slide-up">
                    {currentFeedback && (
                        <FeedbackCard
                            feedback={currentFeedback}
                            onNext={nextQuestion}
                            isLastQuestion={currentQIndex === questions.length - 1}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
