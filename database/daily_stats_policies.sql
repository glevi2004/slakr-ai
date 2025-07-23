-- Enable Row Level Security on daily_stats table
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Policy for users to select their own daily stats
CREATE POLICY "Users can view their own daily stats" ON daily_stats
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own daily stats
CREATE POLICY "Users can insert their own daily stats" ON daily_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own daily stats
CREATE POLICY "Users can update their own daily stats" ON daily_stats
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own daily stats
CREATE POLICY "Users can delete their own daily stats" ON daily_stats
    FOR DELETE USING (auth.uid() = user_id);

-- Create a PostgreSQL function for atomic upsert (optional, for better performance)
CREATE OR REPLACE FUNCTION upsert_daily_stats(
    p_user_id UUID,
    p_date DATE,
    p_additional_seconds INTEGER,
    p_additional_sessions INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO daily_stats (user_id, date, total_study_time_seconds, session_count)
    VALUES (p_user_id, p_date, p_additional_seconds, p_additional_sessions)
    ON CONFLICT (user_id, date)
    DO UPDATE SET
        total_study_time_seconds = daily_stats.total_study_time_seconds + p_additional_seconds,
        session_count = daily_stats.session_count + p_additional_sessions,
        updated_at = NOW();
END;
$$;
