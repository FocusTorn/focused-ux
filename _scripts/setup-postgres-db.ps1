# PostgreSQL Database Setup Script for Agentic Conversation Memory
# This script sets up the conversation_memory database and user

param(
    [string]$PostgresPassword = "postgres",
    [string]$AgenticPassword = "agentic_dev_password"
)

Write-Host "Setting up PostgreSQL database for Agentic conversation memory..." -ForegroundColor Green

# PostgreSQL installation path
$PostgresPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"

# Check if PostgreSQL is installed
if (-not (Test-Path $PostgresPath)) {
    Write-Error "PostgreSQL not found at $PostgresPath. Please install PostgreSQL first."
    exit 1
}

Write-Host "PostgreSQL found at: $PostgresPath" -ForegroundColor Yellow

# Set password environment variable for psql
$env:PGPASSWORD = $PostgresPassword

try {
    Write-Host "Creating conversation_memory database..." -ForegroundColor Yellow
    & $PostgresPath -U postgres -c "CREATE DATABASE conversation_memory;" 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database 'conversation_memory' created successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Database may already exist (this is OK)" -ForegroundColor Yellow
    }

    Write-Host "Creating agentic user..." -ForegroundColor Yellow
    & $PostgresPath -U postgres -c "CREATE USER agentic WITH PASSWORD '$AgenticPassword';" 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ User 'agentic' created successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️ User may already exist (this is OK)" -ForegroundColor Yellow
    }

    Write-Host "Granting permissions to agentic user..." -ForegroundColor Yellow
    & $PostgresPath -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE conversation_memory TO agentic;" 2>$null
    & $PostgresPath -U postgres -c "ALTER USER agentic CREATEDB;" 2>$null
    & $PostgresPath -U postgres -c "GRANT ALL ON SCHEMA public TO agentic;" 2>$null
    & $PostgresPath -U postgres -c "GRANT CREATE ON SCHEMA public TO agentic;" 2>$null
    
    Write-Host "✅ Permissions granted successfully" -ForegroundColor Green

    Write-Host "Setting up database schema..." -ForegroundColor Yellow
    
    # Read and execute the schema file
    $SchemaFile = ".agentic/postgres-data/config/init-conversation-memory.sql"
    if (Test-Path $SchemaFile) {
        & $PostgresPath -U agentic -d conversation_memory -f $SchemaFile
        Write-Host "✅ Database schema initialized successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Schema file not found at $SchemaFile" -ForegroundColor Yellow
        Write-Host "Creating basic tables..." -ForegroundColor Yellow
        
        # Create basic tables if schema file doesn't exist
        $BasicSchema = @"
-- Basic conversation memory schema
CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(255) PRIMARY KEY,
    conversation_name VARCHAR(255),
    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    workspace_path VARCHAR(500),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS entries (
    id SERIAL PRIMARY KEY,
    conversation_id VARCHAR(255) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    response TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    entry_type VARCHAR(50) DEFAULT 'user_ai',
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS topics (
    id SERIAL PRIMARY KEY,
    conversation_id VARCHAR(255) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(conversation_id, topic)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created);
CREATE INDEX IF NOT EXISTS idx_conversations_last_updated ON conversations(last_updated);
CREATE INDEX IF NOT EXISTS idx_entries_conversation_id ON entries(conversation_id);
CREATE INDEX IF NOT EXISTS idx_entries_timestamp ON entries(timestamp);
CREATE INDEX IF NOT EXISTS idx_topics_conversation_id ON topics(conversation_id);
"@
        
        $BasicSchema | & $PostgresPath -U agentic -d conversation_memory
        Write-Host "✅ Basic database schema created successfully" -ForegroundColor Green
    }

    Write-Host "`n🎉 PostgreSQL setup completed successfully!" -ForegroundColor Green
    Write-Host "Database: conversation_memory" -ForegroundColor Cyan
    Write-Host "User: agentic" -ForegroundColor Cyan
    Write-Host "Password: $AgenticPassword" -ForegroundColor Cyan
    Write-Host "Host: localhost" -ForegroundColor Cyan
    Write-Host "Port: 5432" -ForegroundColor Cyan
    
    Write-Host "`n📝 Connection string:" -ForegroundColor Yellow
    Write-Host "postgresql://agentic:$AgenticPassword@localhost:5432/conversation_memory" -ForegroundColor White

} catch {
    Write-Error "Failed to set up PostgreSQL database: $($_.Exception.Message)"
    exit 1
} finally {
    # Clear password from environment
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host "`n✅ Setup complete! You can now test the connection with:" -ForegroundColor Green
Write-Host "node scripts/test-postgres-memory.js" -ForegroundColor White
