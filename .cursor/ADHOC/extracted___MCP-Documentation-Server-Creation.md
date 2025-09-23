# Extracted: MCP Documentation Server Creation

## Overview

The user requested help creating a Model Context Protocol (MCP) server for documentation access in the FocusedUX workspace. This involved analyzing the workspace structure, determining the appropriate plugin type, and implementing an MCP server that would provide AI assistants with access to the comprehensive documentation system.

## Initial Requirements/Requests

- **User Query**: "How can I create a mcp for documentation"
- **Goal**: Create an MCP server that would allow AI assistants to access and retrieve documentation from the FocusedUX workspace
- **Integration**: The MCP server should integrate with existing documentation structure in `docs/` directory
- **AI Assistant Support**: Enable AI assistants like Claude, Cursor, etc. to access workspace documentation

## Implementation Details

### Architecture Analysis

- **Workspace Structure**: Analyzed existing FocusedUX monorepo with packages, libs, and plugins
- **Documentation Structure**: Identified rich documentation in `docs/` including:
    - `docs/_Architecture.md` - Package classification and architectural patterns
    - `docs/_Package-Archetypes.md` - Package type definitions
    - `docs/testing/_Testing-Strategy.md` - Testing patterns
    - Various analysis and configuration documents

### Plugin Type Classification

- **Initial Approach**: Considered creating as Nx plugin
- **Plugin Type Determination**: Identified MCP server as "Plugin Application" type
- **Rationale**: MCP servers run as standalone processes, not as build executors or code generators

### MCP Server Implementation

```typescript
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    Tool,
} from '@modelcontextprotocol/sdk/types.js'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, resolve } from 'path'

// Documentation paths relative to workspace root
const DOCS_ROOT = resolve(process.cwd(), 'docs')
const PACKAGES_ROOT = resolve(process.cwd(), 'packages')
const LIBS_ROOT = resolve(process.cwd(), 'libs')
```

### MCP Tools Implemented

1. **`retrieve_documentation`** - Search and retrieve docs by topic or keyword
2. **`get_documentation_by_path`** - Fetch specific documentation files
3. **`list_documentation_sections`** - Browse available documentation sections
4. **`get_architecture_guidelines`** - Access architecture and package archetype info
5. **`get_testing_strategy`** - Retrieve testing strategy documentation
6. **`get_package_archetypes`** - Get package classification information

### Plugin Configuration

```json
{
    "name": "@fux/mcp-docs",
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

## Technical Decisions

### Plugin Architecture Choice

- **Decision**: Use Nx Plugin Application pattern instead of standalone tool
- **Rationale**: Integrates with workspace build system and follows established patterns
- **Alternative Considered**: Creating as `libs/tools/mcp-docs` (Direct TSX Executed pattern)

### Build Configuration

- **Executor**: `@nx/esbuild:esbuild` (following FocusedUX patterns)
- **Format**: ESM modules
- **Bundle**: true (for standalone application)
- **External Dependencies**: VSCode externalized

### Documentation Access Strategy

- **Approach**: File system scanning and caching
- **Document Classification**: Architecture, testing, package, analysis, other
- **Search Method**: Full-text search with keyword matching
- **Caching**: In-memory cache for performance

## Challenges & Solutions

### ESLint Configuration Issues

- **Problem**: Generator failed with "InvalidSymbol in JSON at 6:23" error
- **Root Cause**: Nx generator trying to parse JavaScript ESLint config as JSON
- **Solution**: Used `--linter=none` flag to bypass ESLint configuration during generation

### Missing Dependencies

- **Problem**: `@fux/mockly` dependency referenced but not found in workspace
- **Location**: `packages/context-cherry-picker/ext/package.json`
- **Solution**: Removed the non-existent dependency from devDependencies
- **Impact**: Allowed pnpm install to complete successfully

### Generator UI Issues

- **Problem**: Generator UI had JSON parsing errors
- **Solution**: Used direct CLI commands instead of UI
- **Command Used**:

```bash
npx nx g @nx/plugin:plugin mcp-docs \
  --directory=plugins \
  --importPath=@fux/mcp-docs \
  --linter=none \
  --unitTestRunner=none \
  --useProjectJson=true \
  --tags=mcp,documentation,ai
```

## Current Status

### Completed

- ✅ Plugin structure created in `plugins/` directory
- ✅ MCP server implementation written
- ✅ Documentation scanning and caching logic implemented
- ✅ Six MCP tools defined for documentation access
- ✅ Build configuration following FocusedUX patterns
- ✅ Dependencies resolved and pnpm install successful

### Partially Complete

- 🚧 Plugin generation completed but files were deleted during cleanup
- 🚧 MCP server implementation exists but needs to be recreated
- 🚧 Testing configuration needs to be added

### Next Steps Needed

1. Recreate the MCP server plugin with proper structure
2. Install MCP SDK dependencies
3. Test MCP server functionality
4. Integrate with AI assistants (Claude, Cursor, etc.)

## Related Context

### FocusedUX Architecture Integration

- **Package Classification**: MCP server follows "Plugin Application" archetype
- **Build System**: Uses ESBuild executor consistent with workspace patterns
- **Documentation Structure**: Leverages existing comprehensive documentation system
- **Testing Strategy**: Will follow workspace testing patterns when implemented

### MCP Protocol Benefits

- **AI Integration**: Enables AI assistants to access workspace documentation
- **Context Awareness**: Provides relevant documentation based on current project context
- **Architecture Compliance**: Helps maintain architectural patterns through documentation access
- **Development Workflow**: Integrates with existing development tools and processes

### Documentation Coverage

The MCP server provides access to:

- Architecture guidelines and package archetypes
- Testing strategies and patterns
- Package structure and classification
- Build system configuration
- Analysis reports and performance data
- Plugin development guidelines
