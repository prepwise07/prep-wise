"use client";

import { FeedbackReport } from "../lib/feedbackAnalyzer";
import { CheckCircle, AlertTriangle, XCircle, ArrowRight, Lightbulb } from "lucide-react";

interface FeedbackCardProps {
    feedback: FeedbackReport;
    onNext: () => void;
    isLastQuestion: boolean;
}

export default function FeedbackCard({ feedback, onNext, isLastQuestion }: FeedbackCardProps) {
    const scoreColor = feedback.score >= 8 ? "text-green-400" : feedback.score >= 5 ? "text-yellow-400" : "text-red-400";
    const bgRingColor = feedback.score >= 8 ? "border-green-400" : feedback.score >= 5 ? "border-yellow-400" : "border-red-400";

    return (
        <div className="glass-card p-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Score */}
                <div className="flex flex-col items-center justify-center shrink-0">
                    <div className={`relative w-28 h-28 rounded-full border-[6px] ${bgRingColor} flex items-center justify-center bg-black`}>
                        <span className={`text-3xl font-black ${scoreColor}`}>
                            {feedback.score}<span className="text-lg text-white/30">/10</span>
                        </span>
                    </div>
                    <p className="mt-3 font-semibold text-sm text-white/60">AI Score</p>
                </div>

                <div className="flex-1 space-y-5">
                    <p className="text-base font-medium leading-relaxed text-white/80 border-l-4 border-[var(--primary)] pl-4">
                        {feedback.overallFeedback}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2.5">
                            <h4 className="font-semibold flex items-center gap-2 text-green-400 text-sm">
                                <CheckCircle size={16} /> Strengths
                            </h4>
                            <ul className="space-y-1.5">
                                {feedback.strengths.map((s, i) => (
                                    <li key={i} className="text-sm text-white/70 bg-green-500/5 px-3 py-2 rounded-lg border border-green-500/10">{s}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-2.5">
                            <h4 className="font-semibold flex items-center gap-2 text-yellow-400 text-sm">
                                <AlertTriangle size={16} /> Weaknesses
                            </h4>
                            <ul className="space-y-1.5">
                                {feedback.weaknesses.map((w, i) => (
                                    <li key={i} className="text-sm text-white/70 bg-yellow-500/5 px-3 py-2 rounded-lg border border-yellow-500/10">{w}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {feedback.missedPoints && feedback.missedPoints.length > 0 && (
                        <div className="space-y-2.5">
                            <h4 className="font-semibold flex items-center gap-2 text-red-400 text-sm">
                                <XCircle size={16} /> Missed Points
                            </h4>
                            <ul className="space-y-1.5">
                                {feedback.missedPoints.map((m, i) => (
                                    <li key={i} className="text-sm text-white/70 bg-red-500/5 px-3 py-2 rounded-lg border border-red-500/10">{m}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {feedback.bodyLanguageFeedback && (
                        <div className="p-4 bg-cyan-500/5 border border-cyan-500/15 rounded-xl">
                            <h4 className="font-semibold flex items-center gap-2 text-cyan-400 mb-2 text-sm">
                                <span className="font-bold tracking-tight">👁️ Body Language & Presence</span>
                            </h4>
                            <p className="text-sm text-white/70 leading-relaxed">{feedback.bodyLanguageFeedback}</p>
                        </div>
                    )}

                    <div className="p-4 bg-[var(--primary)]/5 border border-[var(--primary)]/15 rounded-xl">
                        <h4 className="font-semibold flex items-center gap-2 text-[var(--primary)] mb-2 text-sm">
                            <Lightbulb size={16} /> Ideal Answer
                        </h4>
                        <p className="text-sm text-white/60 leading-relaxed italic">"{feedback.suggestedAnswer}"</p>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-5 border-t border-white/5 flex justify-end">
                <button onClick={onNext} className="btn-primary flex items-center gap-2">
                    {isLastQuestion ? "Finish — See Report" : "Next Question"} <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
}
