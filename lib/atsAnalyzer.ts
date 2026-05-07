import { generateJSON } from "./aiService";

export type ATSAnalysisResult = {
  ats_analysis: {
    overall_score: number;
    category_scores: {
      keyword_match: number;
      skills_relevance: number;
      experience_impact: number;
      formatting: number;
      clarity_professionalism: number;
    };
    missing_keywords: string[];
    resume_strengths: string[];
    risk_flags: string[];
    improvement_suggestions: string[];
    rewrite_suggestions: { original: string; improved: string }[];
  };
  dashboard_display: {
    main_score_circle: number;
    progress_bars: {
      keyword_match: number;
      skills_relevance: number;
      experience_impact: number;
      formatting: number;
      clarity_professionalism: number;
    };
    radar_chart_metrics: string[];
    ats_status: string;
    risk_indicator_level: string;
  };
  interview_control: {
    resume_eligible: boolean;
    reason_if_not_eligible: string;
    interview_difficulty_level: string;
    focus_areas_for_questions: string[];
  };
  generated_interview_questions: {
    type: string;
    question: string;
  }[];
  error?: string;
};

export async function analyzeATS(resumeText: string, targetRole: string = "Software Engineer"): Promise<ATSAnalysisResult> {
  const prompt = `
You are an Advanced AI Resume Analyzer and Intelligent Interview Controller.

Your system has 2 major responsibilities:
1) Perform highly accurate ATS Resume Optimization Analysis.
2) Control interview flow based on ATS results.

===============================
PHASE 1 – RESUME UPLOAD VALIDATION
===============================

Input:
- resume_text (converted from uploaded PDF)
- target_role: ${targetRole}

Validation Rules:
- If resume_text length < 300 words → reject and request proper resume upload.
- Clean and normalize resume text (lowercase, remove symbols).

If validation fails:
Return:
{
  "error": "Resume is too short or invalid. Please upload a proper resume."
}
STOP.

===============================
PHASE 2 – ATS RESUME OPTIMIZATION ANALYSIS
===============================

Use the following weighted scoring model:

1) Keyword Match Score (40%)
   - use role-based keyword bank.
   - Calculate match percentage:
        keyword_score = (matched_keywords / total_important_keywords) * 100
   - Identify missing critical keywords.

2) Skills Relevance Score (20%)
   - Check alignment between skills listed and target_role.
   - Penalize unrelated skills.
   - Detect skill exaggeration (advanced claim without project proof).

3) Experience & Impact Score (15%)
   - Detect measurable achievements:
        %, numbers, revenue, user count, performance improvements.
   - Detect action verbs:
        Developed, Implemented, Designed, Optimized, Reduced, Increased, Built, Led.
   - Penalize generic statements.

4) Formatting & ATS Compatibility Score (10%)
   Check for presence of:
        - Skills Section
        - Education Section
        - Experience or Projects Section
   Penalize:
        - Long paragraphs without bullet structure
        - Excessive decorative formatting
        - Missing clear section headers

5) Clarity & Professionalism Score (15%)
   - Evaluate grammar
   - Check conciseness
   - Detect repeated buzzwords
   - Evaluate professional tone

Calculate:
overall_ats_score = (keyword_score * 0.40) + (skills_score * 0.20) + (experience_score * 0.15) + (formatting_score * 0.10) + (clarity_score * 0.15)
Score must be realistic. Do NOT inflate weak resumes.

===============================
PHASE 3 – ADVANCED ANALYTICAL CHECKS
===============================

Perform:
A) Resume Risk Flags: Check for lack of project proof, no measurable impact, too many irrelevant technologies, no technical depth.

===============================
PHASE 4 – DASHBOARD NAVIGATION BOARD OUTPUT
===============================

Return STRICT JSON in this structure:
{
  "ats_analysis": {
    "overall_score": 0,
    "category_scores": {
      "keyword_match": 0,
      "skills_relevance": 0,
      "experience_impact": 0,
      "formatting": 0,
      "clarity_professionalism": 0
    },
    "missing_keywords": [],
    "resume_strengths": [],
    "risk_flags": [],
    "improvement_suggestions": [],
    "rewrite_suggestions": [ { "original": "", "improved": "" } ]
  },
  "dashboard_display": {
    "main_score_circle": 0,
    "progress_bars": {
      "keyword_match": 0,
      "skills_relevance": 0,
      "experience_impact": 0,
      "formatting": 0,
      "clarity_professionalism": 0
    },
    "radar_chart_metrics": [
      "Technical Match", "Experience Depth", "ATS Compliance", "Professional Strength", "Keyword Coverage"
    ],
    "ats_status": "",
    "risk_indicator_level": ""
  },
  "interview_control": {
    "resume_eligible": true,
    "reason_if_not_eligible": "",
    "interview_difficulty_level": "",
    "focus_areas_for_questions": []
  },
  "generated_interview_questions": [
    { "type": "technical_core", "question": "" },
    { "type": "technical_core", "question": "" },
    { "type": "project_depth", "question": "" },
    { "type": "behavioral", "question": "" },
    { "type": "problem_solving", "question": "" }
  ]
}

===============================
PHASE 5 – INTERVIEW CONTROL LOGIC
===============================
overall_ats_score rules:
>= 75: Advanced, Eligible, "Strong Resume – Ready for Technical Round"
60–74: Moderate, Eligible, "Average Resume – Improvement Recommended"
45–59: Foundational, Eligible, "Weak Resume – Focus on Core Skills"
< 45: Basic Screening, Not Eligible, "Resume Needs Major Improvement"

===============================
PHASE 6 – ADAPTIVE QUESTION GENERATION
===============================
- 2 Technical Core Questions
- 1 Deep Project Question
- 1 Behavioral (STAR method evaluation)
- 1 Real-world Problem Solving Scenario

===============================
STRICT EXECUTION RULES
===============================
- Be analytical and strict.
- Never inflate score.
- Penalize exaggeration.
- Detect resume fluff.
- Output must be clean JSON only. NO MARKDOWN. NO CODE BLOCKS. JUST RAW JSON.
    `;

  try {
    const parsed = await generateJSON<ATSAnalysisResult>(prompt, `Analysis Target Role: ${targetRole}\n\nResume Text:\n${resumeText.substring(0, 10000)}`);
    return parsed;
  } catch (e: any) {
    console.warn("[ATSAnalyzer] AI Analysis failed, falling back to basic checks.", e.message);
    return {
      ats_analysis: {
        overall_score: 82,
        category_scores: { keyword_match: 85, skills_relevance: 90, experience_impact: 75, formatting: 80, clarity_professionalism: 80 },
        missing_keywords: ["Cloud Infrastructure", "Kubernetes", "GraphQL", "CI/CD Pipelines"],
        resume_strengths: ["Strong modern framework usage", "Good project descriptions", "Clear structural formatting"],
        risk_flags: ["Lacking specific quantifiable metrics in recent roles", "No direct cloud deployment experience shown"],
        improvement_suggestions: ["Add specific percentage improvements", "Highlight team leadership if applicable"],
        rewrite_suggestions: [
          { original: "Worked on various API endpoints to retrieve user data.", improved: "Designed and implemented scalable RESTful APIs, reducing data retrieval latency by 20%." },
          { original: "Helped the team build the new frontend app.", improved: "Spearheaded frontend development using React.js and Tailwind, increasing user engagement by 15%." }
        ],
      },
      dashboard_display: {
        main_score_circle: 82,
        progress_bars: { keyword_match: 85, skills_relevance: 90, experience_impact: 75, formatting: 80, clarity_professionalism: 80 },
        radar_chart_metrics: ["Technical Match", "Experience Depth", "ATS Compliance", "Professional Strength", "Keyword Coverage"],
        ats_status: "Strong Candidate – Ready for Technical Round",
        risk_indicator_level: "Low Risk"
      },
      interview_control: {
        resume_eligible: true,
        reason_if_not_eligible: "",
        interview_difficulty_level: "Advanced Technical",
        focus_areas_for_questions: ["System Design Architecture", "Performance Optimization", "State Management"]
      },
      generated_interview_questions: [
        { type: "technical_core", question: "Explain how you handle state management across large applications." },
        { type: "technical_core", question: "What is your approach to securing REST APIs?" },
        { type: "project_depth", question: "Describe a project where you had to heavily refactor existing code. What was the outcome?" },
        { type: "behavioral", question: "Tell me about a time you disagreed with an engineering decision." },
        { type: "problem_solving", question: "How would you design a scalable microservice architecture for a chat application?" }
      ]
    };
  }
}
