import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { code, files, languageId, stdin } = body;

        // If 'files' is provided, use it (Multi-file IDE). 
        // If only 'code' is provided, convert to a single-file array (Simple Compiler).
        let projectFiles = files || [];

        const ONECOMPILER_API_KEY = process.env.ONECOMPILER_API_KEY || "";
        const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";

        if (!ONECOMPILER_API_KEY && !RAPIDAPI_KEY) {
            return NextResponse.json({
                error: "OneCompiler API Key is missing. Please add ONECOMPILER_API_KEY to your .env.local file."
            }, { status: 401 });
        }

        // Map IDs to OneCompiler strings
        const languageMap: Record<number | string, string> = {
            71: "python", "python": "python",
            50: "c", "c": "c",
            54: "cpp", "cpp": "cpp",
            62: "java", "java": "java",
            63: "nodejs", "javascript": "nodejs",
            60: "go", "go": "go",
            73: "rust", "rust": "rust"
        };

        const languageStr = languageMap[languageId] || languageId;

        // OneCompiler API Configuration
        const url = ONECOMPILER_API_KEY
            ? "https://api.onecompiler.com/v1/run"
            : "https://onecompiler.p.rapidapi.com/v1/run";

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        if (ONECOMPILER_API_KEY) {
            headers["X-OneCompiler-Key"] = ONECOMPILER_API_KEY;
        } else {
            headers["x-rapidapi-key"] = RAPIDAPI_KEY;
            headers["x-rapidapi-host"] = "onecompiler.p.rapidapi.com";
        }

        // Handle case where it's a single-file call from SimpleCompiler
        if (projectFiles.length === 0 && code) {
            const filenames: Record<string, string> = {
                python: "main.py", java: "Main.java", cpp: "main.cpp",
                c: "main.c", nodejs: "index.js", go: "main.go", rust: "main.rs"
            };
            projectFiles = [
                {
                    name: filenames[languageStr as string] || "main.txt",
                    content: code
                }
            ];
        }

        const submissionPayload = {
            language: languageStr,
            stdin: stdin || "",
            files: projectFiles
        };

        const runResponse = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(submissionPayload),
        });

        const data = await runResponse.json();

        if (!runResponse.ok) {
            return NextResponse.json({
                error: `OneCompiler API Error: ${data.message || runResponse.statusText}`
            }, { status: runResponse.status });
        }

        const runResult = {
            stdout: data.stdout || null,
            stderr: data.stderr || null,
            compile_output: data.exception || null,
            time: data.executionTime ? (data.executionTime / 1000).toString() : "0",
            status: {
                id: data.status === "success" ? 3 : 4,
                description: data.status === "success" ? "Accepted" : "Error"
            },
            message: data.exception || null
        };

        return NextResponse.json(runResult);

    } catch (error: any) {
        console.error("[OneCompiler Error]:", error);
        return NextResponse.json({
            error: error.message || "Execution failed",
            details: error.stack
        }, { status: 500 });
    }
}
