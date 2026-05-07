# PrepWise Project — Complete Module Breakdown (11 Modules)

This document provides an exhaustive list of all modules within the PrepWise project, organized by functional area.

---

## 1. Home & Landing Module
- **Public Experience**: The high-impact landing page (`app/page.tsx`) showcasing the value proposition and core capabilities.
- **Brand Identity**: Managed via the centralized `Navbar.tsx` and consistent design tokens.

## 2. User Dashboard Module
- **Activity Hub**: A personalized workspace (`app/dashboard`) where users track their progress, view interview history, and access core tools.
- **Progress Tracking**: Real-time visualization of preparation stats and metrics.

## 3. Launch Session Module
- **Session Setup**: The critical pre-interview flow (`app/interview`) where users upload resumes, select target roles, and choose difficulty levels.
- **Dynamic Configuration**: Loads role-specific data to tailor the AI's behavior for the upcoming session.

## 4. AI Mock Interview Module
- **Core Experience**: The main interactive engine (`app/interview`) featuring real-time AI questioning.
- **Voice Communication**: Powered by **Vapi AI**, handling seamless voice-to-text and text-to-voice flows.
- **Answer Analysis**: Uses **Google Gemini** and **Groq** to provide granular feedback on spoken responses.

## 5. Advance IDE & Compiler Module
- **Advance IDE**: A premium, feature-rich coding workspace (`components/IDE`) powered by the **Monaco Editor**.
- **Compiler Engine**: A robust backend service (`compiler-engine`) that handles secure, multi-language code execution.
- **Skill Assessment**: Automatically rates coding logic and efficiency.

## 6. Career Guidance & AI Mentor Module
- **Career Guidance**: AI-powered market intelligence and career counseling (`app/guidance`).
- **AI Career Assistant**: A context-aware chatbot for real-time career advice and interview tips.

## 7. Casual Talks & Behavioral Module
- **Casual Prep**: Dedicated practice sessions (`app/casual-talk`) for soft skills, introductions, and behavioral questions.
- **Behavioral Analysis**: Focuses on conversational flow and social cues.

## 8. Computer Vision (CV) Analysis Module
- **Visual Intelligence**: Real-time facial analysis via a Python microservice (`analysis_service.py`).
- **Performance Signals**: Tracks confidence, eye contact, and emotional state using **DeepFace** and **OpenCV**.

## 9. ATS Resume Checker Module
- **Resume Analysis**: Automated parsing (`pdf-parse`, `mammoth`) and ATS scoring against job descriptions.
- **Skill Extraction**: Identifies missing keywords and suggests content improvements.

## 10. Comprehensive Feedback & Reporting Module
- **Performance Evaluation**: Generates detailed reports (`components/FeedbackReport.tsx`) summarizing strengths, weaknesses, and overall scores.
- **Granular Insights**: Uses the `FeedbackCard.tsx` component to provide question-by-question breakdowns, including suggested answers and relevance metrics.
- **Real-time Feedback**: Delivers immediate verbal and visual cues during the interview session.

## 11. Platform Infrastructure & Dev Tools
- **Authentication**: Managed via **Supabase Auth** (`app/sign-in`, `app/sign-up`).
- **Real-time Sync**: Uses **Supabase Realtime** for live session data updates.
- **Dev Diagnostics**: Tools like `debug_gemini.js` and `test_keys.js` for environment validation.
