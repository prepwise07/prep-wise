import { Question } from "./questions";
import { CandidateProfile } from "./resumeParser";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function generateDynamicQuestions(profile: CandidateProfile, count: number = 5, customConcepts: string = ""): Promise<Question[]> {
    const rawData = profile.summary || profile.skills.join(", ");

    // Construct instructions to dynamically generate AI questions based strictly on user data
    const prompt = `
You are an expert technical interviewer planning a technical interview.
The candidate has provided the following raw script/data summarizing their background, skills, or specific requirements for this interview:
"${rawData}"
${customConcepts ? `\nThe candidate explicitly requested you focus strictly on these specific concepts: "${customConcepts}"` : ""}

Generate EXACTLY ${count} technical interview questions tailored specifically to the data provided above. Do not ask generic questions unrelated to their script. Ensure the questions escalate in depth.

Output strictly as a JSON object matching this schema:
{
  "questions": [
    {
      "id": "unique-uuid-or-id",
      "category": "String (e.g. React, Optimization, Behavioral)",
      "difficulty": "Easy" | "Medium" | "Hard",
      "question": "The actual technical interview question",
      "keyPoints": ["Expected concept 1", "Expected concept 2", "Expected concept 3"]
    }
  ]
}
Do not use markdown wrappers like \`\`\`json. Just raw valid JSON output.
`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: "You generate customized technical interview questions exactly matching provided candidate content." }, { role: "user", content: prompt }],
            response_format: { type: "json_object" },
        });

        const respText = completion.choices[0]?.message?.content;
        if (!respText) throw new Error("No questions generated.");

        const parsed = JSON.parse(respText);
        return parsed.questions || [];
    } catch (e) {
        console.error("Failed generating dynamic questions, falling back to static:", e);
        return [
            { id: "fallback-1", category: "Core", difficulty: "Medium", question: "Can you describe a challenging problem you solved related to your listed background?", keyPoints: ["Problem identification", "Action taken"] },
            { id: "fallback-2", category: "System", difficulty: "Hard", question: "How would you optimize an architecture related to your primary skills for high scale?", keyPoints: ["Bottlenecks", "Optimization strategies"] }
        ];
    }
}
