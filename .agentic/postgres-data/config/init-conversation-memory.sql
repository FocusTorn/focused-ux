-- Conversation Memory Database Schema
-- This schema supports the MCP server conversation memory system

-- Enable UUID extension for better primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(255) PRIMARY KEY,
    conversation_name VARCHAR(255),
    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    workspace_path VARCHAR(500),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Conversation entries table
CREATE TABLE IF NOT EXISTS entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id VARCHAR(255) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    response TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    entry_type VARCHAR(50) DEFAULT 'user_ai', -- user_ai, system, error, etc.
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Topics table
CREATE TABLE IF NOT EXISTS topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id VARCHAR(255) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(conversation_id, topic)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created);
CREATE INDEX IF NOT EXISTS idx_conversations_last_updated ON conversations(last_updated);
CREATE INDEX IF NOT EXISTS idx_conversations_name ON conversations(conversation_name);
CREATE INDEX IF NOT EXISTS idx_conversations_workspace ON conversations(workspace_path);

CREATE INDEX IF NOT EXISTS idx_entries_conversation_id ON entries(conversation_id);
CREATE INDEX IF NOT EXISTS idx_entries_timestamp ON entries(timestamp);
CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(entry_type);

CREATE INDEX IF NOT EXISTS idx_topics_conversation_id ON topics(conversation_id);
CREATE INDEX IF NOT EXISTS idx_topics_topic ON topics(topic);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_entries_input_fts ON entries USING gin(to_tsvector('english', input));
CREATE INDEX IF NOT EXISTS idx_entries_response_fts ON entries USING gin(to_tsvector('english', response));

-- Triggers to automatically update last_updated
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET last_updated = NOW() 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
    AFTER INSERT OR UPDATE ON entries
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- Views for common queries
CREATE OR REPLACE VIEW conversation_summary AS
SELECT 
    c.id,
    c.conversation_name,
    c.created,
    c.last_updated,
    c.workspace_path,
    COUNT(e.id) as entry_count,
    COUNT(DISTINCT t.topic) as topic_count,
    array_agg(DISTINCT t.topic ORDER BY t.topic) as topics
FROM conversations c
LEFT JOIN entries e ON c.id = e.conversation_id
LEFT JOIN topics t ON c.id = t.conversation_id
GROUP BY c.id, c.conversation_name, c.created, c.last_updated, c.workspace_path;

-- Function to search conversations
CREATE OR REPLACE FUNCTION search_conversations(search_query TEXT)
RETURNS TABLE(
    conversation_id VARCHAR(255),
    conversation_name VARCHAR(255),
    created TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE,
    workspace_path VARCHAR(500),
    entry_count BIGINT,
    topic_count BIGINT,
    topics TEXT[],
    relevance_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.conversation_id,
        cs.conversation_name,
        cs.created,
        cs.last_updated,
        cs.workspace_path,
        cs.entry_count,
        cs.topic_count,
        cs.topics,
        (
            CASE 
                WHEN cs.conversation_name ILIKE '%' || search_query || '%' THEN 1.0
                ELSE 0.0
            END +
            CASE 
                WHEN EXISTS(
                    SELECT 1 FROM entries e 
                    WHERE e.conversation_id = cs.conversation_id 
                    AND (e.input ILIKE '%' || search_query || '%' OR e.response ILIKE '%' || search_query || '%')
                ) THEN 0.8
                ELSE 0.0
            END +
            CASE 
                WHEN EXISTS(
                    SELECT 1 FROM topics t 
                    WHERE t.conversation_id = cs.conversation_id 
                    AND t.topic ILIKE '%' || search_query || '%'
                ) THEN 0.6
                ELSE 0.0
            END
        )::REAL as relevance_score
    FROM conversation_summary cs
    WHERE 
        cs.conversation_name ILIKE '%' || search_query || '%'
        OR EXISTS(
            SELECT 1 FROM entries e 
            WHERE e.conversation_id = cs.conversation_id 
            AND (e.input ILIKE '%' || search_query || '%' OR e.response ILIKE '%' || search_query || '%')
        )
        OR EXISTS(
            SELECT 1 FROM topics t 
            WHERE t.conversation_id = cs.conversation_id 
            AND t.topic ILIKE '%' || search_query || '%'
        )
    ORDER BY relevance_score DESC, cs.last_updated DESC;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample data for testing
INSERT INTO conversations (id, conversation_name, workspace_path) 
VALUES ('sample-conversation_20250905145645', 'sample-conversation', 'D:\_dev\!Projects\_fux\_FocusedUX')
ON CONFLICT (id) DO NOTHING;

INSERT INTO entries (conversation_id, input, response, entry_type)
VALUES 
    ('sample-conversation_20250905145645', 'Hello, this is a test input', 'This is a test response', 'user_ai'),
    ('sample-conversation_20250905145645', 'Another test input', 'Another test response', 'user_ai')
ON CONFLICT DO NOTHING;

INSERT INTO topics (conversation_id, topic)
VALUES 
    ('sample-conversation_20250905145645', 'testing'),
    ('sample-conversation_20250905145645', 'postgresql'),
    ('sample-conversation_20250905145645', 'conversation-memory')
ON CONFLICT (conversation_id, topic) DO NOTHING;
