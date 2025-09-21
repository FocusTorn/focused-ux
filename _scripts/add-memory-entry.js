#!/usr/bin/env node

/**
 * Streamlined Memory Entry Script
 * Usage: node scripts/add-memory-entry.js "conversationId" "userInput" "aiResponse" "topics"
 * Topics: comma-separated string (e.g., "topic1,topic2,topic3")
 */

import ConversationMemoryPostgreSQLOnly from './conversation-memory-postgres-only.js';

async function addMemoryEntry() {
    const args = process.argv.slice(2);
    
    if (args.length < 4) {
        console.log('❌ Usage: node scripts/add-memory-entry.js "conversationId" "userInput" "aiResponse" "topics"');
        console.log('   Topics: comma-separated string (e.g., "topic1,topic2,topic3")');
        process.exit(1);
    }

    const [conversationId, userInput, aiResponse, topicsString] = args;
    const topics = topicsString ? topicsString.split(',').map(t => t.trim()) : [];

    try {
        const memory = new ConversationMemoryPostgreSQLOnly();
        await memory.initialize();
        
        const result = await memory.addEntry(conversationId, userInput, aiResponse, 'user_ai', {});
        
        if (topics.length > 0) {
            await memory.addTopics(conversationId, topics);
        }
        
        await memory.close();
        
        // Format the status message according to .cursorrules format
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        console.log(`✅ [${timestamp}] Added to: ${conversationId}`);
    } catch (error) {
        console.log(`❌ Memory update failed: ${error.message}`);
        process.exit(1);
    }
}

addMemoryEntry();