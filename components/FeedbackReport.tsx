"use client";

import { FeedbackReport as FeedbackReportType, VisualAnalysisSummary } from "../lib/feedbackAnalyzer";
import { Question } from "../lib/questions";
import { Award, Download, RefreshCcw, Eye, Brain, Activity, Smile } from "lucide-react";

interface FeedbackReportProps {
    records: Record<string, FeedbackReportType>;
    questions: Question[];
    onRestart: () => void;
}

export default function FeedbackReport({ records, questions, onRestart }: FeedbackReportProps) {
    const answeredQuestions = questions.filter((q) => records[q.id]);

    if (answeredQuestions.length === 0) {
        return (
            <div className="glass-card p-10 text-center animate-fade-in-up">
                <h2 className="text-2xl font-bold mb-4">No Questions Answered</h2>
                <button onClick={onRestart} className="btn-primary">Restart</button>
            </div>
        );
    }

    const totalScore = answeredQuestions.reduce((sum, q) => sum + records[q.id].score, 0);
    const avgScore = Math.round((totalScore / answeredQuestions.length) * 10) / 10;
    const scoreColor = avgScore >= 8 ? "text-green-400" : avgScore >= 5 ? "text-yellow-400" : "text-red-400";
    const bgRingColor = avgScore >= 8 ? "border-green-400" : avgScore >= 5 ? "border-yellow-400" : "border-red-400";

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Summary */}
            <div className="glass-card p-10 flex flex-col md:flex-row items-center justify-between gap-8 border-t-2 border-[var(--primary)]">
                <div className="space-y-3 max-w-md text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-semibold text-xs uppercase tracking-wider">
                        <Award size={14} /> Interview Complete
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Performance Report</h1>
                    <p className="text-white/40">
                        {answeredQuestions.length} questions answered. Review your results below.
                    </p>
                </div>
                <div className="flex flex-col items-center">
                    <div className={`w-32 h-32 rounded-full border-[6px] ${bgRingColor} flex items-center justify-center bg-black`}>
                        <span className={`text-4xl font-black ${scoreColor}`}>
                            {avgScore}<span className="text-xl text-white/30">/10</span>
                        </span>
                    </div>
                    <p className="mt-3 font-bold text-white/60">Average</p>
                </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold">Breakdown</h2>
                {answeredQuestions.map((q, idx) => {
                    const fb = records[q.id];
                    const sc = fb.score >= 8 ? "text-green-400" : fb.score >= 5 ? "text-yellow-400" : "text-red-400";
                    return (
                        <div key={q.id} className="glass-card p-5 flex flex-col md:flex-row justify-between gap-5">
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-7 h-7 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-sm shrink-0">{idx + 1}</span>
                                    <h3 className="font-bold text-base">{q.question}</h3>
                                </div>
                                <p className="text-sm text-white/40 pl-9 border-l-2 border-[var(--primary)]/20 ml-3">{fb.overallFeedback}</p>

                                {fb.bodyLanguageFeedback && (
                                    <div className="mt-3 p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-lg text-sm text-white/60 flex gap-2 items-start ml-12">
                                        <span className="text-cyan-400 shrink-0 mt-0.5">👁️</span>
                                        <p>{fb.bodyLanguageFeedback}</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-2xl font-black ${sc}`}>{fb.score}/10</span>
                                <span className="text-xs text-white/30 uppercase tracking-wider">{q.category}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Visual Analysis Section */}
            {(() => {
                // Grab visual summary from the first feedback entry that has one
                const visualSummary: VisualAnalysisSummary | undefined =
                    answeredQuestions.map(q => records[q.id]?.visualSummary).find(Boolean);
                if (!visualSummary) return null;
                return (
                    <div className="glass-card p-6 border-[var(--primary)]/15 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-40" />
                        <div className="flex items-center gap-2 mb-5">
                            <div className="p-2 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20">
                                <Brain size={16} className="text-[var(--primary)]" />
                            </div>
                            <h2 className="text-lg font-bold">Visual & Body Language Analysis</h2>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                                <Activity size={18} className="mx-auto mb-2 text-[var(--primary)]" />
                                <div className="text-2xl font-black text-white">{visualSummary.avg_confidence}<span className="text-sm text-white/30">/100</span></div>
                                <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">Avg Confidence</div>
                            </div>
                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                                <Eye size={18} className="mx-auto mb-2 text-cyan-400" />
                                <div className="text-2xl font-black text-white">{visualSummary.eye_contact_percentage}<span className="text-sm text-white/30">%</span></div>
                                <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">Eye Contact</div>
                            </div>
                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                                <Activity size={18} className="mx-auto mb-2 text-green-400" />
                                <div className="text-2xl font-black text-white">{visualSummary.presence_percentage}<span className="text-sm text-white/30">%</span></div>
                                <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">Cam Presence</div>
                            </div>
                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                                <Smile size={18} className="mx-auto mb-2 text-[var(--accent)]" />
                                <div className="text-lg font-black text-white capitalize">{visualSummary.dominant_emotion}</div>
                                <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">Dominant Mood</div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                            <p className="text-sm text-white/60 leading-relaxed">👁️ {visualSummary.summary}</p>
                            <p className="text-[10px] text-white/20 mt-2">{visualSummary.frames_analysed} frames analysed during the session</p>
                        </div>
                    </div>
                );
            })()}

            {/* Actions */}
            <div className="flex flex-wrap justify-between gap-4 pt-6 border-t border-white/5">
                <button onClick={() => window.print()} className="btn-outline flex items-center gap-2">
                    <Download size={16} /> Print Report
                </button>
                <button onClick={onRestart} className="btn-primary flex items-center gap-2">
                    <RefreshCcw size={16} /> New Interview
                </button>
            </div>
        </div>
    );
}
