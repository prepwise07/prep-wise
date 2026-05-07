import { Question } from "./questions";

export interface AnswerPerformance {
    relevance: number;        // 0-10 (How much it answered the question)
    NLP_similarity: number;   // 0-10 (Semantic closeness to ideal answer)
    keyword_match: number;    // 0-10 (Presence of key technical terms)
    communication: number;    // 0-10 (Clarity, speed, hesitation)
    technical_depth: number;  // 0-10 (Advanced concepts vs basic)
    time_taken: number;       // seconds
}

export interface FinalScore {
    overall: number;          // 0-100
    breakdown: AnswerPerformance;
}

/**
 * Calculates a weighted final score for a single answer.
 * Relevance 40%, Similarity 20%, Communication 25%, Technical Depth 15%
 */
export function calculateWeightedScore(perf: AnswerPerformance): number {
    const raw = (perf.relevance * 4) + (perf.NLP_similarity * 2) + (perf.communication * 2.5) + (perf.technical_depth * 1.5);
    return Math.round(raw); // Scales to 0-100 because max is (10*4)+(10*2)+(10*2.5)+(10*1.5) = 40+20+25+15 = 100
}

/**
 * Logic to adapt difficulty based on scores.
 */
export function determineNextDifficulty(currentDifficulty: string, lastScores: number[]): "Easy" | "Medium" | "Hard" {
    if (lastScores.length === 0) return "Medium";

    const average = lastScores.reduce((a, b) => a + b, 0) / lastScores.length;

    if (average >= 80) {
        if (currentDifficulty === "Easy") return "Medium";
        if (currentDifficulty === "Medium") return "Hard";
        return "Hard";
    }

    if (average <= 50) {
        if (currentDifficulty === "Hard") return "Medium";
        if (currentDifficulty === "Medium") return "Easy";
        return "Easy";
    }

    return currentDifficulty as any;
}
