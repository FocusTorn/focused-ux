import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

class ConversationMemoryPostgreSQL {
    constructor(config = {}) {
        this.config = {
            host: config.host || 'localhost',
            port: config.port || 5432,
            database: config.database || 'conversation_memory',
            user: config.user || 'agentic',
            password: config.password || 'agentic_dev_password',
            ...config
        };
        this.pool = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            this.pool = new Pool(this.config);
            
            // Test connection and create tables if they don't exist
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            
            // Create tables if they don't exist
            await this.createTables(client);
            
            client.release();
            
            this.initialized = true;
            console.log('PostgreSQL conversation memory initialized successfully');
        } catch (error) {
            console.error('Failed to initialize PostgreSQL conversation memory:', error);
            throw error;
        }
    }

    async createTables(client) {
        const createConversationsTable = `
            CREATE TABLE IF NOT EXISTS conversations (
                id VARCHAR(255) PRIMARY KEY,
                conversation_name VARCHAR(255),
                created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                workspace_path VARCHAR(500),
                metadata JSONB DEFAULT '{}'::jsonb
            )
        `;

        const createEntriesTable = `
            CREATE TABLE IF NOT EXISTS entries (
                id SERIAL PRIMARY KEY,
                conversation_id VARCHAR(255) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
                input TEXT NOT NULL,
                response TEXT NOT NULL,
                timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                entry_type VARCHAR(50) DEFAULT 'user_ai',
                metadata JSONB DEFAULT '{}'::jsonb
            )
        `;

        const createTopicsTable = `
            CREATE TABLE IF NOT EXISTS topics (
                id SERIAL PRIMARY KEY,
                conversation_id VARCHAR(255) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
                topic VARCHAR(255) NOT NULL,
                created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                UNIQUE(conversation_id, topic)
            )
        `;

        // Create indexes
        const createIndexes = `
            CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created);
            CREATE INDEX IF NOT EXISTS idx_conversations_last_updated ON conversations(last_updated);
            CREATE INDEX IF NOT EXISTS idx_entries_conversation_id ON entries(conversation_id);
            CREATE INDEX IF NOT EXISTS idx_entries_timestamp ON entries(timestamp);
            CREATE INDEX IF NOT EXISTS idx_topics_conversation_id ON topics(conversation_id);
        `;

        await client.query(createConversationsTable);
        await client.query(createEntriesTable);
        await client.query(createTopicsTable);
        await client.query(createIndexes);
        
        // Create views
        await this.createViews(client);
    }

    async createViews(client) {
        const createConversationSummaryView = `
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
            GROUP BY c.id, c.conversation_name, c.created, c.last_updated, c.workspace_path
        `;

        await client.query(createConversationSummaryView);
    }

    async addConversation(conversationId, conversationName = null, workspacePath = null, metadata = {}) {
        await this.initialize();
        
        const query = `
            INSERT INTO conversations (id, conversation_name, workspace_path, metadata)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO UPDATE SET
                conversation_name = EXCLUDED.conversation_name,
                workspace_path = EXCLUDED.workspace_path,
                metadata = EXCLUDED.metadata,
                last_updated = NOW()
            RETURNING *
        `;
        
        const result = await this.pool.query(query, [
            conversationId, 
            conversationName, 
            workspacePath, 
            JSON.stringify(metadata)
        ]);
        
        return result.rows[0];
    }

    async addEntry(conversationId, input, response, entryType = 'user_ai', metadata = {}) {
        await this.initialize();
        
        const query = `
            INSERT INTO entries (conversation_id, input, response, entry_type, metadata)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        
        const result = await this.pool.query(query, [
            conversationId, 
            input, 
            response, 
            entryType, 
            JSON.stringify(metadata)
        ]);
        
        return result.rows[0];
    }

    async addTopics(conversationId, topics) {
        await this.initialize();
        
        if (!topics || topics.length === 0) return;
        
        // Remove existing topics for this conversation
        await this.pool.query('DELETE FROM topics WHERE conversation_id = $1', [conversationId]);
        
        // Add new topics
        const values = topics.map(topic => `('${conversationId}', '${topic}')`).join(', ');
        const query = `
            INSERT INTO topics (conversation_id, topic)
            VALUES ${values}
            ON CONFLICT (conversation_id, topic) DO NOTHING
        `;
        
        await this.pool.query(query);
    }

    async getConversation(conversationId) {
        await this.initialize();
        
        const conversationQuery = `
            SELECT * FROM conversations WHERE id = $1
        `;
        const conversationResult = await this.pool.query(conversationQuery, [conversationId]);
        
        if (conversationResult.rows.length === 0) return null;
        
        const conversation = conversationResult.rows[0];
        
        const entriesQuery = `
            SELECT * FROM entries 
            WHERE conversation_id = $1 
            ORDER BY timestamp ASC
        `;
        const entriesResult = await this.pool.query(entriesQuery, [conversationId]);
        
        const topicsQuery = `
            SELECT topic FROM topics 
            WHERE conversation_id = $1 
            ORDER BY topic
        `;
        const topicsResult = await this.pool.query(topicsQuery, [conversationId]);
        
        return {
            conversationId: conversation.id,
            conversationName: conversation.conversation_name,
            workspacePath: conversation.workspace_path,
            created: conversation.created,
            lastUpdated: conversation.last_updated,
            metadata: conversation.metadata,
            topics: topicsResult.rows.map(row => row.topic),
            entries: entriesResult.rows.map(entry => ({
                id: entry.id,
                input: entry.input,
                response: entry.response,
                timestamp: entry.timestamp,
                entryType: entry.entry_type,
                metadata: entry.metadata
            }))
        };
    }

    async getAllConversations(limit = 100, offset = 0) {
        await this.initialize();
        
        const query = `
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
            GROUP BY c.id, c.conversation_name, c.created, c.last_updated, c.workspace_path
            ORDER BY c.last_updated DESC 
            LIMIT $1 OFFSET $2
        `;
        
        const result = await this.pool.query(query, [limit, offset]);
        return result.rows;
    }

    async searchConversations(query, limit = 50) {
        await this.initialize();
        
        const searchQuery = `
            SELECT 
                c.id,
                c.conversation_name,
                c.created,
                c.last_updated,
                c.workspace_path,
                COUNT(e.id) as entry_count,
                COUNT(DISTINCT t.topic) as topic_count,
                array_agg(DISTINCT t.topic ORDER BY t.topic) as topics,
                (
                    CASE 
                        WHEN c.conversation_name ILIKE $1 THEN 1.0
                        ELSE 0.0
                    END +
                    CASE 
                        WHEN EXISTS(
                            SELECT 1 FROM entries e 
                            WHERE e.conversation_id = c.id 
                            AND (e.input ILIKE $1 OR e.response ILIKE $1)
                        ) THEN 0.8
                        ELSE 0.0
                    END +
                    CASE 
                        WHEN EXISTS(
                            SELECT 1 FROM topics t 
                            WHERE t.conversation_id = c.id 
                            AND t.topic ILIKE $1
                        ) THEN 0.6
                        ELSE 0.0
                    END
                )::REAL as relevance_score
            FROM conversations c
            LEFT JOIN entries e ON c.id = e.conversation_id
            LEFT JOIN topics t ON c.id = t.conversation_id
            WHERE 
                c.conversation_name ILIKE $1
                OR EXISTS(
                    SELECT 1 FROM entries e 
                    WHERE e.conversation_id = c.id 
                    AND (e.input ILIKE $1 OR e.response ILIKE $1)
                )
                OR EXISTS(
                    SELECT 1 FROM topics t 
                    WHERE t.conversation_id = c.id 
                    AND t.topic ILIKE $1
                )
            GROUP BY c.id, c.conversation_name, c.created, c.last_updated, c.workspace_path
            ORDER BY relevance_score DESC, c.last_updated DESC
            LIMIT $2
        `;
        
        const searchTerm = `%${query}%`;
        const result = await this.pool.query(searchQuery, [searchTerm, limit]);
        return result.rows;
    }

    async renameConversation(oldId, newId, newName = null) {
        await this.initialize();
        
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Get the existing conversation data
            const getConversationQuery = `
                SELECT * FROM conversations WHERE id = $1
            `;
            const conversationResult = await client.query(getConversationQuery, [oldId]);
            
            if (conversationResult.rows.length === 0) {
                throw new Error(`Conversation ${oldId} not found`);
            }
            
            const conversation = conversationResult.rows[0];
            
            // Create new conversation with new ID
            const createConversationQuery = `
                INSERT INTO conversations (id, conversation_name, created, last_updated, workspace_path, metadata)
                VALUES ($1, $2, $3, NOW(), $4, $5)
            `;
            await client.query(createConversationQuery, [
                newId,
                newName || conversation.conversation_name,
                conversation.created,
                conversation.workspace_path,
                conversation.metadata
            ]);
            
            // Update entries to point to new conversation ID
            const updateEntriesQuery = `
                UPDATE entries SET conversation_id = $1 WHERE conversation_id = $2
            `;
            await client.query(updateEntriesQuery, [newId, oldId]);
            
            // Update topics to point to new conversation ID
            const updateTopicsQuery = `
                UPDATE topics SET conversation_id = $1 WHERE conversation_id = $2
            `;
            await client.query(updateTopicsQuery, [newId, oldId]);
            
            // Delete old conversation
            const deleteConversationQuery = `
                DELETE FROM conversations WHERE id = $1
            `;
            await client.query(deleteConversationQuery, [oldId]);
            
            await client.query('COMMIT');
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getConversationStats() {
        await this.initialize();
        
        const statsQuery = `
            SELECT 
                COUNT(*) as total_conversations,
                COUNT(DISTINCT workspace_path) as unique_workspaces,
                SUM(entry_count) as total_entries,
                AVG(entry_count) as avg_entries_per_conversation,
                MAX(last_updated) as most_recent_activity
            FROM conversation_summary
        `;
        
        const result = await this.pool.query(statsQuery);
        return result.rows[0];
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
        }
        this.initialized = false;
    }
}

export default ConversationMemoryPostgreSQL;
