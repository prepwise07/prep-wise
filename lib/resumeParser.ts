import { promises as fs } from "fs";
import * as os from "os";
import * as path from "path";
import mammoth from "mammoth";
import { generateJSON } from "./aiService";
import { analyzeATS } from "./atsAnalyzer";

export type SkillItem = { name: string; level: string };

export type CandidateProfile = {
    // 1. Basic Information
    name: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    age?: string;
    photoBase64?: string;

    // 2. Education Details
    education: {
        degree: string;
        branch: string;
        institution: string;
        year: string;
        cgpa: string;
        inter_percentage?: string;
        matric_percentage?: string;
    }[];

    // 3. Technical Skills
    skills: {
        programming: SkillItem[];
        web: SkillItem[];
        databases: SkillItem[];
        tools: SkillItem[];
    };

    // 4. Projects
    projects: {
        title: string;
        description: string;
        technologies: string[];
        role: string;
        link: string;
        impact: string
    }[];

    // 5. Internship / Experience
    experience: {
        company: string;
        role: string;
        duration: string;
        responsibilities: string[]
    }[];

    // 6. Certifications
    certifications: { name: string; platform: string; year: string }[];

    // 7. Achievements
    achievements: string[];

    // 8. Personal Section
    strengths: string[];
    hobbies: string[];
    objective: string;

    // Generated Summaries
    summary: string;

    // Advanced ATS Integration
    atsData?: any;
};

export async function parseResume(buffer: Buffer, mimeType: string, filename: string = ""): Promise<CandidateProfile> {
    let text = "";

    const isPDF = mimeType.includes("pdf") || filename.toLowerCase().endsWith(".pdf");
    const isDocx = mimeType.includes("document") || mimeType.includes("msword") || filename.toLowerCase().endsWith(".docx") || filename.toLowerCase().endsWith(".doc");

    if (isPDF) {
        try {
            console.log(`[ResumeParser] Recovering text from PDF: ${filename}`);
            // Bypass Turbopack tracing which causes ENOENT for test/data files
            let pdfExtract;
            try { pdfExtract = eval("require('my-pdf-parse')"); } catch (e) { pdfExtract = require("my-pdf-parse"); }
            if (typeof pdfExtract !== 'function' && pdfExtract && pdfExtract.default) pdfExtract = pdfExtract.default;
            if (typeof pdfExtract !== 'function') throw new Error("PDF parser failed to load correctly: " + typeof pdfExtract);
            const data = await pdfExtract(buffer);
            text = data.text;

            if (!text || text.trim().length === 0) {
                console.warn(`[ResumeParser] PDF ${filename} yielded no text content.`);
                throw new Error("Unable to extract text from this PDF. It might be a scanned image or empty. Please ensure it's a text-based document.");
            }

            console.log(`[ResumeParser] Successfully extracted ${text.length} characters from PDF.`);
        } catch (e: any) {
            console.error("[ResumeParser] PDF Recovery Failed:", e);
            throw new Error(`PDF Analytics Failure: ${e.message || "The document structure is advanced and unsupported."}`);
        }
    } else if (isDocx) {
        const docData = await mammoth.extractRawText({ buffer });
        text = docData.value;
    } else {
        throw new Error("Unsupported file format. Found: " + mimeType + " | " + filename);
    }

    return await analyzeTextProfile(text, filename);
}

export async function analyzeTextProfile(text: string, filename: string = "Manual Entry"): Promise<CandidateProfile> {
    try {
        const systemPrompt = `You are an expert technical recruiter analyzing a resume to build a professional IT portfolio.
            Extract and structure the professional data. Always return ONLY valid JSON matching this schema exactly:
            {
              "name": "string",
              "email": "string",
              "phone": "string",
              "location": "string",
              "linkedin": "string",
              "github": "string",
              "education": [{ "degree": "string", "branch": "string", "institution": "string", "year": "string", "cgpa": "string", "inter_percentage": "string", "matric_percentage": "string" }],
              "skills": {
                 "programming": [{ "name": "string", "level": "Beginner|Intermediate|Advanced" }],
                 "web": [{ "name": "string", "level": "Beginner|Intermediate|Advanced" }],
                 "databases": [{ "name": "string", "level": "Beginner|Intermediate|Advanced" }],
                 "tools": [{ "name": "string", "level": "Beginner|Intermediate|Advanced" }]
              },
              "projects": [{ "title": "string", "description": "string", "technologies": ["string"], "role": "string", "link": "string", "impact": "string" }],
              "experience": [{ "company": "string", "role": "string", "duration": "string", "responsibilities": ["string"] }],
              "certifications": [{ "name": "string", "platform": "string", "year": "string" }],
              "achievements": ["string"],
              "strengths": ["string"],
              "hobbies": ["string"],
              "objective": "A 3-4 professional line career objective based on the profile",
              "summary": "A resume-ready professional summary paragraph"
            }
            Do not include markdown blocks like \`\`\`json. Just the raw JSON. If a detail is not found, leave as an empty string or empty array.`;

        // Run both Profile Extraction and AI ATS Analysis concurrently to save time
        const [profileRes, atsRes] = await Promise.allSettled([
            generateJSON<CandidateProfile>(systemPrompt, text),
            analyzeATS(text)
        ]);

        let parsedProfile: CandidateProfile;

        if (profileRes.status !== 'fulfilled' || !profileRes.value) {
            console.warn("[ResumeParser] AI Profile Extraction failed, using fallback.");
            parsedProfile = generateFallbackProfile(text, filename);
        } else {
            parsedProfile = profileRes.value;
        }

        // Attach ATS Data if successful
        if (atsRes.status === 'fulfilled') {
            parsedProfile.atsData = atsRes.value;
        } else {
            console.warn("[ResumeParser] ATS Analysis failed", atsRes.reason);
            try { parsedProfile.atsData = await analyzeATS(text); } catch (e) { }
        }

        return parsedProfile;
    } catch (aiError: any) {
        console.warn("[ResumeParser] Fatal error in extraction. Falling back.", aiError.message);
        const fallbackProfile = generateFallbackProfile(text, filename);
        try { fallbackProfile.atsData = await analyzeATS(text); } catch (e) { }
        return fallbackProfile;
    }
}

/**
 * Local Fallback Extraction Logic
 * Ensures the app "just works" even if OpenAI credits are exhausted.
 */
function generateFallbackProfile(text: string, filename: string): CandidateProfile {
    const nameMatch = text.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/);
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.[a-z]{2,}/i);

    const commonSkills = ["React", "TypeScript", "Node.js", "Python", "Java", "C++", "C#", ".NET", "AWS", "SQL", "Tailwind", "Next.js", "Docker", "Git"];
    const foundSkills = commonSkills.filter(skill => {
        const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`\\b${escapedSkill}\\b`, 'i').test(text);
    });

    const mappedSkills = foundSkills.map(s => ({ name: s, level: "Intermediate" }));

    return {
        name: nameMatch ? nameMatch[1] : (filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") || "Candidate"),
        email: emailMatch ? emailMatch[0] : "",
        phone: "",
        location: "Unspecified",
        linkedin: "",
        github: "",
        education: [{ degree: "Degree", branch: "Branch", institution: "Institution", year: "Ongoing", cgpa: "N/A" }],
        skills: {
            programming: mappedSkills,
            web: [],
            databases: [],
            tools: []
        },
        projects: [],
        experience: [{ company: "As per Resume", role: "Professional Background", duration: "Multiple Years", responsibilities: ["Refer to original document"] }],
        certifications: [],
        achievements: [],
        strengths: ["Problem Solving", "Adaptability"],
        hobbies: [],
        objective: "Seeking a challenging role in a dynamic organization to leverage my skills.",
        summary: text.substring(0, 500) + "..."
    };
}
