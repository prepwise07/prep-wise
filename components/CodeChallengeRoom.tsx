"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

// Lazy load Monaco Editor to improve initial load performance
const Editor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full flex items-center justify-center bg-black/60">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
    )
});
import {
    Code2, Terminal, Play, Send, Loader2, Award, Zap,
    Cpu, Target, AlertCircle, CheckCircle2, ChevronRight,
    BrainCircuit, BookOpen, Lock, Unlock, Clock
} from "lucide-react";

// Types
type Difficulty = "Basic" | "Medium" | "Advanced";
type Language = "javascript" | "python" | "java" | "cpp";

interface Challenge {
    id: string;
    title: string;
    difficulty: Difficulty;
    description: string;
    starterCode: Record<string, string>;
    testCases: { input: string; expectedOutput: string }[];
    hints: string[];
}

interface TestResult {
    passed: boolean;
    output: string;
    expected: string;
    error: string | null;
    time?: number;
}

interface RunOutputs {
    [testIndex: number]: TestResult;
}

interface ChallengeState {
    code: string;
    runOutputs: RunOutputs;
    isSubmitting: boolean;
    timeSpent: number;
}

interface SkillRating {
    overallRating: number;
    grade: string;
    breakdown: {
        problemSolving: number;
        codeQuality: number;
        efficiency: number;
        accuracy: number;
    };
    strengths: string[];
    improvements: string[];
    suggestedTopics: string[];
}

const LANGUAGES = [
    { id: "javascript", label: "JavaScript", icon: "JS", judgeId: 63, color: "text-yellow-400" },
    { id: "python", label: "Python", icon: "PY", judgeId: 71, color: "text-blue-400" },
    { id: "java", label: "Java", icon: "☕", judgeId: 62, color: "text-orange-400" },
    { id: "cpp", label: "C++", icon: "C++", judgeId: 54, color: "text-indigo-400" },
];

export default function CodeChallengeRoom() {
    const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
    const [language, setLanguage] = useState<Language>("javascript");

    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [activeTab, setActiveTab] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);

    // Per-challenge state tracking (code, results)
    const [states, setStates] = useState<Record<string, ChallengeState>>({});

    // Timer tracking
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [globalTime, setGlobalTime] = useState(0);

    const [skillRating, setSkillRating] = useState<SkillRating | null>(null);
    const [isRating, setIsRating] = useState(false);

    // Helpers
    const formatTime = (s: number) =>
        `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    // Generate Challenges
    const generateChallenges = async () => {
        setIsGenerating(true);
        setSkillRating(null);
        setChallenges([]);
        try {
            const res = await fetch("/api/generate-challenge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ difficulty, language }),
            });
            const data = await res.json();

            if (data.challenges) {
                setChallenges(data.challenges);
                // Init states
                const newStates: Record<string, ChallengeState> = {};
                data.challenges.forEach((c: Challenge) => {
                    newStates[c.id] = {
                        code: c.starterCode[language] || "",
                        runOutputs: {},
                        isSubmitting: false,
                        timeSpent: 0
                    };
                });
                setStates(newStates);
                setGlobalTime(0);
                setActiveTab(0);

                // Start timer
                if (timerRef.current) clearInterval(timerRef.current);
                timerRef.current = setInterval(() => {
                    setGlobalTime(p => p + 1);
                }, 1000);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    // Stop timer if rated
    useEffect(() => {
        if (skillRating && timerRef.current) {
            clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [skillRating]);

    const activeChallenge = challenges[activeTab];
    const currentState = activeChallenge ? states[activeChallenge.id] : null;

    // Run Code against test cases
    const runCode = async () => {
        if (!activeChallenge || !currentState) return;

        setStates(prev => ({
            ...prev,
            [activeChallenge.id]: { ...prev[activeChallenge.id], isSubmitting: true }
        }));

        const langData = LANGUAGES.find(l => l.id === language);
        if (!langData) return;

        const newOutputs: RunOutputs = { ...currentState.runOutputs };

        // Run each test case (sequentially to avoid rate limits on free API)
        for (let i = 0; i < activeChallenge.testCases.length; i++) {
            const tc = activeChallenge.testCases[i];
            try {
                const res = await fetch("/api/run-code", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        code: currentState.code,
                        languageId: langData.judgeId,
                        stdin: tc.input
                    }),
                });
                const data = await res.json();

                let outputStr = (data.stdout || "").trim();
                if (data.stderr || data.compile_output) {
                    outputStr = (data.stderr || "") + "\n" + (data.compile_output || "");
                }

                // If no API key / mock mode is returned
                if (outputStr.includes("[MOCK OUTPUT]")) {
                    outputStr = tc.expectedOutput.trim();
                }

                const err = data.status?.id !== 3 && data.status?.id !== undefined ? data.status.description : null;

                newOutputs[i] = {
                    passed: !err && outputStr === tc.expectedOutput.trim(),
                    output: outputStr,
                    expected: tc.expectedOutput.trim(),
                    error: err,
                    time: data.time ? parseFloat(data.time) * 1000 : 0
                };
            } catch (e) {
                newOutputs[i] = { passed: false, output: "", expected: tc.expectedOutput.trim(), error: "Execution Failed" };
            }
        }

        setStates(prev => ({
            ...prev,
            [activeChallenge.id]: { ...prev[activeChallenge.id], isSubmitting: false, runOutputs: newOutputs }
        }));
    };

    // Submit for Final Rating
    const submitForRating = async () => {
        setIsRating(true);
        if (timerRef.current) clearInterval(timerRef.current);

        try {
            const payload = challenges.map(c => ({
                id: c.id,
                title: c.title,
                code: states[c.id].code,
                testResults: states[c.id].runOutputs,
                timeSpent: globalTime / challenges.length // rough avg
            }));

            const res = await fetch("/api/rate-coding-skill", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ submissions: payload, difficulty }),
            });
            const data = await res.json();

            if (data.overallRating) {
                setSkillRating(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsRating(false);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 pt-4 animate-fade-in-up">

            {/* ── Selection Header ── */}
            <div className="glass-card p-6 border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-3">
                        <Terminal size={18} className="text-[var(--accent)]" />
                        <span className="text-sm font-bold text-white/50 uppercase tracking-widest">Configuration</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                        {/* Difficulty */}
                        <div className="flex gap-2 p-1 rounded-xl bg-black/40 border border-white/5">
                            {(["Basic", "Medium", "Advanced"] as Difficulty[]).map(lvl => (
                                <button
                                    key={lvl}
                                    onClick={() => setDifficulty(lvl)}
                                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${difficulty === lvl ? "bg-white/10 text-white shadow-lg" : "text-white/40 hover:text-white/80"}`}
                                >
                                    {lvl}
                                </button>
                            ))}
                        </div>

                        {/* Language */}
                        <div className="flex gap-2 p-1 rounded-xl bg-black/40 border border-white/5">
                            {LANGUAGES.map(lang => (
                                <button
                                    key={lang.id}
                                    onClick={() => setLanguage(lang.id as Language)}
                                    className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${language === lang.id ? "bg-white/10 text-white shadow-lg" : "text-white/40 hover:text-white/80"}`}
                                >
                                    <span className={language === lang.id ? lang.color : "text-white/30"}>{lang.icon}</span>
                                    {lang.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
                    <button
                        onClick={generateChallenges}
                        disabled={isGenerating}
                        className="btn-primary flex items-center gap-2 px-8 py-3 text-sm flex-1 md:flex-none justify-center disabled:opacity-50"
                    >
                        {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                        {challenges.length > 0 ? "Generate New" : "Start Challenge"}
                    </button>
                    {challenges.length > 0 && !skillRating && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                            <Clock size={16} className="text-white/40" />
                            <span className="font-mono font-bold text-white/80">{formatTime(globalTime)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Challenge Area ── */}
            {challenges.length > 0 && !skillRating && (
                <div className="flex flex-col gap-6">

                    {/* Top Top: Split description and code editor */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                        {/* Left: Problem Details */}
                        <div className="lg:col-span-5 space-y-4">
                            <div className="flex gap-2">
                                {challenges.map((c, i) => (
                                    <button
                                        key={c.id}
                                        onClick={() => setActiveTab(i)}
                                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all border ${activeTab === i ? "bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]" : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10"}`}
                                    >
                                        Problem {i + 1}
                                    </button>
                                ))}
                            </div>

                            {activeChallenge && (
                                <div className="glass-card p-6 border-white/5 flex flex-col h-[600px] overflow-y-auto custom-scrollbar">
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${activeChallenge.difficulty === "Basic" ? "bg-green-500/10 text-green-400" : activeChallenge.difficulty === "Medium" ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400"}`}>
                                                {activeChallenge.difficulty}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-black text-white/90">{activeChallenge.title}</h3>
                                    </div>

                                    <div className="prose prose-invert max-w-none text-sm text-white/70 leading-relaxed mb-8 flex-1">
                                        {activeChallenge.description.split('\n').map((para, i) => (
                                            <p key={i} className="mb-4">{para}</p>
                                        ))}
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] flex items-center gap-2">
                                            <BookOpen size={12} /> Hints
                                        </h4>
                                        <div className="space-y-2">
                                            {activeChallenge.hints.map((h, i) => (
                                                <details key={i} className="group bg-black/40 rounded-lg border border-white/5">
                                                    <summary className="px-4 py-3 text-sm font-medium text-white/50 cursor-pointer flex items-center justify-between list-none">
                                                        <span>Reveal Hint {i + 1}</span>
                                                        <ChevronRight size={14} className="group-open:rotate-90 transition-transform" />
                                                    </summary>
                                                    <div className="px-4 pb-4 text-sm text-white/70 border-t border-white/5 pt-3">
                                                        {h}
                                                    </div>
                                                </details>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: Code Editor & Execution */}
                        {activeChallenge && currentState && (
                            <div className="lg:col-span-7 flex flex-col gap-6">
                                {/* Editor Header */}
                                <div className="glass-card overflow-hidden border-white/5">
                                    <div className="h-12 bg-black/60 border-b border-white/5 flex items-center justify-between px-4 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <Code2 size={14} className="text-white/40" />
                                            <span className="text-xs font-mono text-white/60">
                                                {`solution.${language === "javascript" ? "js" : language === "python" ? "py" : language === "java" ? "java" : "cpp"}`}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="w-full bg-black/60 relative h-[400px]">
                                        <Editor
                                            height="100%"
                                            language={language === "cpp" ? "cpp" : language}
                                            theme="vs-dark"
                                            value={currentState.code}
                                            onChange={(val) => {
                                                if (val !== undefined) {
                                                    setStates(p => ({
                                                        ...p,
                                                        [activeChallenge.id]: { ...p[activeChallenge.id], code: val }
                                                    }));
                                                }
                                            }}
                                            options={{
                                                minimap: { enabled: false },
                                                fontSize: 14,
                                                fontFamily: "JetBrains Mono, monospace",
                                                scrollBeyondLastLine: false,
                                                smoothScrolling: true,
                                                cursorBlinking: "smooth",
                                                padding: { top: 16 }
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* ── Separate Execution & Test Results Block ── */}
                                <div className="glass-card border-[var(--accent)]/30 border-2 flex flex-col bg-black/40 overflow-hidden relative shadow-[0_0_30px_rgba(232,152,90,0.1)] h-[300px]">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-50" />

                                    <div className="w-full h-14 bg-black/80 border-b border-[var(--accent)]/20 flex items-center justify-between px-6 shrink-0">
                                        <div className="flex items-center gap-3">
                                            <Terminal size={18} className="text-[var(--accent)]" />
                                            <span className="text-sm font-black uppercase tracking-widest text-white/90">Execution & Results</span>
                                        </div>
                                        <button
                                            onClick={runCode}
                                            disabled={currentState.isSubmitting}
                                            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[var(--accent)]/20 hover:bg-[var(--accent)]/30 border border-[var(--accent)]/40 transition-all text-sm font-black text-[var(--accent)] disabled:opacity-50"
                                        >
                                            {currentState.isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} className="text-[var(--accent)]" />}
                                            Run Code
                                        </button>
                                    </div>

                                    <div className="w-full p-6 text-white text-sm overflow-y-auto custom-scrollbar">
                                        {Object.keys(currentState.runOutputs).length === 0 ? (
                                            <div className="py-8 flex flex-col items-center justify-center text-center">
                                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                                    <Zap size={20} className="text-white/20" />
                                                </div>
                                                <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Run your code to see results</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {activeChallenge.testCases.map((tc, i) => {
                                                    const out = currentState.runOutputs[i];
                                                    if (!out) return null;
                                                    return (
                                                        <div key={i} className={`p-4 rounded-xl border-2 shadow-lg ${out.passed ? "bg-green-500/5 border-green-500/30" : "bg-red-500/5 border-red-500/30"}`}>
                                                            <div className="flex items-center justify-between mb-4">
                                                                <span className="text-sm font-black text-white/90">Test Case {i + 1}</span>
                                                                {out.passed
                                                                    ? <span className="flex items-center gap-1 text-xs font-black px-3 py-1 rounded bg-green-500/20 text-green-400"><CheckCircle2 size={14} /> PASSED</span>
                                                                    : <span className="flex items-center gap-1 text-xs font-black px-3 py-1 rounded bg-red-500/20 text-red-400"><AlertCircle size={14} /> FAILED</span>
                                                                }
                                                                {out.time !== undefined && (
                                                                    <span className="text-[10px] font-mono text-white/30 flex items-center gap-1">
                                                                        <Clock size={10} /> {out.time.toFixed(0)}ms
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                <div>
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">Input</span>
                                                                    <code className="text-sm font-mono text-white/80 bg-black/60 px-4 py-3 rounded-lg block border border-white/5">{tc.input}</code>
                                                                </div>
                                                                <div>
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">Expected Output</span>
                                                                    <code className="text-sm font-mono text-white/80 bg-black/60 px-4 py-3 rounded-lg block border border-white/5">{tc.expectedOutput}</code>
                                                                </div>
                                                            </div>
                                                            {!out.passed && (
                                                                <div className="mt-4 pt-4 border-t border-red-500/20">
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 block mb-2">Your Output / Error</span>
                                                                    <code className="text-sm font-mono text-red-300 bg-red-950/40 px-4 py-3 rounded-lg block whitespace-pre-wrap border border-red-500/10">
                                                                        {out.error || out.output || "No output"}
                                                                    </code>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Submit Action */}
                    <div className="flex justify-center mt-8">
                        <button
                            onClick={submitForRating}
                            disabled={isRating}
                            className="btn-primary flex items-center gap-3 px-12 py-4 shadow-[0_0_40px_rgba(200,162,255,0.2)] disabled:opacity-50"
                        >
                            {isRating ? <Loader2 size={18} className="animate-spin" /> : <Award size={18} />}
                            Submit & Rate My Skills
                        </button>
                    </div>

                </div>
            )}

            {/* ── Skill Rating Screen ── */}
            {skillRating && (
                <div className="glass-card max-w-4xl mx-auto p-8 border-[var(--accent)]/30 relative overflow-hidden animate-fade-in-up mt-8">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/10 blur-[100px] rounded-full" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--primary)]/10 blur-[100px] rounded-full" />

                    <div className="text-center mb-10 relative z-10">
                        <div className="inline-block p-3 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 mb-4">
                            <Target size={32} className="text-[var(--accent)]" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2">Skill Rating Report</h2>
                        <p className="text-white/40">Difficulty: <span className="text-white/80">{difficulty}</span> • Language: <span className="text-white/80 capitalize">{language}</span></p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                        {/* Overall Score */}
                        <div className="md:col-span-1 bg-black/40 rounded-3xl border border-white/5 p-8 flex flex-col items-center justify-center text-center">
                            <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="80" cy="80" r="70" className="stroke-white/5" strokeWidth="8" fill="none" />
                                    <circle cx="80" cy="80" r="70" className="stroke-[var(--accent)] transition-all duration-1000" strokeWidth="8" fill="none" strokeDasharray="440" strokeDashoffset={440 - (440 * skillRating.overallRating) / 100} strokeLinecap="round" />
                                </svg>
                                <div className="absolute flex flex-col items-center justify-center">
                                    <span className="text-5xl font-black text-white">{skillRating.overallRating}</span>
                                    <span className="text-[10px] uppercase tracking-widest text-white/40">Out of 100</span>
                                </div>
                            </div>
                            <h3 className="text-4xl font-black bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-transparent bg-clip-text">
                                Grade {skillRating.grade}
                            </h3>
                        </div>

                        {/* Breakdown */}
                        <div className="md:col-span-2 bg-black/40 border border-white/5 rounded-3xl p-8">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-6">Execution Matrix</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {Object.entries(skillRating.breakdown).map(([key, value]) => (
                                    <div key={key}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-white/60 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            <span className="text-xs font-black text-white">{value}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-[var(--primary)] rounded-full transition-all duration-1000" style={{ width: `${value}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-10">
                                <div>
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-green-400 mb-3 flex items-center gap-2">
                                        <Unlock size={12} /> Strengths
                                    </h5>
                                    <ul className="space-y-2">
                                        {skillRating.strengths.map((str, i) => (
                                            <li key={i} className="text-xs text-white/60 flex items-start gap-2">
                                                <span className="text-green-400 mt-0.5">•</span> {str}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-yellow-400 mb-3 flex items-center gap-2">
                                        <Lock size={12} /> Needs Work
                                    </h5>
                                    <ul className="space-y-2">
                                        {skillRating.improvements.map((imp, i) => (
                                            <li key={i} className="text-xs text-white/60 flex items-start gap-2">
                                                <span className="text-yellow-400 mt-0.5">•</span> {imp}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/5">
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Suggested Topics</h5>
                                <div className="flex flex-wrap gap-2">
                                    {skillRating.suggestedTopics.map((topic, i) => (
                                        <span key={i} className="px-3 py-1 bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] text-xs font-bold rounded-full">
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 flex justify-center w-full md:col-span-3">
                            <button
                                onClick={() => { setSkillRating(null); setChallenges([]); }}
                                className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all font-bold text-sm"
                            >
                                Return to Configuration
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
