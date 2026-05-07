import { Question } from "./questions";
import { CandidateProfile } from "./resumeParser";
import { generateJSON } from "./aiService";

export async function generateDynamicQuestions(profile: CandidateProfile, count: number = 5, customConcepts: string = "", difficulty: string = "Medium"): Promise<Question[]> {
    const allSkills = [
        ...(profile.skills?.programming || []),
        ...(profile.skills?.web || []),
        ...(profile.skills?.databases || []),
        ...(profile.skills?.tools || [])
    ].map(s => s.name);

    const rawData = profile.summary || allSkills.join(", ");

    let extraInstruct = "";
    if (customConcepts && customConcepts.trim() !== "") {
        extraInstruct = "\nThe candidate explicitly requested you focus strictly on these specific concepts: '" + customConcepts + "'";
    }

    const prompt = `
You are an expert technical interviewer planning a technical interview.
The candidate has provided the following raw script/data summarizing their background, skills, or specific requirements for this interview:
"${rawData}"
${extraInstruct}

Generate EXACTLY ${count} technical interview questions tailored specifically to the data provided above. 
TARGET DIFFICULTY: ${difficulty}

Do not ask generic questions unrelated to their script. 

Output strictly as a JSON object matching this schema:
{
  "questions": [
    {
      "id": "unique-uuid-or-id",
      "category": "String (e.g. React, Optimization, Behavioral)",
      "difficulty": "${difficulty}",
      "question": "The actual technical interview question",
      "keyPoints": ["Expected concept 1", "Expected concept 2", "Expected concept 3"]
    }
  ]
}
Do not use markdown wrappers like \`\`\`json. Just raw valid JSON output.
`;

    try {
        const parsed = await generateJSON<{ questions: Question[] }>(`You generate ${difficulty} difficulty technical interview questions exactly matching provided candidate content.`, prompt);
        return parsed.questions || [];
    } catch (e) {
        console.error("Failed generating dynamic questions, falling back to static:", e);
        return [
            { id: "fallback-1", category: "Core", difficulty: "Medium", question: "Can you describe a challenging problem you solved related to your listed background?", keyPoints: ["Problem identification", "Action taken"] },
            { id: "fallback-2", category: "System", difficulty: "Hard", question: "How would you optimize an architecture related to your primary skills for high scale?", keyPoints: ["Bottlenecks", "Optimization strategies"] }
        ];
    }
}
