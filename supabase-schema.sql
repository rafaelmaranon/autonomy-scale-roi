-- Supabase Schema for Autonomy Scale ROI
-- Run these commands in your Supabase SQL editor

-- Analytics Events Table
CREATE TABLE analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL,
    anon_user_id UUID NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    payload JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_anon_user_id ON analytics_events(anon_user_id);
CREATE INDEX idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

-- AI Logs Table
CREATE TABLE ai_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    response TEXT NOT NULL,
    latency_ms INTEGER NOT NULL,
    model VARCHAR(100) NOT NULL DEFAULT 'gpt-4',
    success BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for AI logs
CREATE INDEX idx_ai_logs_created_at ON ai_logs(created_at);
CREATE INDEX idx_ai_logs_model ON ai_logs(model);
CREATE INDEX idx_ai_logs_success ON ai_logs(success);

-- Enable Row Level Security (RLS)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics_events (allow all operations for now)
CREATE POLICY "Allow all operations on analytics_events" ON analytics_events
    FOR ALL USING (true);

-- Create policies for ai_logs (allow all operations for now)
CREATE POLICY "Allow all operations on ai_logs" ON ai_logs
    FOR ALL USING (true);
