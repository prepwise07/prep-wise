import { GoogleGenerativeAI } from "@google/generative-ai";
// NOTE: groq-sdk is intentionally NOT imported at the top level.
// It is loaded via dynamic import inside the function to prevent
// Vercel/Turbopack from evaluating it at build time, which causes
// the "Missing OPENAI_API_KEY" error from the Groq SDK's OpenAI-forked internals.

/**
 * Delay helper for retry logic
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Sanitize and parse potentially malformed JSON from AI models.
 * Handles trailing commas, extra text outside JSON, etc.
 */
function safeParseJSON<T>(raw: string): T {
    let text = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    const firstBracket = text.indexOf("[");
    const lastBracket = text.lastIndexOf("]");

    if (firstBrace !== -1 && lastBrace > firstBrace) {
        if (firstBracket !== -1 && firstBracket < firstBrace && lastBracket > lastBrace) {
            text = text.substring(firstBracket, lastBracket + 1);
        } else {
            text = text.substring(firstBrace, lastBrace + 1);
        }
    }

    text = text.replace(/,\s*([\]}])/g, "$1");
    return JSON.parse(text) as T;
}

/**
 * High-Availability AI Service prioritizing Gemini with Groq fallback.
 * groq-sdk is dynamically imported at runtime to avoid build-time errors on Vercel.
 */
export async function generateJSON<T>(systemPrompt: string, userPrompt: string): Promise<T> {
    // ── PHASE 1: Try Gemini (up to 3 attempts with backoff) ──
    if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes("XXXX")) {
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`[AIService] Gemini 2.5 Flash — Attempt ${attempt}/${maxRetries}`);
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
                const model = genAI.getGenerativeModel({
                    model: "gemini-2.5-flash",
                    systemInstruction: systemPrompt,
                });

                const result = await model.generateContent({
                    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
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
                    console.warn(`[AIService] Gemini attempt ${attempt} failed — Retrying in ${waitMs / 1000}s...`);
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

    // ── PHASE 2: Fallback to Groq (dynamic import — never runs at build time) ──
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey && groqKey.trim() !== "" && !groqKey.includes("XXXX")) {
        try {
            console.log("[AIService] Attempting Fallback: Groq Llama 3.3 70b");
            // Dynamic import prevents groq-sdk from being evaluated at build time
            const { default: Groq } = await import("groq-sdk");
            
            const groq = new Groq({ apiKey: groqKey });
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

    throw new Error("No AI provider configured. Please set GEMINI_API_KEY or GROQ_API_KEY.");
}
