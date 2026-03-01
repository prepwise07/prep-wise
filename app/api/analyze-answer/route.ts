import { NextRequest, NextResponse } from "next/server";
import { analyzeInterview } from "../../../lib/feedbackAnalyzer";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { questions, fullTranscript, frames } = body;

        if (!questions || !fullTranscript) {
            return NextResponse.json({ error: "Questions and fullTranscript are required" }, { status: 400 });
        }

        const feedbackRecord = await analyzeInterview(questions, fullTranscript, frames || []);

        return NextResponse.json(feedbackRecord);
    } catch (error: any) {
        console.error("Error analyzing interview:", error);
        return NextResponse.json(
            { error: error.message || "Failed to analyze interview" },
            { status: 500 }
        );
    }
}
