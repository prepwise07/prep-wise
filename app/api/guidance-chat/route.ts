import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const maxDuration = 60; // Allow enough time for search + inference

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey.includes("XXXX")) {
            return NextResponse.json({ error: "Gemini API key is not configured." }, { status: 500 });
        }

        const body = await req.json();
        const { messages } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // System instructions to ensure it focuses on career/tech advice
        const systemPrompt = `You are an elite Technical Career Advisor and Tech News Analyst. 
The user is a software engineer using 'PrepWise' to prepare for interviews.
Your goals:
1. Provide highly accurate, actionable career guidance.
2. If asked about current events, recent tech news, or hiring trends, USE YOUR GOOGLE SEARCH GROUNDING TOOL to find the live information.
3. Be concise, professional, but friendly. Use markdown formatting to make your responses readable.
4. When you provide facts that required looking up current information, briefly mention that you checked the latest trends.`;

        // Format history for the Gemini SDK (it expects [{role: 'user'|'model', parts: [{text: '...'}]}])
        // The last message is the current prompt
        const parsedHistory = messages.slice(0, -1).map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        // GEMINI REQUIREMENT: The history must start with a 'user' message, so we skip the initial 'model' welcome message.
        while (parsedHistory.length > 0 && parsedHistory[0].role === 'model') {
            parsedHistory.shift();
        }

        const currentMessage = messages[messages.length - 1].content;

        // Use gemini-2.5-flash (consistent with aiService.ts)
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: systemPrompt,
            // Enable Google Search Grounding natively
            tools: [{ googleSearch: {} } as any],
        });

        const chat = model.startChat({
            history: parsedHistory
        });

        const result = await chat.sendMessage(currentMessage);

        // The response might include grounding metadata pointing to search sources
        const responseText = result.response.text();

        return NextResponse.json({
            content: responseText,
        });

    } catch (error: any) {
        console.error("Error in guidance chat:", error);
        return NextResponse.json({ error: error.message || "Failed to generate response" }, { status: 500 });
    }
}
