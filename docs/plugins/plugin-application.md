# Plugin Applications

## Overview

Plugin applications are Nx plugins that provide **standalone application capabilities** - they run as independent processes or services. They're the "runners" in the Nx ecosystem, distinct from executors which run within Nx's task system.

## Characteristics

- **Standalone Execution**: Run independently of Nx's task system
- **Process-Based**: Operate as separate processes or services
- **External Integration**: Connect with external systems or APIs
- **Long-Running**: Can run continuously (servers, daemons, etc.)
- **Protocol-Based**: Often communicate via stdio, HTTP, or other protocols

## Examples in FocusedUX

- **`@fux/mcp-docs`** - MCP (Model Context Protocol) server for documentation
- **Development Servers** - Hot reload servers, proxy servers
- **API Servers** - REST APIs, GraphQL servers
- **Background Services** - File watchers, notification services
- **External Integrations** - Database connections, third-party APIs

## Application Structure

```
plugins/{application-name}/
├── src/
│   ├── index.ts                           # Main application entry point
│   ├── server.ts                          # Server implementation
│   ├── handlers/                          # Request/event handlers
│   ├── services/                          # Business logic services
│   └── types/                             # Type definitions
├── project.json                           # Plugin configuration
├── package.json                           # Dependencies and scripts
└── README.md                              # Usage documentation
```

## Application Implementation Pattern

```typescript
// src/index.ts
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { ApplicationService } from './services/application.service.js'

class ApplicationServer {
    private server: Server
    private service: ApplicationService

    constructor() {
        this.server = new Server(
            {
                name: 'application-name',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        )

        this.service = new ApplicationService()
        this.setupHandlers()
    }

    private setupHandlers() {
        // Set up request handlers
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: await this.service.getAvailableTools(),
            }
        })

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            return await this.service.handleToolCall(request.params)
        })
    }

    async run() {
        const transport = new StdioServerTransport()
        await this.server.connect(transport)
        console.error('Application server running')
    }
}

// Start the application
const app = new ApplicationServer()
app.run().catch(console.error)
```

## Generation Commands

### Generate New Plugin Application

```bash
# Generate new plugin for application
npx nx g @nx/plugin:plugin plugins/{application-name} \
  --directory=plugins \
  --importPath=@fux/{application-name} \
  --linter=none \
  --unitTestRunner=none \
  --useProjectJson=true \
  --tags=application,{relevant-tags}

# Example: Generate MCP documentation server
npx nx g @nx/plugin:plugin plugins/mcp-docs \
  --directory=plugins \
  --importPath=@fux/mcp-docs \
  --linter=none \
  --unitTestRunner=none \
  --useProjectJson=true \
  --tags=application,mcp,documentation
```

### Manual Application Setup

Since applications don't use the standard generator/executor pattern, you'll need to manually:

1. **Create the application structure** (see Application Structure above)
2. **Update project.json** to set `projectType: "application"`
3. **Add application-specific targets** (build, start, etc.)
4. **Implement the application logic** in `src/index.ts`

## Configuration

### project.json

```json
{
    "name": "@fux/{application-name}",
    "projectType": "application",
    "targets": {
        "build": {
            "executor": "@nx/esbuild:esbuild",
            "options": {
                "main": "plugins/src/index.ts",
                "outputPath": "plugins/dist",
                "format": ["esm"],
                "bundle": true,
                "external": ["vscode"],
                "sourcemap": true
            }
        },
        "start": {
            "executor": "nx:run-commands",
            "options": {
                "command": "node plugins/dist/index.js",
                "cwd": "."
            }
        }
    }
}
```

### package.json

```json
{
    "name": "@fux/{application-name}",
    "version": "1.0.0",
    "type": "module",
    "main": "./dist/index.js",
    "bin": {
        "{application-name}": "./dist/index.js"
    },
    "scripts": {
        "start": "nx start {application-name}",
        "build": "nx build {application-name}"
    },
    "dependencies": {
        "@modelcontextprotocol/sdk": "^1.0.0"
    }
}
```

## Common Application Types

### MCP Servers

- **Purpose**: Provide tools to AI assistants via Model Context Protocol
- **Communication**: stdio transport
- **Examples**: Documentation servers, code analysis servers

### Development Servers

- **Purpose**: Provide development-time services
- **Communication**: HTTP/WebSocket
- **Examples**: Hot reload servers, proxy servers

### API Servers

- **Purpose**: Provide REST or GraphQL APIs
- **Communication**: HTTP
- **Examples**: Backend services, microservices

### Background Services

- **Purpose**: Run continuous background tasks
- **Communication**: File system, databases
- **Examples**: File watchers, notification services

## Best Practices

### Error Handling

```typescript
try {
    const result = await this.service.processRequest(request)
    return { success: true, data: result }
} catch (error) {
    console.error('Application error:', error)
    return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
    }
}
```

### Logging

```typescript
// Use console.error for server logs (stdout reserved for protocol)
console.error('Application started')
console.error('Processing request:', request.id)

// Use console.log only for protocol responses
console.log(JSON.stringify(response))
```

### Configuration Management

```typescript
interface ApplicationConfig {
    port: number
    host: string
    debug: boolean
}

const config: ApplicationConfig = {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || 'localhost',
    debug: process.env.DEBUG === 'true',
}
```

### Graceful Shutdown

```typescript
process.on('SIGINT', async () => {
    console.error('Shutting down gracefully...')
    await this.service.cleanup()
    process.exit(0)
})
```

## Testing Applications

### Unit Tests

```typescript
// src/services/application.service.spec.ts
import { ApplicationService } from './application.service.js'

describe('ApplicationService', () => {
    let service: ApplicationService

    beforeEach(() => {
        service = new ApplicationService()
    })

    it('should process requests', async () => {
        const result = await service.processRequest(mockRequest)
        expect(result.success).toBe(true)
    })
})
```

### Integration Tests

```typescript
// __tests__/integration/application.test.ts
import { spawn } from 'child_process'

describe('Application Integration', () => {
    it('should start and respond to requests', async () => {
        const app = spawn('node', ['dist/index.js'])

        // Send test request
        app.stdin.write(JSON.stringify(testRequest))

        // Wait for response
        const response = await new Promise((resolve) => {
            app.stdout.on('data', (data) => {
                resolve(JSON.parse(data.toString()))
            })
        })

        expect(response.success).toBe(true)
        app.kill()
    })
})
```

## Deployment Considerations

### Environment Variables

```bash
# .env
PORT=3000
HOST=localhost
DEBUG=false
NODE_ENV=production
```

### Process Management

```json
// package.json
{
    "scripts": {
        "start:prod": "NODE_ENV=production node dist/index.js",
        "start:dev": "NODE_ENV=development node dist/index.js"
    }
}
```

### Health Checks

```typescript
// Add health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() })
})
```

## Integration with FocusedUX

### MCP Integration

- **Documentation Access**: Provide AI assistants with workspace documentation
- **Code Analysis**: Analyze project structure and provide insights
- **Development Tools**: Integrate with development workflows

### Workspace Integration

- **Configuration**: Use workspace configuration for settings
- **Dependencies**: Leverage workspace dependencies
- **Build Pipeline**: Integrate with Nx build system

### External Integration

- **AI Assistants**: Connect with Claude, Cursor, etc.
- **Development Tools**: Integrate with VS Code, other editors
- **APIs**: Connect with external services and APIs
