import { generateJSON } from "./aiService";
import { Question } from "./questions";

/** Per-frame result from the Python DeepFace service */
export type FrameAnalysis = {
    face_detected: boolean;
    dominant_emotion: string;
    emotions?: Record<string, number>;
    eye_contact: boolean;
    confidence_score: number;  // 0-100
    feedback_text?: string;
    service_offline?: boolean;
};

/** Session-level visual summary produced by /summarise-session */
export type VisualAnalysisSummary = {
    summary: string;
    avg_confidence: number;
    presence_percentage: number;
    eye_contact_percentage: number;
    dominant_emotion: string;
    frames_analysed: number;
};

export type FeedbackReport = {
    score: number; // 0-100 (Final weighted score calculated)
    metrics: {
        relevance: number;
        semantic_similarity: number;
        technical_depth: number;
        communication: number;
    };
    strengths: string[];
    weaknesses: string[];
    missedPoints: string[];
    overallFeedback: string;
    suggestedAnswer: string;
    bodyLanguageFeedback?: string;
    visualSummary?: VisualAnalysisSummary;
};

export async function analyzeSingleAnswer(question: Question, answer: string): Promise<FeedbackReport> {
    const prompt = `
    Evaluate this single technical interview answer. 
    QUESTION: ${question.question}
    EXPECTED KEY POINTS: ${question.keyPoints.join(", ")}
    CANDIDATE ANSWER: "${answer}"

    SCORING CRITERIA (Scale 0-10):
    1. Relevance: Answer alignment.
    2. Semantic Similarity: Nearness to elite technical standards.
    3. Technical Depth: Use of specific industry terms/edges.
    4. Communication: Structure and clarity.

    RETURN STRICT JSON:
    {
      "score": number (0-100 based on weighted metrics),
      "metrics": { "relevance": 0-10, "semantic_similarity": 0-10, "technical_depth": 0-10, "communication": 0-10 },
      "strengths": ["string"],
      "weaknesses": ["string"],
      "missedPoints": ["string"],
      "overallFeedback": "string",
      "suggestedAnswer": "elite technical answer"
    }

    WEIGHTED CALCULATION: (Relevance*4) + (Similarity*2) + (Depth*1.5) + (Communication*2.5).
    `;

    try {
        const report = await generateJSON<FeedbackReport>(prompt, "Evaluate this single technical interview answer.");
        return report;
    } catch (e) {
        return {
            score: 0,
            metrics: { relevance: 0, semantic_similarity: 0, technical_depth: 0, communication: 0 },
            strengths: [], weaknesses: ["Analysis failure"], missedPoints: [], overallFeedback: "Error processing answer.", suggestedAnswer: ""
        };
    }
}

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

SCORING CRITERIA (Scale each 0-10):
1. **Relevance**: Did they actually answer what was asked vs rambling?
2. **Semantic Similarity**: How close is their tech explanation to a standard industry-best "perfect" answer? 
3. **Technical Depth**: Did they use appropriate professional terminology and cover edge cases?
4. **Communication**: Is the answer structured, clear, and professional?

INTERVIEW QUESTIONS ASKED:
${questionList}

FULL LIVE TRANSCRIPT:
"${fullTranscript}"

Analyze the transcript, map responses to IDs, and return strictly JSON:
{
  "q1_id_here": {
    "metrics": {
       "relevance": number,
       "semantic_similarity": number,
       "technical_depth": number,
       "communication": number
    },
    "strengths": ["string"],
    "weaknesses": ["string"],
    "missedPoints": ["string"],
    "overallFeedback": "string",
    "suggestedAnswer": "A perfect, high-level technical response to this question",
    "bodyLanguageFeedback": "Visual feedback disabled in Groq mode"
  }
}

WEIGHTED CALCULATION RULE:
The final overall score for each question must be (Relevance*4) + (Similarity*2) + (Depth*1.5) + (Communication*2.5). 
This will result in a 0-100 scale. Include this calculation result as "score" in the JSON.
Do not use markdown blocks. Output raw valid JSON.
`;

    try {
        const parsed = await generateJSON<Record<string, FeedbackReport>>(prompt, "Perform weighted NLP evaluation of transcript.");

        if (!parsed) throw new Error("Failed to analyze interview with AI.");

        // Ensure every key has a numeric score field if AI missed it in the JSON nesting
        Object.keys(parsed).forEach(qid => {
            const item = parsed[qid];
            if (item.metrics && !item.score) {
                item.score = (item.metrics.relevance * 4) + (item.metrics.semantic_similarity * 2) + (item.metrics.technical_depth * 1.5) + (item.metrics.communication * 2.5);
                item.score = Math.round(item.score);
            }
        });

        return parsed;
    } catch (e: any) {
        console.error("Analysis failed. Triggering fallback.", e.message);
        const fallback: Record<string, FeedbackReport> = {};
        questions.forEach(q => {
            fallback[q.id] = {
                score: 50,
                metrics: { relevance: 5, semantic_similarity: 5, technical_depth: 5, communication: 5 },
                strengths: ["Attempted to answer"],
                weaknesses: ["AI analysis was interrupted; please refresh and try again."],
                missedPoints: ["Analysis incomplete"],
                overallFeedback: "A fallback score was generated due to intense server load.",
                suggestedAnswer: "Refer to documentation for the ideal standard."
            };
        });
        return fallback;
    }
}
