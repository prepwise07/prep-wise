"use client";

import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import {
    Play,
    Trash2,
    Terminal as TerminalIcon,
    Code2,
    Settings,
    Info,
    ChevronRight,
    Maximize2,
    Copy,
    Clock,
    Cpu,
    Monitor
} from "lucide-react";

// Types
type LanguageId = "javascript" | "python" | "java" | "cpp";

interface Language {
    id: LanguageId;
    label: string;
    icon: string;
    judgeId: number;
    color: string;
    extension: string;
}

const LANGUAGES: Language[] = [
    { id: "java", label: "Java", icon: "☕", judgeId: 62, color: "text-orange-400", extension: "java" },
    { id: "python", label: "Python", icon: "PY", judgeId: 71, color: "text-blue-400", extension: "py" },
    { id: "javascript", label: "JavaScript", icon: "JS", judgeId: 63, color: "text-yellow-400", extension: "js" },
    { id: "cpp", label: "C++", icon: "C++", judgeId: 54, color: "text-indigo-400", extension: "cpp" },
];

const STARTER_CODE: Record<LanguageId, string> = {
    java: `class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n    }\n}`,
    python: `print("Hello from Python!")`,
    javascript: `console.log("Hello from JavaScript!");`,
    cpp: `#include <iostream>\n\nint main() {\n    std::cout << "Hello from C++!" << std::endl;\n    return 0;\n}`,
};

export default function SimpleCompiler() {
    const [languageId, setLanguageId] = useState<LanguageId>("java");
    const [code, setCode] = useState(STARTER_CODE["java"]);
    const [stdin, setStdin] = useState("");
    const [output, setOutput] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [executionTime, setExecutionTime] = useState<number | null>(null);

    const activeLanguage = LANGUAGES.find(l => l.id === languageId)!;

    const handleLanguageChange = (id: LanguageId) => {
        setLanguageId(id);
        setCode(STARTER_CODE[id]);
    };

    const runCode = async () => {
        setIsRunning(true);
        const startTime = performance.now();
        try {
            const res = await fetch("/api/run-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code,
                    languageId: activeLanguage.judgeId,
                    stdin: stdin
                }),
            });
            const data = await res.json();

            let out = "";
            if (data.stdout) out += data.stdout;
            if (data.stderr) out += data.stderr;
            if (data.compile_output) out += data.compile_output;

            if (!out && data.status?.description) {
                out = `System: ${data.status.description}`;
            }

            // Handle mock output from the API if no key is present
            if (out.includes("[MOCK OUTPUT]")) {
                out = out.replace("[MOCK OUTPUT]", "System (Mock Mode):").trim();
            }

            setOutput(out || "Executed. No output.");
            setExecutionTime(Math.round(performance.now() - startTime));
        } catch (e) {
            setOutput("Execution failed. Please check your connection.");
        } finally {
            setIsRunning(false);
        }
    };

    const clearOutput = () => {
        setOutput("");
        setStdin("");
        setExecutionTime(null);
    };

    const copyCode = () => {
        navigator.clipboard.writeText(code);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] min-h-[600px] w-full bg-[#0c0c16] rounded-2xl overflow-hidden border border-white/5 shadow-2xl animate-fade-in">

            {/* ── Top Header Bar ── */}
            <div className="h-14 bg-black/60 border-b border-white/5 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                            <Code2 size={16} className="text-[var(--primary)]" />
                        </div>
                        <span className="text-sm font-black text-white/80 uppercase tracking-widest hidden sm:block">Compiler</span>
                    </div>

                    <div className="h-6 w-px bg-white/10 mx-2" />

                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                        <span className="text-[10px] font-mono text-white/40">Main.{activeLanguage.extension}</span>
                        <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500/30" />
                            <div className="w-2 h-2 rounded-full bg-yellow-500/30" />
                            <div className="w-2 h-2 rounded-full bg-green-500/30" />
                        </div>
                    </div>

                    <a
                        href="/compiler/full-ide"
                        className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/5 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-500/10 transition-all"
                    >
                        <Maximize2 size={12} />
                        Full IDE Mode
                    </a>
                </div>

                <div className="flex items-center gap-3">
                    {executionTime && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 transition-all">
                            <Clock size={12} className="text-white/40" />
                            <span className="text-[10px] font-mono text-white/60">{executionTime}ms</span>
                        </div>
                    )}

                    <button
                        onClick={copyCode}
                        className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all"
                        title="Copy Code"
                    >
                        <Copy size={16} />
                    </button>

                    <button
                        onClick={runCode}
                        disabled={isRunning}
                        className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[var(--primary)] text-black font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isRunning ? (
                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                            <Play size={14} fill="currentColor" />
                        )}
                        Run
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">

                {/* ── Left Sidebar (Languages) ── */}
                <div className="w-16 sm:w-20 bg-black/40 border-r border-white/5 flex flex-col items-center py-6 gap-6 shrink-0">
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.id}
                            onClick={() => handleLanguageChange(lang.id)}
                            className={`relative group w-10 h-10 flex items-center justify-center rounded-xl transition-all ${languageId === lang.id
                                ? "bg-white/10 text-white shadow-lg"
                                : "text-white/30 hover:text-white/60 hover:bg-white/5"
                                }`}
                            title={lang.label}
                        >
                            <span className={`font-black text-xs ${languageId === lang.id ? lang.color : ""}`}>
                                {lang.icon}
                            </span>
                            {languageId === lang.id && (
                                <div className="absolute left-0 w-1 h-6 bg-[var(--primary)] rounded-r-full" />
                            )}
                        </button>
                    ))}

                    <div className="mt-auto flex flex-col gap-4 pb-4">
                        <button className="p-3 text-white/20 hover:text-white/40 transition-colors">
                            <Settings size={18} />
                        </button>
                        <button className="p-3 text-white/20 hover:text-white/40 transition-colors">
                            <Info size={18} />
                        </button>
                    </div>
                </div>

                {/* ── Center Area (Editor) ── */}
                <div className="flex-1 flex flex-col relative bg-[#1e1e1e]">
                    <Editor
                        height="100%"
                        language={activeLanguage.id === "cpp" ? "cpp" : activeLanguage.id}
                        theme="vs-dark"
                        value={code}
                        onChange={(val) => setCode(val || "")}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 16,
                            fontFamily: "JetBrains Mono, monospace",
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 20 },
                            cursorBlinking: "smooth",
                            smoothScrolling: true,
                        }}
                    />
                </div>

                {/* ── Right Panel (Input & Output) ── */}
                <div className="w-full md:w-[40%] bg-[#0a0514] border-l border-white/5 flex flex-col shrink-0">

                    {/* Stdin Input Area */}
                    <div className="h-1/3 flex flex-col border-b border-white/5">
                        <div className="h-10 bg-black/40 border-b border-white/5 flex items-center justify-between px-6 shrink-0">
                            <div className="flex items-center gap-2">
                                <Settings size={12} className="text-white/40" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Input (stdin)</span>
                            </div>
                        </div>
                        <textarea
                            value={stdin}
                            onChange={(e) => setStdin(e.target.value)}
                            placeholder="Provide program input here..."
                            className="flex-1 w-full bg-black/20 p-4 font-mono text-sm text-white/60 outline-none resize-none placeholder:text-white/10 custom-scrollbar"
                        />
                    </div>

                    {/* Output Console */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="h-10 bg-black/40 border-b border-white/5 flex items-center justify-between px-6 shrink-0">
                            <div className="flex items-center gap-2">
                                <TerminalIcon size={12} className="text-white/40" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Output Console</span>
                            </div>
                            <button
                                onClick={clearOutput}
                                className="text-[9px] font-bold text-white/30 hover:text-white/60 flex items-center gap-1.5 transition-colors"
                            >
                                <Trash2 size={10} />
                                Clear
                            </button>
                        </div>

                        <div className="flex-1 p-6 font-mono text-sm overflow-y-auto custom-scrollbar bg-black/10">
                            {!output && !isRunning ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-4">
                                    <TerminalIcon size={32} />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Ready to execute...</p>
                                </div>
                            ) : isRunning ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-white/40 animate-pulse">
                                        <div className="w-1 h-4 bg-[var(--primary)] rounded-full" />
                                        <span className="text-xs uppercase font-bold tracking-tighter">Compiling & Running...</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                        <div className="flex items-center gap-2 text-green-500/60">
                                            <ChevronRight size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Execution Result</span>
                                        </div>
                                    </div>
                                    <pre className="whitespace-pre-wrap text-white/90 leading-relaxed font-mono selection:bg-[var(--primary)]/30 text-[13px]">
                                        {output}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Output Footer */}
                    <div className="px-6 py-3 bg-black/40 border-t border-white/5 flex items-center gap-6">
                        <div className="flex items-center gap-2 opacity-30">
                            <Cpu size={12} />
                            <span className="text-[9px] font-bold uppercase tracking-tighter">VM Status: Optimized</span>
                        </div>
                        <div className="flex items-center gap-2 opacity-30">
                            <Monitor size={12} />
                            <span className="text-[9px] font-bold uppercase tracking-tighter">Output: Validated</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
