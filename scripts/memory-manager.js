import ConversationMemoryPostgreSQLOnly from './conversation-memory-postgres-only.js';

class MemoryManager {
    constructor() {
        this.memory = new ConversationMemoryPostgreSQLOnly();
        this.conversationId = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (!this.isInitialized) {
            await this.memory.initialize();
            this.isInitialized = true;
        }
    }

    async createConversation(userInput, conversationName = null) {
        await this.initialize();
        
        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
        const workspacePath = 'D:\\_dev\\!Projects\\_fux\\_FocusedUX';
        const metadata = { source: 'cursorrules', version: 'postgresql-only' };
        
        await this.memory.addConversation(timestamp, conversationName, workspacePath, metadata);
        this.conversationId = timestamp;
        
        return `✅ Created conversation ${timestamp}${conversationName ? ` (${conversationName})` : ''}`;
    }

    async addEntry(userInput, aiResponse, topics = []) {
        await this.initialize();
        
        if (!this.conversationId) {
            return `❌ No active conversation - cannot add entry`;
        }
        
        const metadata = {
            timestamp: new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14),
            source: 'cursorrules-automatic',
            version: 'postgresql-only'
        };
        
        await this.memory.addEntry(this.conversationId, userInput, aiResponse, 'user_ai', metadata);
        
        if (topics.length > 0) {
            await this.memory.addTopics(this.conversationId, topics);
        }
        
        return `✅ Memory entry added to conversation ${this.conversationId} (${metadata.timestamp})`;
    }

    async renameConversation(newName) {
        await this.initialize();
        
        if (!this.conversationId) {
            return `❌ No active conversation to rename`;
        }
        
        const newId = `${newName}_${this.conversationId}`;
        await this.memory.renameConversation(this.conversationId, newId, newName);
        this.conversationId = newId;
        
        return `✅ Conversation renamed to ${newName} (${newId})`;
    }

    async close() {
        if (this.isInitialized) {
            await this.memory.close();
            this.isInitialized = false;
        }
    }
}

export default MemoryManager;
