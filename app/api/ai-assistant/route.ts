import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/aiService";

export async function POST(req: Request) {
    try {
        const { action, code, language, error, context } = await req.json();

        let systemPrompt = "You are a senior full-stack software engineer and code architect. ";
        let userPrompt = "";

        if (action === "explain") {
            systemPrompt += "Provide a clear, concise explanation of the provided code block. Highlight key logic, time complexity if applicable, and potential edge cases.";
            userPrompt = `Language: ${language}\nCode:\n${code}`;
        } else if (action === "fix") {
            systemPrompt += "Analyze the provided code and the specific error message. Provide a corrected version of the code and a brief explanation of what was fixed.";
            userPrompt = `Language: ${language}\nError:\n${error}\nCode:\n${code}`;
        } else if (action === "optimize") {
            systemPrompt += "Review the provided code for performance bottlenecks. Provide an optimized version and explain the improvements made.";
            userPrompt = `Language: ${language}\nCode:\n${code}`;
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        systemPrompt += " Respond ONLY with a JSON object containing 'explanation' (string) and 'suggestedCode' (string or null).";

        const result = await generateJSON<{ explanation: string, suggestedCode: string | null }>(
            systemPrompt,
            userPrompt
        );

        return NextResponse.json(result);
    } catch (err: any) {
        console.error("[AI Assistant API] Error:", err);
        return NextResponse.json({ error: err.message || "Failed to generate AI response" }, { status: 500 });
    }
}
