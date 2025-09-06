import ConversationMemoryPostgreSQL from './conversation-memory-postgres.js';

class ConversationMemoryPostgreSQLOnly {
    constructor() {
        this.postgres = new ConversationMemoryPostgreSQL();
    }

    async initialize() {
        await this.postgres.initialize();
    }

    async addConversation(conversationId, conversationName, workspacePath, metadata) {
        return await this.postgres.addConversation(conversationId, conversationName, workspacePath, metadata);
    }

    async addEntry(conversationId, input, response, entryType, metadata) {
        return await this.postgres.addEntry(conversationId, input, response, entryType, metadata);
    }

    async addTopics(conversationId, topics) {
        return await this.postgres.addTopics(conversationId, topics);
    }

    async getConversation(conversationId) {
        return await this.postgres.getConversation(conversationId);
    }

    async searchConversations(query) {
        return await this.postgres.searchConversations(query);
    }

    async getConversationStats() {
        return await this.postgres.getConversationStats();
    }

    async renameConversation(oldId, newId, newName) {
        return await this.postgres.renameConversation(oldId, newId, newName);
    }

    async close() {
        await this.postgres.close();
    }
}

export default ConversationMemoryPostgreSQLOnly;
