import sys

def fix_file():
    with open("components/CodeChallengeRoom.tsx", "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    idx = -1
    for i, line in enumerate(lines):
        if "{/* Editor Header */}" in line:
            idx = i
            break
            
    if idx == -1:
        print("Could not find Editor Header")
        return
        
    kept_lines = lines[:idx]
    
    new_tail = """                                </div>
                            )}
                        </div>

                        {/* Right: Code Editor & Execution */}
                        {activeChallenge && (
                            <div className="lg:col-span-7 flex flex-col glass-card border-white/5 overflow-hidden min-h-[600px] max-h-[800px]">
                                {/* Editor Header */}
                                <div className="h-12 bg-black/60 border-b border-white/5 flex items-center justify-between px-4 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <Code2 size={14} className="text-white/40" />
                                        <span className="text-xs font-mono text-white/60">
                                            {`solution.${language === "javascript" ? "js" : language === "python" ? "py" : language === "java" ? "java" : "cpp"}`}
                                        </span>
                                    </div>
                                </div>

                                {/* Monaco Editor */}
                                <div className="flex-1 w-full bg-black/60 relative min-h-[300px]">
                                    <Editor
                                        height="100%"
                                        language={language === "cpp" ? "cpp" : language}
                                        theme="vs-dark"
                                        value={currentState?.code || ""}
                                        onChange={(val) => {
                                            if (activeChallenge && val !== undefined) {
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

                                {/* ── Separate Execution & Test Results Block ── */}
                                <div className="border-[var(--accent)]/30 border-t-2 flex flex-col items-center bg-black/40 overflow-hidden relative shadow-[0_0_30px_rgba(232,152,90,0.1)] h-[300px] shrink-0">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-50" />
                                    
                                    <div className="w-full h-14 bg-black/80 border-b border-[var(--accent)]/20 flex items-center justify-between px-6 shrink-0">
                                        <div className="flex items-center gap-3">
                                            <Terminal size={18} className="text-[var(--accent)]" />
                                            <span className="text-sm font-black uppercase tracking-widest text-white/90">Execution & Results</span>
                                        </div>
                                        <button
                                            onClick={runCode}
                                            disabled={currentState?.isSubmitting}
                                            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[var(--accent)]/20 hover:bg-[var(--accent)]/30 border border-[var(--accent)]/40 transition-all text-sm font-black text-[var(--accent)] disabled:opacity-50"
                                        >
                                            {currentState?.isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} className="text-[var(--accent)]" />}
                                            Run Code
                                        </button>
                                    </div>

                                    <div className="w-full p-6 text-white text-sm overflow-y-auto custom-scrollbar">
                                        {Object.keys(currentState?.runOutputs || {}).length === 0 ? (
                                            <div className="py-8 flex flex-col items-center justify-center text-center">
                                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                                    <Zap size={20} className="text-white/20" />
                                                </div>
                                                <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Run your code to see results</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {activeChallenge?.testCases.map((tc, i) => {
                                                    const out = currentState?.runOutputs[i];
                                                    if (!out) return null;
                                                    return (
                                                        <div key={i} className={`p-4 rounded-xl border-2 shadow-lg ${out.passed ? "bg-green-500/5 border-green-500/30" : "bg-red-500/5 border-red-500/30"}`}>
                                                            <div className="flex items-center justify-between mb-4">
                                                                <span className="text-sm font-black text-white/90">Test Case {i + 1}</span>
                                                                {out.passed
                                                                    ? <span className="flex items-center gap-1 text-xs font-black px-3 py-1 rounded bg-green-500/20 text-green-400"><CheckCircle2 size={14} /> PASSED</span>
                                                                    : <span className="flex items-center gap-1 text-xs font-black px-3 py-1 rounded bg-red-500/20 text-red-400"><AlertCircle size={14} /> FAILED</span>
                                                                }
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
"""
    
    with open("components/CodeChallengeRoom.tsx", "w", encoding="utf-8") as f:
        f.writelines(kept_lines)
        f.write(new_tail)
        
    print("CodeChallengeRoom fixed.")

if __name__ == '__main__':
    fix_file()
