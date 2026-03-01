import OpenAI from "openai";
import { Question } from "./questions";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export type FeedbackReport = {
    score: number; // 0-10
    strengths: string[];
    weaknesses: string[];
    missedPoints: string[];
    overallFeedback: string;
    suggestedAnswer: string;
    bodyLanguageFeedback?: string;
};

export async function analyzeInterview(questions: Question[], fullTranscript: string, frames: string[] = []): Promise<Record<string, FeedbackReport>> {
    const questionList = questions.map(q => `
ID: ${q.id}
Question: ${q.question}
Category: ${q.category}
Key Points Expected: ${q.keyPoints.join(", ")}
`).join("\n");

    const prompt = `
You are an extremely strict, elite Principal Staff Engineer evaluating a candidate's full technical interview transcript for PrepWise.
Evaluate the candidate's answers iteratively for every single question asked based on the transcript provided.

SCORING RUBRIC (0-10):
- 9 to 10: Flawless, Staff-level exceptional quality.
- 7 to 8: Good, passing score but missed minor nuances.
- 5 to 6: Mediocre, lacking depth or precision.
- 0 to 4: Complete failure, fundamental misunderstanding.

INTERVIEW QUESTIONS ASKED:
${questionList}

FULL LIVE TRANSCRIPT:
"${fullTranscript}"

Analyze the transcript, map the candidate's responses to the specific questions, and format your output strictly as a JSON object where the keys are the exact Question IDs, and the values are their specific feedback reports matching this schema:
{
  "q1_id_here": {
    "score": number (0-10),
    "strengths": ["string"],
    "weaknesses": ["string"],
    "missedPoints": ["string"],
    "overallFeedback": "string",
    "suggestedAnswer": "string",
    "bodyLanguageFeedback": "string (Analyze eye contact, posture, confidence if images provided. Otherwise leave empty)"
  },
  "intro-1": { ... }
}
Do not include markdown blocks like \`\`\`json. Just the raw JSON. Wait, if the candidate completely skipped or didn't get to answer a question, score it 0 and state they did not answer.
`;

    // Construct message payload supporting Vision
    const contentPayload: any[] = [
        { type: "text", text: prompt }
    ];

    if (frames && frames.length > 0) {
        // limit to max 2 frames from the video to completely avoid OpenAI 'Payload Too Large' errors
        const framesToUse = frames.length > 2 ? [frames[0], frames[frames.length - 1]] : frames;
        for (const frame of framesToUse) {
            contentPayload.push({
                type: "image_url",
                image_url: { url: frame }
            });
        }
    }

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are an expert technical interviewer giving structured JSON feedback for an entire transcript. If images of the candidate are provided, strictly evaluate their professional presence, eye contact, body language, and confidence as a hiring manager." },
                { role: "user", content: contentPayload }
            ],
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        if (!content) {
            throw new Error("Failed to analyze interview with AI.");
        }

        return JSON.parse(content) as Record<string, FeedbackReport>;
    } catch (e: any) {
        console.error("OpenAI API Quota Exceeded or Error. Returning Mock Feedback to prevent crash:", e);

        // MOCK FALLBACK for 429 Quota Exceeded
        const mockFallback: Record<string, FeedbackReport> = {};
        questions.forEach(q => {
            mockFallback[q.id] = {
                score: 7,
                strengths: ["Great initial attempt", "Confidence in voice"],
                weaknesses: ["Needs deeper technical explanation", "Missed a few edge cases"],
                missedPoints: ["Optimization considerations"],
                overallFeedback: "You gave a solid answer but due to API quota limits, we are providing this fallback mock feedback so you can still view this page!",
                suggestedAnswer: "In a real scenario, outline the complexity and architectural trade-offs.",
                bodyLanguageFeedback: "Excellent eye contact and calm posture."
            };
        });
        return mockFallback;
    }
}
