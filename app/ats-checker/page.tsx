"use client";

import { useState, useCallback } from "react";
import { UploadCloud, FileText, FileSearch, Target, BarChart, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { ATSAnalysisResult } from "../../lib/atsAnalyzer";

/**
 * Normalize ATS result to ensure all nested fields exist with safe defaults.
 * Gemini may return slightly different structures.
 */
function normalizeATS(raw: any): ATSAnalysisResult {
    const ats = raw?.ats_analysis || {};
    const scores = ats.category_scores || {};
    const dashboard = raw?.dashboard_display || {};
    const interview = raw?.interview_control || {};
    const overallScore = ats.overall_score ?? dashboard.main_score_circle ?? 0;

    return {
        ats_analysis: {
            overall_score: overallScore,
            category_scores: {
                keyword_match: scores.keyword_match ?? 0,
                skills_relevance: scores.skills_relevance ?? 0,
                experience_impact: scores.experience_impact ?? 0,
                formatting: scores.formatting ?? 0,
                clarity_professionalism: scores.clarity_professionalism ?? 0,
            },
            missing_keywords: ats.missing_keywords || [],
            resume_strengths: ats.resume_strengths || [],
            risk_flags: ats.risk_flags || [],
            improvement_suggestions: ats.improvement_suggestions || [],
            rewrite_suggestions: ats.rewrite_suggestions || [],
        },
        dashboard_display: {
            main_score_circle: dashboard.main_score_circle ?? overallScore,
            progress_bars: dashboard.progress_bars || scores || {
                keyword_match: 0, skills_relevance: 0, experience_impact: 0, formatting: 0, clarity_professionalism: 0,
            },
            radar_chart_metrics: dashboard.radar_chart_metrics || ["Technical Match", "Experience Depth", "ATS Compliance", "Professional Strength", "Keyword Coverage"],
            ats_status: dashboard.ats_status || (overallScore >= 75 ? "Strong Candidate" : overallScore >= 60 ? "Average Resume" : overallScore >= 45 ? "Weak Resume" : "Resume Needs Improvement"),
            risk_indicator_level: dashboard.risk_indicator_level || "Automated",
        },
        interview_control: {
            resume_eligible: interview.resume_eligible ?? overallScore >= 45,
            reason_if_not_eligible: interview.reason_if_not_eligible || "",
            interview_difficulty_level: interview.interview_difficulty_level || (overallScore >= 75 ? "Advanced" : overallScore >= 60 ? "Moderate" : "Foundational"),
            focus_areas_for_questions: interview.focus_areas_for_questions || [],
        },
        generated_interview_questions: raw?.generated_interview_questions || [],
    };
}

export default function ATSCheckerPage() {
    const [isDragging, setIsDragging] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [textInput, setTextInput] = useState("");
    const [atsResult, setAtsResult] = useState<ATSAnalysisResult | null>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false);
        if (e.dataTransfer.files?.[0]) await processFile(e.dataTransfer.files[0]);
    }, []);

    const processFile = async (file: File) => {
        setIsAnalyzing(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/parse-resume", { method: "POST", body: formData });

            if (!res.ok) {
                let errText = "File analysis failed.";
                try {
                    const errObj = await res.json();
                    if (errObj.error) errText = errObj.error;
                } catch (e) { }
                throw new Error(errText);
            }

            const data = await res.json();
            if (data.atsData) {
                setAtsResult(normalizeATS(data.atsData));
            } else if (data.error) {
                setError(data.error);
            } else {
                setError("No ATS Data found. The document may not be readable.");
            }
        } catch (e: any) {
            setError(e.message || "Failed to analyze resume.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleManualScan = async () => {
        if (!textInput.trim()) return;
        setIsAnalyzing(true);
        setError(null);
        try {
            const res = await fetch("/api/parse-manual-resume", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: textInput })
            });
            if (!res.ok) throw new Error("Manual text analysis failed.");

            const data = await res.json();
            if (data.atsData) {
                setAtsResult(normalizeATS(data.atsData));
            } else {
                setError("Failed to parse ATS data from this text.");
            }
        } catch (e: any) {
            setError(e.message || "Something went wrong.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-6 sm:px-12 relative">
            <div className="ambient-background" />
            <div className="grid-crosses opacity-50" />

            <div className="max-w-[1400px] mx-auto relative z-10 space-y-12 animate-fade-in-up">

                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-bold text-xs uppercase tracking-widest mb-6 border border-[var(--primary)]/20 shadow-[0_0_15px_rgba(200,162,255,0.2)]">
                        <FileSearch size={14} /> AI Portfolio Controller
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                        ATS Resume Scanner
                    </h1>
                    <p className="text-white/40 text-lg leading-relaxed">
                        Drag and drop your resume or paste the raw text below. Our intelligent engine will execute a deep evaluation against modern ATS algorithms.
                    </p>
                </div>

                {!atsResult ? (
                    /* Upload Section */
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`glass-card p-12 border-2 border-dashed flex flex-col items-center justify-center text-center transition-all duration-300 ${isDragging ? 'border-[var(--primary)] bg-[var(--primary)]/5 scale-105' : 'border-white/10 hover:border-white/30'}`}
                        >
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${isDragging ? 'bg-[var(--primary)] text-black' : 'bg-white/5 text-white/50'}`}>
                                {isAnalyzing ? <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin" /> : <UploadCloud size={32} />}
                            </div>
                            <h3 className="text-2xl font-bold mb-3">{isAnalyzing ? "Analyzing Resume Framework..." : "Drop your PDF Resume Here"}</h3>
                            <p className="text-white/40 mb-8 max-w-md mx-auto">{isAnalyzing ? "Extracting keywords, mapping technical capabilities, and evaluating professional impact." : "Upload your document to instantly uncover ATS blind spots and risk flags."}</p>

                            <label className="btn-primary cursor-pointer active:scale-95 inline-block">
                                Browse Files
                                <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} disabled={isAnalyzing} />
                            </label>
                        </div>

                        <div className="flex items-center gap-4 py-4 opacity-50">
                            <div className="flex-1 h-px bg-white/20"></div>
                            <span className="text-xs font-bold uppercase tracking-widest">OR PASTE RAW TEXT</span>
                            <div className="flex-1 h-px bg-white/20"></div>
                        </div>

                        <div className="glass-card p-4 relative focus-within:ring-2 ring-[var(--primary)] transition-all">
                            <textarea
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                className="w-full h-40 bg-transparent border-none focus:ring-0 text-white placeholder-white/20 p-4 resize-none"
                                placeholder="Paste your resume content or job description here to initiate manual scan..."
                            />
                            <div className="flex justify-between items-center px-4 pb-2">
                                <span className="text-xs text-white/20">{textInput.length} characters</span>
                                <button onClick={handleManualScan} disabled={isAnalyzing || !textInput.trim()} className="btn-primary py-2 px-6 text-sm disabled:opacity-50">
                                    Execute Deep Scan
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center justify-center gap-3">
                                <AlertTriangle size={18} /> <span className="font-medium text-sm">{error}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Display Results Dashboard */
                    <div className="space-y-12 animate-fade-in-up">

                        {/* Status Header */}
                        <div className="glass-card p-10 flex flex-col md:flex-row items-center justify-between gap-8 border-t-2 border-[var(--primary)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--primary)]/10 blur-[100px] rounded-full pointer-events-none"></div>
                            <div className="space-y-4 max-w-2xl relative z-10">
                                <h2 className="text-3xl font-black">{atsResult.dashboard_display.ats_status}</h2>
                                <p className="text-white/50 text-base leading-relaxed">
                                    The AI Engine has fully parsed your document. {atsResult.interview_control.reason_if_not_eligible || `Your portfolio aligns with a ${atsResult.interview_control.interview_difficulty_level} interview difficulty level.`}
                                </p>
                                <div className="flex flex-wrap gap-3 mt-4">
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${atsResult.interview_control.resume_eligible ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                        {atsResult.interview_control.resume_eligible ? "Eligible For Technical Gauntlet" : "Screening Failed"}
                                    </span>
                                    <span className="px-4 py-1.5 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] text-xs font-bold uppercase tracking-wider">
                                        Risk Level: {atsResult.dashboard_display.risk_indicator_level || "Automated"}
                                    </span>
                                </div>
                            </div>
                            <div className="relative flex items-center justify-center z-10 shrink-0">
                                <div className="relative w-48 h-48 flex items-center justify-center">
                                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                                        <circle cx="96" cy="96" r="90" className="stroke-white/5 fill-none" strokeWidth="8" />
                                        <circle
                                            cx="96" cy="96" r="90"
                                            className="stroke-[var(--primary)] fill-none shadow-[0_0_20px_rgba(200,162,255,1)]"
                                            strokeWidth="8" strokeLinecap="round"
                                            style={{
                                                strokeDasharray: 565,
                                                strokeDashoffset: 565 - (565 * (atsResult.dashboard_display.main_score_circle / 100))
                                            }}
                                        />
                                    </svg>
                                    <div className="absolute flex flex-col items-center justify-center">
                                        <span className="text-6xl font-black">{atsResult.dashboard_display.main_score_circle}</span>
                                        <span className="text-xs text-white/40 uppercase tracking-widest font-bold mt-1">ATS Match</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Split Data Board */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                            {/* Graphical Progress Bars */}
                            <div className="glass-card p-8">
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-8 border-b border-white/5 pb-4">
                                    <BarChart className="text-[var(--primary)]" /> Categorical Breakdown
                                </h3>
                                <div className="space-y-6">
                                    {[
                                        { name: "Keyword Coverage", score: atsResult.ats_analysis.category_scores.keyword_match },
                                        { name: "Skills Relevance", score: atsResult.ats_analysis.category_scores.skills_relevance },
                                        { name: "Experience Impact", score: atsResult.ats_analysis.category_scores.experience_impact },
                                        { name: "Professional Tone", score: atsResult.ats_analysis.category_scores.clarity_professionalism },
                                        { name: "ATS Formatting", score: atsResult.ats_analysis.category_scores.formatting },
                                    ].map((cat, i) => (
                                        <div key={i} className="space-y-2 group">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="font-semibold text-white/80">{cat.name}</span>
                                                <span className="font-mono text-[var(--primary)] font-bold">{cat.score}%</span>
                                            </div>
                                            <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-[var(--primary)] to-indigo-400 rounded-full transition-all duration-1000 ease-out group-hover:brightness-125"
                                                    style={{ width: cat.score + "%" }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Analysis Lists */}
                            <div className="space-y-8">
                                <div className="glass-card p-8">
                                    <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-red-400">
                                        <AlertTriangle size={18} /> Critical Risk Flags
                                    </h3>
                                    {atsResult.ats_analysis.risk_flags.length > 0 ? (
                                        <ul className="space-y-3">
                                            {atsResult.ats_analysis.risk_flags.map((risk, i) => (
                                                <li key={i} className="flex gap-3 text-sm text-white/70 items-start">
                                                    <XCircle size={16} className="text-red-500/50 mt-0.5 shrink-0" />
                                                    {risk}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-white/30 text-sm">No critical risk flags detected. Solid structure.</p>
                                    )}
                                </div>

                                <div className="glass-card p-8 bg-[var(--primary)]/5">
                                    <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-[var(--primary)]">
                                        <Target size={18} /> Missing Keywords
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {atsResult.ats_analysis.missing_keywords.map((kw, i) => (
                                            <span key={i} className="px-3 py-1 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-white/60">
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Rewrite Engine Results */}
                        {atsResult.ats_analysis.rewrite_suggestions && atsResult.ats_analysis.rewrite_suggestions.length > 0 && (
                            <div className="glass-card p-8">
                                <h3 className="text-2xl font-bold mb-8">AI Content Optimization</h3>
                                <div className="space-y-6">
                                    {atsResult.ats_analysis.rewrite_suggestions.map((rewrite, i) => (
                                        <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-5 rounded-xl bg-red-500/5 border border-red-500/10">
                                                <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-3">Original Weak phrasing</div>
                                                <p className="text-sm text-white/60 line-through decoration-red-500/30">{rewrite.original}</p>
                                            </div>
                                            <div className="p-5 rounded-xl bg-green-500/5 border border-green-500/10 relative">
                                                <div className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-3">Impact-Driven Rewrite</div>
                                                <p className="text-sm text-white font-medium">{rewrite.improved}</p>
                                                <div className="absolute top-4 right-4 text-green-500/20"><CheckCircle size={32} /></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-center pt-8">
                            <button onClick={() => setAtsResult(null)} className="btn-outline px-10">
                                Scan Another Document
                            </button>
                        </div>

                    </div>
                )}

            </div>
        </div>
    );
}
