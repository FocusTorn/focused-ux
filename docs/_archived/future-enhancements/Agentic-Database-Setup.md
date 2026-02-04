# Agentic Database Setup Guide

This guide explains how to set up the PostgreSQL database for the Agentic conversation memory system.

## Overview

The Agentic system uses PostgreSQL as the primary database for storing conversation memory, providing:

- **ACID Transactions**: Full data integrity guarantees
- **Advanced Features**: JSON columns, full-text search, indexing, views
- **Performance**: Native database engine with excellent query optimization
- **Scalability**: Handles large datasets efficiently
- **Reliability**: Battle-tested in production environments

## Directory Structure

```
D:\_dev\.agentic\
├── conversation-memories\     # Legacy JSON files (migrated from .cursor)
├── postgres-data\           # PostgreSQL data directory
│   ├── data\               # Database files
│   ├── logs\               # Database logs
│   └── config\             # Configuration files
└── mcp-server\             # Future MCP server location
```

## Prerequisites

1. **Docker Desktop**: Install Docker Desktop for Windows
2. **Docker Compose**: Usually included with Docker Desktop

## Setup Steps

### 1. Start PostgreSQL Database

```bash
# Start the PostgreSQL container
docker-compose -f docker-compose.agentic.yml up -d

# Check if the container is running
docker-compose -f docker-compose.agentic.yml ps
```

### 2. Verify Database Connection

```bash
# Test the PostgreSQL connection
node scripts/test-postgres-memory.js
```

### 3. Database Configuration

**Connection Details:**

- Host: `localhost`
- Port: `5432`
- Database: `conversation_memory`
- Username: `agentic`
- Password: `agentic_dev_password`

**Data Location:**

- Database files: `.agentic/postgres-data/data/`
- Logs: `.agentic/postgres-data/logs/`
- Configuration: `.agentic/postgres-data/config/`

## Database Schema

The conversation memory database includes:

### Tables

- **conversations**: Main conversation records
- **entries**: Individual conversation entries (input/response pairs)
- **topics**: Conversation topics for categorization

### Features

- **UUID Primary Keys**: Better performance and uniqueness
- **Full-Text Search**: Built-in search across conversation content
- **JSON Metadata**: Flexible metadata storage
- **Automatic Timestamps**: Last updated tracking
- **Foreign Key Constraints**: Data integrity
- **Indexes**: Optimized for common queries

### Views

- **conversation_summary**: Aggregated conversation data
- **search_conversations()**: Function for advanced search

## Usage Examples

### Basic Operations

```javascript
import ConversationMemoryPostgreSQL from './scripts/conversation-memory-postgres.js'

const memory = new ConversationMemoryPostgreSQL()

// Add a conversation
await memory.addConversation('conversation-id', 'conversation-name', 'workspace-path', {
    metadata: 'value',
})

// Add entries
await memory.addEntry('conversation-id', 'user input', 'AI response', 'user_ai', {
    metadata: 'value',
})

// Add topics
await memory.addTopics('conversation-id', ['topic1', 'topic2'])

// Retrieve conversation
const conversation = await memory.getConversation('conversation-id')

// Search conversations
const results = await memory.searchConversations('search query')

// Get statistics
const stats = await memory.getConversationStats()
```

### Advanced Queries

```sql
-- Search conversations with relevance scoring
SELECT * FROM search_conversations('postgresql');

-- Get conversation summary
SELECT * FROM conversation_summary ORDER BY last_updated DESC;

-- Full-text search in entries
SELECT * FROM entries
WHERE to_tsvector('english', input || ' ' || response)
@@ plainto_tsquery('english', 'search terms');
```

## Migration from JSON Files

The system maintains backward compatibility with existing JSON conversation files while providing the new PostgreSQL backend. Migration can be done gradually:

1. **Parallel Operation**: Both JSON and PostgreSQL systems can run simultaneously
2. **Gradual Migration**: Move conversations to PostgreSQL as needed
3. **Data Integrity**: PostgreSQL provides better data validation and constraints

## Maintenance

### Backup

```bash
# Create database backup
docker exec agentic-postgres pg_dump -U agentic conversation_memory > backup.sql

# Restore from backup
docker exec -i agentic-postgres psql -U agentic conversation_memory < backup.sql
```

### Monitoring

```bash
# View database logs
docker-compose -f docker-compose.agentic.yml logs postgres

# Check database size
docker exec agentic-postgres psql -U agentic -d conversation_memory -c "SELECT pg_size_pretty(pg_database_size('conversation_memory'));"
```

### Performance Tuning

- **Indexes**: Automatically created for common queries
- **Connection Pooling**: Built into the Node.js client
- **Query Optimization**: PostgreSQL's query planner optimizes automatically

## Troubleshooting

### Common Issues

1. **Docker Not Running**

    ```bash
    # Start Docker Desktop
    # Then run: docker-compose -f docker-compose.agentic.yml up -d
    ```

2. **Port Already in Use**

    ```bash
    # Change port in docker-compose.agentic.yml
    # Or stop conflicting service
    ```

3. **Permission Issues**
    ```bash
    # Ensure .agentic directory has proper permissions
    # On Windows, run PowerShell as Administrator if needed
    ```

### Health Checks

```bash
# Check if PostgreSQL is healthy
docker-compose -f docker-compose.agentic.yml ps

# Test connection
node scripts/test-postgres-memory.js
```

## Future Enhancements

- **Replication**: Master-slave setup for high availability
- **Clustering**: Multiple database nodes for scalability
- **Cloud Integration**: AWS RDS, Google Cloud SQL, Azure Database
- **Monitoring**: Prometheus metrics, Grafana dashboards
- **Automated Backups**: Scheduled backup and restore procedures

## Security Considerations

- **Password Management**: Use environment variables for production
- **Network Security**: Restrict database access to authorized applications
- **Data Encryption**: Enable SSL/TLS for database connections
- **Access Control**: Implement proper user roles and permissions

## Production Deployment

For production deployment:

1. **Change Default Passwords**: Use strong, unique passwords
2. **Enable SSL**: Configure SSL/TLS for database connections
3. **Set Resource Limits**: Configure memory and CPU limits
4. **Implement Monitoring**: Set up alerts and monitoring
5. **Regular Backups**: Implement automated backup procedures
6. **Security Hardening**: Follow PostgreSQL security best practices
