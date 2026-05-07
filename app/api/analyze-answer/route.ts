import { NextRequest, NextResponse } from "next/server";
import { analyzeInterview } from "../../../lib/feedbackAnalyzer";
import { supabase } from "../../../lib/supabase";
import { calculateWeightedScore, determineNextDifficulty } from "../../../lib/scoringEngine";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { questions, fullTranscript, interviewId, timeTaken, currentDifficulty, question, candidateAnswer } = body;

        // Support both single answer (question/candidateAnswer) and batch (questions/fullTranscript)
        let feedback: any = null;
        let activeQuestion: any = null;

        if (question && candidateAnswer) {
            // Single answer mode (New Adaptive Flow)
            const { analyzeSingleAnswer } = await import("../../../lib/feedbackAnalyzer");
            feedback = await analyzeSingleAnswer(question, candidateAnswer);
            activeQuestion = question;
        } else {
            // Legacy/Batch batch mode
            if (!questions || !fullTranscript) {
                return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
            }
            const feedbackRecords = await analyzeInterview(questions, fullTranscript);
            activeQuestion = questions[questions.length - 1]; // Assume last
            feedback = feedbackRecords[activeQuestion.id];
        }

        if (!feedback) {
            throw new Error("Evaluation failed to generate feedback.");
        }

        // 2. Persist to Supabase
        if (interviewId) {
            await supabase.from("session_data").insert([{
                interview_id: interviewId,
                question_content: activeQuestion.question,
                category: activeQuestion.category,
                difficulty: activeQuestion.difficulty || currentDifficulty || "Medium",
                transcript: candidateAnswer || fullTranscript,
                relevance_score: feedback.metrics.relevance,
                similarity_score: feedback.metrics.semantic_similarity,
                depth_score: feedback.metrics.technical_depth,
                clarity_score: feedback.metrics.communication,
                weighted_score: feedback.score,
                feedback_text: feedback.overallFeedback,
                strengths: feedback.strengths,
                weaknesses: feedback.weaknesses,
                suggested_answer: feedback.suggestedAnswer,
                time_taken: timeTaken || 0
            }]);
        }

        // 3. Adaptive Logic: Determine next difficulty
        let nextDifficulty = currentDifficulty || activeQuestion.difficulty || "Medium";
        if (interviewId) {
            const { data: history } = await supabase
                .from("session_data")
                .select("weighted_score")
                .eq("interview_id", interviewId)
                .order("created_at", { ascending: false })
                .limit(3);

            const scores = history?.map(h => h.weighted_score) || [feedback.score];
            nextDifficulty = determineNextDifficulty(nextDifficulty, scores);
        }

        return NextResponse.json({
            feedback: feedback,
            adaptation: {
                nextDifficulty: nextDifficulty,
                performanceTrend: [feedback.score],
                status: feedback.score > 70 ? "Excelled" : feedback.score > 40 ? "Steady" : "Struggling"
            }
        });

    } catch (error: any) {
        console.error("Error in Stateful Analysis:", error);
        return NextResponse.json(
            { error: error.message || "Failed to analyze and persist interview data" },
            { status: 500 }
        );
    }
}
