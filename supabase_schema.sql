-- SQL Migration for PrepWise Dynamic System

-- 1. Profiles Table (Linked to Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    current_role TEXT DEFAULT 'Software Engineer',
    profile_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Resumes Table
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    raw_text TEXT,
    ats_score INTEGER CHECK (ats_score >= 0 AND ats_score <= 100),
    missing_keywords TEXT[],
    extracted_skills JSONB,
    improvement_suggestions TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Interviews Table
CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    target_role TEXT,
    difficulty_level TEXT,
    overall_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'in-progress',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 4. Questions & Answers Table
CREATE TABLE session_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    question_content TEXT,
    category TEXT,
    difficulty TEXT,
    transcript TEXT,
    relevance_score FLOAT,
    similarity_score FLOAT,
    depth_score FLOAT,
    clarity_score FLOAT,
    weighted_score INTEGER,
    feedback_text TEXT,
    strengths TEXT[],
    weaknesses TEXT[],
    suggested_answer TEXT,
    time_taken INTEGER, -- seconds
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime for session_data
ALTER PUBLICATION supabase_realtime ADD TABLE session_data;
ALTER PUBLICATION supabase_realtime ADD TABLE interviews;

-- Security Policies (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can edit own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can manage own resumes" ON resumes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own interviews" ON interviews FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own session data" ON session_data FOR ALL USING (
    EXISTS (SELECT 1 FROM interviews WHERE interviews.id = session_data.interview_id AND interviews.user_id = auth.uid())
);
