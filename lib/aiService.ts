import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

// Lazy Loaders to ensure environment variables are present when needed
const getGemini = () => {
    return new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "missing");
};

const getGroq = () => {
    return new Groq({
        apiKey: process.env.GROQ_API_KEY || "missing",
    });
};

/**
 * Delay helper for retry logic
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Sanitize and parse potentially malformed JSON from AI models.
 * Handles trailing commas, extra text outside JSON, etc.
 */
function safeParseJSON<T>(raw: string): T {
    // 1. Strip markdown code fences if present
    let text = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

    // 2. Extract just the JSON object/array (ignore any surrounding text)
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    const firstBracket = text.indexOf("[");
    const lastBracket = text.lastIndexOf("]");

    if (firstBrace !== -1 && lastBrace > firstBrace) {
        // Check if array starts before object
        if (firstBracket !== -1 && firstBracket < firstBrace && lastBracket > lastBrace) {
            text = text.substring(firstBracket, lastBracket + 1);
        } else {
            text = text.substring(firstBrace, lastBrace + 1);
        }
    }

    // 3. Fix trailing commas before } or ]
    text = text.replace(/,\s*([\]}])/g, "$1");

    return JSON.parse(text) as T;
}

/**
 * High-Availability AI Service prioritizing Gemini with retry + Groq fallback.
 * @param systemPrompt The instructions for the AI on how to format the data and behave.
 * @param userPrompt The user content to analyze or process.
 * @returns Parsed JSON Data of type T.
 */
export async function generateJSON<T>(systemPrompt: string, userPrompt: string): Promise<T> {
    // ── PHASE 1: Try Gemini (up to 3 attempts with backoff) ──
    if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes("XXXX")) {
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`[AIService] Gemini 2.5 Flash — Attempt ${attempt}/${maxRetries}`);
                const genAI = getGemini();
                const model = genAI.getGenerativeModel({
                    model: "gemini-2.5-flash",
                    systemInstruction: systemPrompt,
                });

                const result = await model.generateContent({
                    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
                    generationConfig: {
                        responseMimeType: "application/json",
                    }
                });

                const text = result.response.text() || "{}";
                const parsed = safeParseJSON<T>(text);
                console.log(`[AIService] ✓ Gemini succeeded on attempt ${attempt}.`);
                return parsed;

            } catch (geminiError: any) {
                const isRetryable = geminiError.message?.includes("503") ||
                    geminiError.message?.includes("Service Unavailable") ||
                    geminiError.message?.includes("high demand") ||
                    geminiError.message?.includes("JSON");

                if (isRetryable && attempt < maxRetries) {
                    const waitMs = attempt * 3000;
                    console.warn(`[AIService] Gemini attempt ${attempt} failed (${geminiError.message?.substring(0, 60)}...) — Retrying in ${waitMs / 1000}s...`);
                    await delay(waitMs);
                } else {
                    console.warn(`[AIService] Gemini failed after attempt ${attempt}:`, geminiError.message?.substring(0, 120));
                    break;
                }
            }
        }
    } else {
        console.warn("[AIService] GEMINI_API_KEY not configured. Skipping to Groq.");
    }

    // ── PHASE 2: Fallback to Groq ──
    if (process.env.GROQ_API_KEY) {
        try {
            console.log("[AIService] Attempting Fallback: Groq Llama 3.3 70b");
            const groq = getGroq();
            const completion = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                response_format: { type: "json_object" }
            });

            const text = completion.choices[0].message.content || "{}";
            console.log("[AIService] ✓ Groq fallback succeeded.");
            return safeParseJSON<T>(text);

        } catch (groqError: any) {
            console.error("[AIService] Groq fallback also failed:", groqError.message);
            throw new Error(`Both Gemini and Groq failed. Last error: ${groqError.message}`);
        }
    }

    throw new Error("No AI provider configured. Please set GEMINI_API_KEY or GROQ_API_KEY in .env.local");
}
