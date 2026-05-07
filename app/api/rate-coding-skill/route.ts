import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/aiService";

export const dynamic = "force-dynamic";

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { submissions, difficulty } = body;

        if (!submissions || !Array.isArray(submissions)) {
            return NextResponse.json({ error: "Missing or invalid submissions" }, { status: 400 });
        }

        const systemPrompt = `You are an expert technical interviewer evaluating a candidate's coding challenge submissions.
The candidate completed challenges at the ${difficulty} difficulty level.

Analyze their submitted code, the outputs, and test case results.
Provide a comprehensive skill rating report.

REQUIREMENTS:
- Be highly analytical and objective.
- Calculate an overall rating out of 100.
- Provide a letter grade (e.g., A+, A, B-, C).
- Score 4 specific dimensions out of 100: Problem Solving, Code Quality, Efficiency, Accuracy.
- Identify exactly 3 strengths and 3 areas for improvement.
- Suggest 2 concrete topics for them to study next.

RESPOND EXACTLY IN THIS JSON FORMAT:
{
  "overallRating": 85,
  "grade": "B+",
  "breakdown": {
    "problemSolving": 88,
    "codeQuality": 82,
    "efficiency": 75,
    "accuracy": 95
  },
  "strengths": ["Clear variable naming", "Handles edge cases well", "Good algorithmic structure"],
  "improvements": ["Memory could be optimized", "Missing inline comments", "Avoid nested loops where possible"],
  "suggestedTopics": ["Hash Maps", "Time Complexity Analysis"]
}`;

        const userPrompt = `Evaluate the following candidate submissions:\n\n${JSON.stringify(submissions, null, 2)}`;

        const data = await generateJSON<any>(systemPrompt, userPrompt);

        if (!data || !data.overallRating) {
            throw new Error("Invalid response format from AI");
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Error grading submission:", error);
        return NextResponse.json({ error: error.message || "Failed to grade code" }, { status: 500 });
    }
}
