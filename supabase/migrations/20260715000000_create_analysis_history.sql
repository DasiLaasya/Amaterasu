CREATE TABLE IF NOT EXISTS analysis_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    problem_name TEXT NOT NULL,
    code_snippet TEXT NOT NULL,
    bug_type TEXT NOT NULL,
    diagnostic_summary TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS so data is isolated per authenticated user
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own history" 
ON analysis_history FOR ALL 
USING (auth.uid() = user_id);
