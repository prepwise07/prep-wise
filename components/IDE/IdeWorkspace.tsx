"use client";

import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import {
    File, Folder, Plus, X, Play, Save, Share2,
    Settings, Terminal as TerminalIcon, Cpu, Zap,
    ChevronRight, BrainCircuit, Code, MessageSquare, Trash2, HelpCircle
} from "lucide-react";
import { saveProject, shareProject } from "@/lib/compilerService";

// Types
interface CodeFile {
    name: string;
    content: string;
    language: string;
}

interface Project {
    id: string;
    name: string;
    files: CodeFile[];
    language: string;
}

const DEFAULT_PROJECTS: Record<string, CodeFile[]> = {
    python: [{ name: "main.py", content: "print(\"Hello World\")", language: "python" }],
    java: [{ name: "Main.java", content: "public class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello World\");\n  }\n}", language: "java" }],
    cpp: [{ name: "main.cpp", content: "#include <iostream>\n\nint main() {\n  std::cout << \"Hello World\" << std::endl;\n  return 0;\n}", language: "cpp" }],
    javascript: [{ name: "main.js", content: "console.log(\"Hello World\");", language: "javascript" }]
};

export default function IdeWorkspace() {
    const [project, setProject] = useState<Project>({
        id: "temp",
        name: "My Project",
        language: "python",
        files: DEFAULT_PROJECTS["python"]
    });

    const [activeFileIndex, setActiveFileIndex] = useState(0);
    const [output, setOutput] = useState("");
    const [stdin, setStdin] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<"explorer" | "ai">("explorer");
    const [aiResponse, setAiResponse] = useState<{ explanation: string, suggestedCode: string | null } | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);

    const currentFile = project.files[activeFileIndex];

    const updateFileContent = (content: string | undefined) => {
        if (content === undefined) return;
        const newFiles = [...project.files];
        newFiles[activeFileIndex] = { ...newFiles[activeFileIndex], content };
        setProject({ ...project, files: newFiles });
    };

    const runCode = async () => {
        setIsRunning(true);
        setOutput("Submitting code to remote sandbox...");

        try {
            // Note: In real setup, this points to your COMPILER_SERVICE_URL
            const res = await fetch("http://localhost:5000/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    language: project.language,
                    files: project.files,
                    stdin
                })
            });
            const data = await res.json();

            if (data.error) {
                setOutput(`Queue Error: ${data.error}`);
                setIsRunning(false);
                return;
            }

            const { jobId } = data;

            // Polling for status
            const pollInterval = setInterval(async () => {
                const statusRes = await fetch(`http://localhost:5000/status/${jobId}`);
                const data = await statusRes.json();

                if (data.status === "completed") {
                    clearInterval(pollInterval);
                    const { stdout, stderr } = data.result;
                    setOutput((stdout || "") + (stderr ? `\n\nERROR:\n${stderr}` : ""));
                    setIsRunning(false);
                } else if (data.status === "failed") {
                    clearInterval(pollInterval);
                    setOutput("System Error: Task failed to execute in sandbox.");
                    setIsRunning(false);
                }
            }, 1000);

        } catch (err: any) {
            setOutput(`Failed to connect to execution engine. Ensure the backend is running.\n\nDetails: ${err.message}`);
            setIsRunning(false);
        }
    };

    const askAI = async (action: string) => {
        setIsAiLoading(true);
        setActiveTab("ai");
        setAiResponse(null);
        try {
            const res = await fetch("/api/ai-assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action,
                    code: currentFile.content,
                    language: project.language,
                    error: output.includes("ERROR:") ? output.split("ERROR:")[1] : null
                })
            });
            const data = await res.json();
            setAiResponse(data);
        } catch (err) {
            console.error("AI Error:", err);
        } finally {
            setIsAiLoading(false);
        }
    };

    const applyFix = () => {
        if (aiResponse?.suggestedCode) {
            updateFileContent(aiResponse.suggestedCode);
            setAiResponse(null);
        }
    };

    const addFile = () => {
        const name = prompt("Enter file name:");
        if (!name) return;
        setProject({
            ...project,
            files: [...project.files, { name, content: "", language: project.language }]
        });
        setActiveFileIndex(project.files.length);
    };

    const removeFile = (index: number) => {
        if (project.files.length === 1) return;
        const newFiles = project.files.filter((_, i) => i !== index);
        setProject({ ...project, files: newFiles });
        setActiveFileIndex(Math.max(0, index - 1));
    };

    const changeLanguage = (lang: string) => {
        setProject({
            ...project,
            language: lang,
            files: DEFAULT_PROJECTS[lang] || project.files
        });
        setActiveFileIndex(0);
    };

    const handleSave = async () => {
        try {
            const data = await saveProject({
                id: project.id,
                name: project.name,
                language: project.language,
                files: project.files
            });
            setProject({ ...project, id: data.id });
            alert("Project saved successfully!");
        } catch (err: any) {
            alert(`Save failed: ${err.message}`);
        }
    };

    const handleShare = async () => {
        if (project.id === "temp") {
            alert("Please save the project before sharing.");
            return;
        }
        try {
            const link = await shareProject(project.id);
            navigator.clipboard.writeText(link);
            alert("Share link copied to clipboard!");
        } catch (err: any) {
            alert(`Sharing failed: ${err.message}`);
        }
    };
    return (
        <div className="flex flex-col h-[calc(100vh-80px)] bg-[#0d0d17] text-white">

            {/* Header Toolbar */}
            <div className="h-14 bg-black/40 border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-20">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 group cursor-pointer">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 group-hover:bg-indigo-500/30 transition-all">
                            <Code size={16} className="text-indigo-400" />
                        </div>
                        <input
                            type="text"
                            className="bg-transparent border-none outline-none font-black text-sm tracking-tighter uppercase focus:ring-0 w-32"
                            value={project.name}
                            onChange={(e) => setProject({ ...project, name: e.target.value })}
                        />
                    </div>

                    <div className="h-6 w-px bg-white/10" />

                    <select
                        value={project.language}
                        onChange={(e) => changeLanguage(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-md text-[10px] font-black uppercase tracking-widest px-3 py-1 outline-none text-white/60 hover:text-white transition-all cursor-pointer"
                    >
                        {Object.keys(DEFAULT_PROJECTS).map(lang => (
                            <option key={lang} value={lang} className="bg-[#0d0d17] text-white">{lang.toUpperCase()}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={runCode}
                        disabled={isRunning}
                        className="flex items-center gap-2 px-6 py-2 rounded-lg bg-green-500 text-black font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isRunning ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Play size={14} fill="currentColor" />}
                        Run code
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white font-black text-xs uppercase tracking-widest transition-all"
                    >
                        <Save size={14} />
                        Save
                    </button>
                    <button onClick={handleShare} className="p-2 text-white/40 hover:text-white transition-all"><Share2 size={18} /></button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">

                {/* Left Sidebar Toolbar (Icons) */}
                <div className="w-16 bg-black flex flex-col items-center py-6 gap-6 border-r border-white/5 shrink-0 z-10">
                    <button
                        onClick={() => { setActiveTab("explorer"); setSidebarOpen(true); }}
                        className={`p-3 rounded-xl transition-all ${activeTab === "explorer" ? "bg-white/10 text-indigo-400" : "text-white/20 hover:text-white/40"}`}
                    >
                        <Folder size={20} />
                    </button>
                    <button
                        onClick={() => { setActiveTab("ai"); setSidebarOpen(true); }}
                        className={`p-3 rounded-xl transition-all ${activeTab === "ai" ? "bg-white/10 text-pink-400" : "text-white/20 hover:text-white/40"}`}
                    >
                        <BrainCircuit size={20} />
                    </button>
                    <div className="mt-auto flex flex-col gap-4 pb-4">
                        <button className="p-2 text-white/10 hover:text-white/30 transition-all" onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle Sidebar">
                            <ChevronRight className={`transition-transform duration-300 ${sidebarOpen ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Left Sidebar Panel (Content) */}
                {sidebarOpen && (
                    <div className="w-64 bg-black/40 border-r border-white/5 flex flex-col shrink-0 animate-in slide-in-from-left duration-300">
                        <div className="h-12 border-b border-white/5 flex items-center justify-between px-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{activeTab === "ai" ? "AI Assistant" : "Project Explorer"}</span>
                            {activeTab === "explorer" && <Plus size={14} className="text-white/40 hover:text-white cursor-pointer" onClick={addFile} />}
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            {activeTab === "explorer" ? (
                                <div className="p-2 space-y-1">
                                    {project.files.map((file, i) => (
                                        <div
                                            key={i}
                                            onClick={() => setActiveFileIndex(i)}
                                            className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${activeFileIndex === i ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20" : "hover:bg-white/5 text-white/50 border border-transparent"}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <File size={14} className={activeFileIndex === i ? "text-indigo-400" : "text-white/20"} />
                                                <span className="text-sm font-medium">{file.name}</span>
                                            </div>
                                            <X
                                                size={12}
                                                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                                                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 space-y-6">
                                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl items-center flex flex-col text-center space-y-3">
                                        <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center">
                                            <BrainCircuit size={24} className="text-indigo-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-white/80">AI Code Mentor</h4>
                                            <p className="text-[10px] text-white/30 leading-relaxed">Powered by Gemini & Groq for deep technical analysis.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => askAI("explain")}
                                            className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all text-left space-y-2 group"
                                        >
                                            <HelpCircle size={14} className="text-blue-400" />
                                            <span className="block text-[10px] font-bold text-white/50 group-hover:text-white transition-all">Explain logic</span>
                                        </button>
                                        <button
                                            onClick={() => askAI("optimize")}
                                            className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all text-left space-y-2 group"
                                        >
                                            <Zap size={14} className="text-yellow-400" />
                                            <span className="block text-[10px] font-bold text-white/50 group-hover:text-white transition-all">Optimize performance</span>
                                        </button>
                                    </div>

                                    {isAiLoading && (
                                        <div className="flex flex-col items-center justify-center py-10 space-y-4">
                                            <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Thinking...</span>
                                        </div>
                                    )}

                                    {aiResponse && (
                                        <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-4 animate-in fade-in zoom-in-95 duration-500">
                                            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                                                <MessageSquare size={12} className="text-pink-400" />
                                                <span className="text-[10px] font-black uppercase text-white/40">AI Feedback</span>
                                            </div>
                                            <p className="text-[11px] text-white/60 leading-relaxed italic line-clamp-6 hover:line-clamp-none transition-all cursor-pointer">
                                                "{aiResponse.explanation}"
                                            </p>
                                            {aiResponse.suggestedCode && (
                                                <button
                                                    onClick={applyFix}
                                                    className="w-full py-2 bg-pink-500/20 border border-pink-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest text-pink-400 hover:bg-pink-500/30 transition-all"
                                                >
                                                    Apply Suggested Fix
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Editor & Console Split */}
                <div className="flex-1 flex flex-col min-w-0">

                    {/* File Tabs */}
                    <div className="h-10 bg-black/60 border-b border-white/5 flex items-center px-4 gap-2 overflow-x-auto no-scrollbar shrink-0">
                        {project.files.map((file, i) => (
                            <div
                                key={i}
                                onClick={() => setActiveFileIndex(i)}
                                className={`h-full flex items-center gap-2 px-4 text-xs font-medium cursor-pointer transition-all border-b-2 ${activeFileIndex === i ? "border-indigo-500 text-white bg-indigo-500/5" : "border-transparent text-white/30 hover:text-white/50"}`}
                            >
                                <span className="whitespace-nowrap">{file.name}</span>
                                {project.files.length > 1 && (
                                    <X size={10} className="hover:text-red-400" onClick={(e) => { e.stopPropagation(); removeFile(i); }} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Monaco Editor */}
                    <div className="flex-1 overflow-hidden relative">
                        <Editor
                            height="100%"
                            theme="vs-dark"
                            language={currentFile.language}
                            value={currentFile.content}
                            onChange={updateFileContent}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 15,
                                fontFamily: "JetBrains Mono, monospace",
                                padding: { top: 20 },
                                smoothScrolling: true,
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                            }}
                        />
                    </div>

                    {/* Console & Stdin Area */}
                    <div className="h-64 bg-black border-t border-white/10 flex flex-col shrink-0">
                        <div className="h-10 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-white/2">
                            <div className="flex items-center gap-6">
                                <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--primary)] border-b-2 border-[var(--primary)] h-10 px-2 transition-all">
                                    <TerminalIcon size={14} /> Console
                                </button>
                                <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white/40 h-10 px-2 transition-all">
                                    <Zap size={14} /> Stdin
                                </button>
                            </div>
                            <button onClick={() => setOutput("")} className="text-white/20 hover:text-white transition-all"><Trash2 size={14} /></button>
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            {/* Stdin Panel (Left small part) */}
                            <div className="w-64 border-r border-white/5 flex flex-col">
                                <textarea
                                    className="flex-1 bg-black/40 p-4 font-mono text-sm text-white/50 resize-none outline-none placeholder:text-white/10"
                                    placeholder="Program input here..."
                                    value={stdin}
                                    onChange={(e) => setStdin(e.target.value)}
                                />
                            </div>

                            {/* Stdout Panel (Right large part) */}
                            <div className="flex-1 p-6 font-mono text-sm overflow-y-auto no-scrollbar selection:bg-indigo-500/30">
                                {!output && !isRunning ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-10 text-center space-y-4">
                                        <TerminalIcon size={40} />
                                        <p className="text-xs font-bold uppercase tracking-widest">Awaiting execution...</p>
                                    </div>
                                ) : isRunning ? (
                                    <div className="flex items-center gap-3 text-indigo-400 animate-pulse">
                                        <ChevronRight size={16} />
                                        <span className="font-bold tracking-widest uppercase text-xs">Processing in remote sandbox...</span>
                                    </div>
                                ) : (
                                    <pre className="text-white/90 whitespace-pre-wrap">{output}</pre>
                                )}
                            </div>
                        </div>

                        {/* Status Footer */}
                        <div className="h-8 bg-black border-t border-white/5 flex items-center px-6 justify-between shrink-0">
                            <div className="flex items-center gap-4 opacity-30">
                                <span className="text-[9px] font-bold uppercase">UTF-8</span>
                                <span className="text-[9px] font-bold uppercase">Ready</span>
                            </div>
                            <div className="flex items-center gap-4 opacity-30">
                                <Cpu size={12} />
                                <span className="text-[9px] font-bold uppercase tracking-tighter">Mem: 0.0s</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
