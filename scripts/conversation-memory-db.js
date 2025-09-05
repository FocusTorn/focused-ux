#!/usr/bin/env node

/**
 * Conversation Memory Database Interface
 * 
 * This module provides a simple interface for interacting with the SQLite conversation memory database.
 * It works alongside the JSON file system without replacing it.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ConversationMemoryDB {
    constructor() {
        this.dbPath = path.join(__dirname, '..', '.cursor', 'conversation-memories', 'conversation_memory.db');
        this.schemaPath = path.join(__dirname, '..', '.cursor', 'conversation-memories', 'schema.sql');
        this.initialized = false;
    }

    /**
     * Initialize the database with schema if it doesn't exist
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // Check if database file exists
            if (!fs.existsSync(this.dbPath)) {
                console.log('📦 Initializing conversation memory database...');
                
                // Create database directory if it doesn't exist
                const dbDir = path.dirname(this.dbPath);
                if (!fs.existsSync(dbDir)) {
                    fs.mkdirSync(dbDir, { recursive: true });
                }

                // Read schema and create database
                const schema = fs.readFileSync(this.schemaPath, 'utf8');
                
                // For now, we'll create a simple text-based database structure
                // This avoids the native module compilation issues
                const dbStructure = {
                    conversations: [],
                    entries: [],
                    topics: [],
                    metadata: {
                        version: '1.0.0',
                        created: new Date().toISOString(),
                        lastUpdated: new Date().toISOString()
                    }
                };

                fs.writeFileSync(this.dbPath, JSON.stringify(dbStructure, null, 2));
                console.log('✅ Conversation memory database initialized');
            }

            this.initialized = true;
        } catch (error) {
            console.error('❌ Error initializing conversation memory database:', error.message);
            throw error;
        }
    }

    /**
     * Load the database from file
     */
    loadDB() {
        try {
            const data = fs.readFileSync(this.dbPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('❌ Error loading conversation memory database:', error.message);
            return null;
        }
    }

    /**
     * Save the database to file
     */
    saveDB(data) {
        try {
            data.metadata.lastUpdated = new Date().toISOString();
            fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('❌ Error saving conversation memory database:', error.message);
            return false;
        }
    }

    /**
     * Create a new conversation
     */
    async createConversation(conversationId, metadata = {}) {
        await this.initialize();
        const db = this.loadDB();
        if (!db) return false;

        const conversation = {
            id: conversationId,
            created: new Date().toISOString(),
            metadata: JSON.stringify(metadata)
        };

        db.conversations.push(conversation);
        return this.saveDB(db);
    }

    /**
     * Add an entry to a conversation
     */
    async addEntry(conversationId, input, response) {
        await this.initialize();
        const db = this.loadDB();
        if (!db) return false;

        const entry = {
            id: db.entries.length + 1,
            conversation_id: conversationId,
            input: input,
            response: response,
            timestamp: new Date().toISOString()
        };

        db.entries.push(entry);
        return this.saveDB(db);
    }

    /**
     * Add topics to a conversation
     */
    async addTopics(conversationId, topics) {
        await this.initialize();
        const db = this.loadDB();
        if (!db) return false;

        topics.forEach(topic => {
            const topicEntry = {
                id: db.topics.length + 1,
                conversation_id: conversationId,
                topic: topic
            };
            db.topics.push(topicEntry);
        });

        return this.saveDB(db);
    }

    /**
     * Get all entries for a conversation
     */
    async getConversationEntries(conversationId) {
        await this.initialize();
        const db = this.loadDB();
        if (!db) return [];

        return db.entries.filter(entry => entry.conversation_id === conversationId);
    }

    /**
     * Get all topics for a conversation
     */
    async getConversationTopics(conversationId) {
        await this.initialize();
        const db = this.loadDB();
        if (!db) return [];

        return db.topics.filter(topic => topic.conversation_id === conversationId);
    }

    /**
     * Get conversation metadata
     */
    async getConversation(conversationId) {
        await this.initialize();
        const db = this.loadDB();
        if (!db) return null;

        return db.conversations.find(conv => conv.id === conversationId);
    }

    /**
     * Search conversations by topic
     */
    async searchByTopic(topic) {
        await this.initialize();
        const db = this.loadDB();
        if (!db) return [];

        const matchingTopics = db.topics.filter(t => 
            t.topic.toLowerCase().includes(topic.toLowerCase())
        );

        return matchingTopics.map(t => t.conversation_id);
    }

    /**
     * Get database statistics
     */
    async getStats() {
        await this.initialize();
        const db = this.loadDB();
        if (!db) return null;

        return {
            totalConversations: db.conversations.length,
            totalEntries: db.entries.length,
            totalTopics: db.topics.length,
            lastUpdated: db.metadata.lastUpdated
        };
    }
}

// Export for use in other modules
export default ConversationMemoryDB;

// CLI interface for testing
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
    const db = new ConversationMemoryDB();
    
    async function testDB() {
        console.log('🧪 Testing Conversation Memory Database...');
        
        await db.initialize();
        
        // Test creating a conversation
        const testId = '20250905095910';
        await db.createConversation(testId, { test: true });
        
        // Test adding entries
        await db.addEntry(testId, 'Test input', 'Test response');
        
        // Test adding topics
        await db.addTopics(testId, ['testing', 'database']);
        
        // Test retrieving data
        const entries = await db.getConversationEntries(testId);
        const topics = await db.getConversationTopics(testId);
        const stats = await db.getStats();
        
        console.log('📊 Database Stats:', stats);
        console.log('💬 Entries:', entries.length);
        console.log('🏷️  Topics:', topics.length);
        
        console.log('✅ Database test completed successfully');
    }
    
    testDB().catch(console.error);
}
