import { NextRequest, NextResponse } from "next/server";
import { generateDynamicQuestions } from "../../../lib/questionSelector";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { profile, count, includeIntro, customConcepts, difficulty } = body;

        if (!profile) {
            return NextResponse.json({ error: "Candidate profile required" }, { status: 400 });
        }

        const exactCount = count ? parseInt(count) : 5;
        const targetDifficulty = difficulty || "Medium";
        let questions = await generateDynamicQuestions(profile, exactCount, customConcepts, targetDifficulty);

        if (includeIntro) {
            questions = [
                {
                    id: "intro-1",
                    category: "Behavioral",
                    difficulty: "Easy",
                    question: "Please introduce yourself and walk me through your technical background and experience.",
                    keyPoints: ["Clarity", "Relevance", "Communication structure", "Professional summary"]
                },
                ...questions
            ];
            // Ensure we don't exceed max count + intro
            questions = questions.slice(0, exactCount + 1);
        }

        return NextResponse.json({ questions });
    } catch (error: any) {
        console.error("Error selecting questions:", error);
        return NextResponse.json(
            { error: error.message || "Failed to select questions" },
            { status: 500 }
        );
    }
}
