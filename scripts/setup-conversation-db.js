#!/usr/bin/env node

/**
 * Setup SQLite Database for Conversation Memory System
 * 
 * This script creates the SQLite database schema for the conversation memory system.
 * It runs independently of the main conversation memory protocol to avoid dependency issues.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the database directory if it doesn't exist
const dbDir = path.join(__dirname, '..', '.cursor', 'conversation-memories');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// SQL schema for the conversation memory database
const schema = `
-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT
);

-- Entries table for individual conversation exchanges
CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT,
    input TEXT,
    response TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

-- Topics table for conversation topic tracking
CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT,
    topic TEXT,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_entries_conversation_id ON entries(conversation_id);
CREATE INDEX IF NOT EXISTS idx_topics_conversation_id ON topics(conversation_id);
CREATE INDEX IF NOT EXISTS idx_topics_topic ON topics(topic);
CREATE INDEX IF NOT EXISTS idx_entries_timestamp ON entries(timestamp);
`;

// Create a simple SQLite database file with schema
const dbPath = path.join(dbDir, 'conversation_memory.db');

try {
    // Write the schema to a SQL file for reference
    const schemaPath = path.join(dbDir, 'schema.sql');
    fs.writeFileSync(schemaPath, schema);
    
    console.log('✅ Conversation memory database schema created');
    console.log(`📁 Database directory: ${dbDir}`);
    console.log(`📄 Schema file: ${schemaPath}`);
    console.log(`🗄️  Database file: ${dbPath}`);
    console.log('');
    console.log('To initialize the database, run:');
    console.log(`sqlite3 "${dbPath}" < "${schemaPath}"`);
    
} catch (error) {
    console.error('❌ Error creating conversation memory database:', error.message);
    process.exit(1);
}
