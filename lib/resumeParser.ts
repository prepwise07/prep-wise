import { promises as fs } from "fs";
import * as os from "os";
import * as path from "path";
import mammoth from "mammoth";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export type CandidateProfile = {
    name: string;
    email: string;
    skills: string[];
    experience: { role: string; company: string; duration: string }[];
    education: { degree: string; institution: string; year: string }[];
    summary: string;
};

export async function parseResume(buffer: Buffer, mimeType: string, filename: string = ""): Promise<CandidateProfile> {
    let text = "";

    const isPDF = mimeType.includes("pdf") || filename.toLowerCase().endsWith(".pdf");
    const isDocx = mimeType.includes("document") || mimeType.includes("msword") || filename.toLowerCase().endsWith(".docx") || filename.toLowerCase().endsWith(".doc");

    if (isPDF) {
        const tmpFilePath = path.join(os.tmpdir(), `resume-${Date.now()}.pdf`);
        try {
            await fs.writeFile(tmpFilePath, buffer);
            const dataBuffer = await fs.readFile(tmpFilePath);

            // Bypass turbopack CJS require bugs completely by fetching it directly from Node.js runtime
            const pdfParse = eval("require('my-pdf-parse')");
            const pdfData = await pdfParse(dataBuffer);
            text = pdfData.text;
        } catch (e: any) {
            throw new Error(`PDF Parsing failed: ${e.message}`);
        } finally {
            await fs.unlink(tmpFilePath).catch(() => { });
        }
    } else if (isDocx) {
        const docData = await mammoth.extractRawText({ buffer });
        text = docData.value;
    } else {
        throw new Error("Unsupported file format. Found: " + mimeType + " | " + filename);
    }

    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: `You are an expert technical recruiter. Extract the candidate's profile from the following resume text. 
        Always return ONLY valid JSON matching this schema:
        {
          "name": "string",
          "email": "string",
          "skills": ["string"],
          "experience": [{ "role": "string", "company": "string", "duration": "string" }],
          "education": [{ "degree": "string", "institution": "string", "year": "string" }],
          "summary": "string"
        }
        Do not include markdown blocks like \`\`\`json. Just the raw JSON.`
            },
            {
                role: "user",
                content: text,
            }
        ],
        response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    if (!content) {
        throw new Error("Failed to parse resume with AI.");
    }

    return JSON.parse(content) as CandidateProfile;
}
