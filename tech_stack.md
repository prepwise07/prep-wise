# PrepWise — Comprehensive Technology Stack & Algorithms

This document provides a deep dive into every technology, library, and algorithm that powers the PrepWise ecosystem.

---

## 1. Core Languages
- **TypeScript (v5+)**: Primary language for the Next.js frontend and main API routes, ensuring end-to-end type safety.
- **Python (v3.10+)**: Orchestrates the high-performance Computer Vision (CV) microservice.
- **SQL (PostgreSQL)**: Handles relational data, complex joins, and Row Level Security for secure user isolation.
- **Modern HTML5 & CSS3**: Utilizing semantic tags and advanced CSS features for a premium web experience.

## 2. Core Algorithms & Logic
### A. Adaptive Difficulty Adjustment Algorithm
- **Logic**: Dynamically scales the interview challenge based on candidate performance.
- **Trigger**: Analyzes the running average of the last 3 performance scores.
- **Thresholds**: 
    - **Increase (Easy → Medium → Hard)**: Average score ≥ 80%.
    - **Decrease (Hard → Medium → Easy)**: Average score ≤ 50%.
    - **Maintain**: Scores between 51% and 79%.

### B. Weighted Scoring Algorithm (WSA)
- **Calculation**: Computes an overall score (0-100) using a multi-factor weighted sum.
- **Weights**: 
    - **Relevance (40%)**: How accurately the answer addresses the question.
    - **Communication Clarity (25%)**: Logic, flow, and delivery speed.
    - **NLP Semantic Similarity (20%)**: Closeness to the "Gold Standard" ideal answer.
    - **Technical Depth (15%)**: Use of industry-specific terminology and advanced concepts.

### C. Computer Vision & Emotion Algorithms
- **Haar Cascade Classifiers**: Used for initial fast-pass face detection in image frames.
- **VGG-Face / Facenet**: DeepFace backends utilized for precise facial recognition and feature extraction.
- **CNN-based Emotion Models**: Convolutional Neural Networks for analyzing 7 basic human emotions (Happy, Neutral, Stress, etc.).
- **Geometric Eye-Contact Heuristic**: A centroid-based alignment calculation ensuring the candidate is centered and looking at the camera.

### D. ATS Matching & Analysis
- **Keyword Extraction Algorithm**: Parses Job Descriptions (JD) to identify mandatory technical and soft-skill keywords.
- **Term Frequency (TF) Check**: Matches extracted keywords against the resume raw text.

---

## 3. Frontend & UI Engineering
- **Next.js 16 (React 19)**: The foundational framework using the App Router and React Server Components (RSC).
- **Tailwind CSS (v4)**: Utilizing its latest JIT compiler for high-performance, utility-first styling.
- **Framer Motion**: Powering all micro-interactions, spring animations, and smooth page transitions.
- **Monaco Editor**: A feature-rich IDE engine (`@monaco-editor/react`) for code editing.
- **Recharts**: High-performance library for plotting user performance trends and skill breakdowns.

---

## 4. Backend & Infrastructure
- **Supabase Core**: 
    - **PostgreSQL**: Relational storage logic.
    - **Supabase Auth (GoTrue)**: JWT-based authentication flow.
    - **Supabase Realtime**: Live broadcast of interview events and metrics.
- **Flask (v3)**: Lightweight WSGI web application for exposing Python CV endpoints.
- **Docker**: Containerization technology for isolated code execution in the **Compiler Engine**.
- **Node.js (v18/20)**: The runtime environment for the frontend and compiler service.

---

## 5. AI & Large Language Models
- **Google Gemini Pro (1.5)**: Leading multimodal AI model for interview evaluation and counseling.
- **Groq SDK**: High-speed AI inference engine for near-instant response analysis.
- **Vapi AI**: API for handling conversational voice-to-voice logic (TTS/STT).

---

## 6. Micro-Utilities & "Small" Technologies
- **dotenv**: Secure environment configuration management.
- **lucide-react**: Lightweight and scalable vector icon library.
- **react-markdown**: For rendering rich, formatted feedback and coaching tips.
- **mammoth.js**: High-fidelity conversion of `.docx` to raw text for parsing.
- **pdf-parse**: Low-level stream parsing for PDF content extraction.
- **flask-cors**: Middleware for handling Cross-Origin Resource Sharing in the Python service.
- **clsx / tailwind-merge**: Utilities for dynamic and conflict-free CSS class management.
- **babel-plugin-react-compiler**: Optimized build-time compilation for React 19 features.
