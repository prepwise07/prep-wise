import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/aiService";

export const maxDuration = 60; // Allow 60s for LLM processing

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { difficulty, language } = body;

    if (!difficulty) {
      return NextResponse.json({ error: "Missing difficulty" }, { status: 400 });
    }

    const systemPrompt = `You are a technical interview question generator for PrepWise.
Generate exactly TWO coding challenges for the specified difficulty level (${difficulty}).

REQUIREMENTS:
- The challenges MUST match the difficulty level:
  - Basic: Easy array/string manipulation, basic loops.
  - Medium: Hash maps, two pointers, simple recursion, basic trees.
  - Advanced: Dynamic programming, graphs, complex backtracking.
- Provide ONLY the minimal empty function signature/skeleton for JavaScript, Python, Java, and C++ in the starterCode. ABSOLUTELY NO sample solution code or logic should be included.
- Write exactly 3 test cases for each challenge. The test cases MUST have clearly defined inputs and expectedOutputs as strings. Ensure the expectedOutput matches the exact print/return format of the starter code.
- Provide 2 helpful hints for each challenge.

RESPOND EXACTLY IN THIS JSON FORMAT:
{
  "challenges": [
    {
      "id": "unique-id-1",
      "title": "Problem Title",
      "difficulty": "Basic",
      "description": "Clear problem description with examples.",
      "starterCode": {
        "javascript": "function solve(input) {\\n  // write your logic here\\n}",
        "python": "def solve(input):\\n  # write your logic here\\n  pass",
        "java": "class Main {\\n  public static void main(String[] args) {\\n    // write your logic here\\n  }\\n}",
        "cpp": "#include <iostream>\\nusing namespace std;\\n\\nint main() {\\n  // write your logic here\\n  return 0;\\n}"
      },
      "testCases": [
        { "input": "...", "expectedOutput": "..." }
      ],
      "hints": ["Hint 1", "Hint 2"]
    }
  ]
}`;

    const userPrompt = `Generate 2 ${difficulty} coding challenges. The user prefers ${language || 'any language'}, so make sure the problems are well-suited for it.`;

    const data = await generateJSON<any>(systemPrompt, userPrompt);

    if (!data || !data.challenges || !Array.isArray(data.challenges)) {
      throw new Error("Invalid response format from AI");
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error generating challenges:", error);
    return NextResponse.json({ error: error.message || "Failed to generate challenges" }, { status: 500 });
  }
}
