# Local Plugin Approach: ./plugins/recommended

## Overview

This document outlines the approach, reasoning, and implementation plan for reorganizing our generators into a local Nx plugin at `./plugins/recommended`. This approach will enforce organizational best practices, improve developer experience, and provide better integration with Nx's plugin ecosystem.

## Why Local Plugin Over Workspace Generators

### **Current Limitations (Workspace Generators)**

- Limited to basic file generation and template processing
- No access to advanced Nx devkit utilities
- Cannot compose other generators
- Limited post-generation hooks and validation
- Basic error handling and validation

### **Local Plugin Advantages**

- **Generator Composition**: Can use existing Nx generators as base
- **Advanced Utilities**: Access to `runTasksInSerial`, `updateJson`, etc.
- **Post-Generation Hooks**: Execute tasks after file generation
- **Better Validation**: Schema validation and error handling
- **Workspace Integration**: Automatic project configuration updates
- **Plugin Ecosystem**: Better integration with Nx's plugin system

## Approach

### **Philosophy**

1. **Enforce Best Practices**: Encode organizational patterns in code
2. **Reduce Developer Errors**: Predefined configurations and validations
3. **Functional by Default**: Generated packages work immediately
4. **Test-Driven Development**: Include functional test source code
5. **Architecture Compliance**: Follow established patterns from Architecture.md

### **Structure**

```
plugins/
├── recommended/                    # Local plugin package
│   ├── package.json               # Plugin metadata
│   ├── project.json               # Nx project configuration
│   ├── generators.json            # Generator collection
│   ├── executors.json             # Executor collection (future)
│   └── src/
│       ├── generators/
│       │   └── tool/              # Tool package generator
│       │       ├── generator.ts   # Generator implementation
│       │       ├── schema.json    # Generator schema
│       │       ├── schema.d.ts    # TypeScript schema types
│       │       └── files/         # File templates
│       ├── executors/             # Custom executors (future)
│       └── index.ts               # Plugin exports
│
_test-source/                       # Functional test implementations
├── observability/                 # Test implementation for observability tool
│   ├── src/                       # Source code to copy into generated tool
│   ├── config/                    # Configuration files
│   └── expected-output/           # Expected generated structure
│
docs/                               # Documentation
├── plugins-recommended-approach.md # This document
└── nx-generators-guide.md         # Updated generator guide
```

## Implementation Plan

### **Phase 1: Plugin Foundation (Current Focus)**

1. Create plugin structure at `./plugins/recommended`
2. Implement tool generator with advanced features
3. Set up functional testing with `_test-source`
4. Validate approach with observability tool example

### **Phase 2: Generator Migration**

1. Migrate core generator
2. Migrate extension generator
3. Migrate library generator
4. Update documentation and guides

### **Phase 3: Advanced Features**

1. Add custom executors
2. Implement post-generation hooks
3. Add validation and error handling
4. Create migration utilities

## Execution Plan

### **Step 1: Create Plugin Structure**

```bash
# Create plugin directory
mkdir -p plugins/recommended

# Initialize plugin package
cd plugins/recommended
npm init -y

# Create basic structure
mkdir -p src/generators/tool/files
mkdir -p src/executors
```

### **Step 2: Plugin Configuration**

**File**: `plugins/recommended/package.json`

```json
{
    "name": "@fux/recommended",
    "version": "1.0.0",
    "description": "FocusedUX recommended generators and executors",
    "generators": "./generators.json",
    "executors": "./executors.json",
    "main": "src/index.ts",
    "types": "src/index.ts"
}
```

**File**: `plugins/recommended/generators.json`

```json
{
    "generators": {
        "tool": {
            "factory": "./src/generators/tool/generator",
            "schema": "./src/generators/tool/schema.json",
            "description": "Generate a tool package following Architecture.md patterns"
        }
    }
}
```

### **Step 3: Tool Generator Implementation**

**File**: `plugins/recommended/src/generators/tool/schema.json`

```json
{
    "$schema": "http://json-schema.org/schema",
    "$id": "ToolGenerator",
    "title": "Tool Generator",
    "type": "object",
    "properties": {
        "name": {
            "type": "string",
            "description": "The name of the tool package",
            "$default": {
                "$source": "argv",
                "index": 0
            },
            "x-prompt": "What is the name of the tool package?",
            "pattern": "^[a-z][a-z0-9-]*$"
        },
        "description": {
            "type": "string",
            "description": "Description of the tool package",
            "x-prompt": "What is the description of the tool package?"
        },
        "scope": {
            "type": "string",
            "description": "Scope of the tool package",
            "enum": ["utility", "build", "test", "dev", "monitoring"],
            "default": "utility",
            "x-prompt": "What is the scope of the tool package?"
        },
        "includeCli": {
            "type": "boolean",
            "description": "Include CLI structure and commands",
            "default": true,
            "x-prompt": "Should the tool include CLI structure?"
        },
        "includeConfig": {
            "type": "boolean",
            "description": "Include configuration directory",
            "default": true,
            "x-prompt": "Should the tool include configuration directory?"
        },
        "includeTests": {
            "type": "boolean",
            "description": "Include complete test structure",
            "default": true,
            "x-prompt": "Should the tool include complete test structure?"
        },
        "dependencies": {
            "type": "array",
            "description": "Additional devDependencies for the tool",
            "items": {
                "type": "string"
            },
            "default": []
        }
    },
    "required": ["name", "description"]
}
```

**File**: `plugins/recommended/src/generators/tool/schema.d.ts`

```typescript
export interface ToolGeneratorSchema {
    name: string
    description: string
    scope?: 'utility' | 'build' | 'test' | 'dev' | 'monitoring'
    includeCli?: boolean
    includeConfig?: boolean
    includeTests?: boolean
    dependencies?: string[]
}
```

**File**: `plugins/recommended/src/generators/tool/generator.ts`

```typescript
import {
    Tree,
    formatFiles,
    generateFiles,
    joinPathFragments,
    names,
    updateJson,
    runTasksInSerial,
} from '@nx/devkit'
import { libraryGenerator as jsLibraryGenerator } from '@nx/js'
import { ToolGeneratorSchema } from './schema'

export async function toolGenerator(tree: Tree, options: ToolGeneratorSchema) {
    const normalizedOptions = normalizeOptions(options)
    const projectRoot = `libs/tools/${normalizedOptions.name}`
    const tasks = []

    // Use JS library generator as base
    tasks.push(
        await jsLibraryGenerator(tree, {
            ...normalizedOptions,
            directory: projectRoot,
            unitTestRunner: 'vitest',
            linter: 'eslint',
            bundler: 'esbuild',
            format: ['esm'],
            skipFormat: true, // We'll format at the end
        })
    )

    // Generate custom tool templates
    generateToolTemplates(tree, normalizedOptions, projectRoot)

    // Update workspace configuration
    updateWorkspaceConfiguration(tree, normalizedOptions, projectRoot)

    // Update project configuration for tool-specific settings
    updateProjectConfiguration(tree, normalizedOptions, projectRoot)

    await formatFiles(tree)
    return runTasksInSerial(...tasks)
}

function normalizeOptions(options: ToolGeneratorSchema) {
    const name = names(options.name)
    return {
        ...options,
        name: name.fileName,
        className: name.className,
        constantName: name.constantName,
        propertyName: name.propertyName,
        projectName: `@fux/${name.fileName}`,
        packageName: `@fux/${name.fileName}`,
    }
}

function generateToolTemplates(
    tree: Tree,
    options: ReturnType<typeof normalizeOptions>,
    projectRoot: string
) {
    // Generate tool-specific file templates
    generateFiles(tree, joinPathFragments(__dirname, './files'), projectRoot, {
        ...options,
        tmpl: '',
    })
}

function updateWorkspaceConfiguration(
    tree: Tree,
    options: ReturnType<typeof normalizeOptions>,
    projectRoot: string
) {
    // Add to nx.json release.projects
    updateJson(tree, 'nx.json', (json) => {
        if (json.release?.projects && !json.release.projects.includes(options.projectName)) {
            json.release.projects.push(options.projectName)
        }
        return json
    })
}

function updateProjectConfiguration(
    tree: Tree,
    options: ReturnType<typeof normalizeOptions>,
    projectRoot: string
) {
    // Update project.json with tool-specific configurations
    updateJson(tree, `${projectRoot}/project.json`, (json) => {
        // Add tool-specific tags
        json.tags = json.tags || []
        json.tags.push(`type:tool`, `scope:${options.scope}`)

        // Update build configuration for tools
        if (json.targets?.build) {
            json.targets.build.options = {
                ...json.targets.build.options,
                bundle: false,
                format: ['esm'],
                external: [],
            }
        }

        return json
    })
}

export default toolGenerator
```

### **Step 4: File Templates**

**File**: `plugins/recommended/src/generators/tool/files/vitest.config.ts__tmpl__`

```typescript
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./__tests__/_setup.ts'],
        include: [
            'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            '__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        ],
        exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'coverage/**',
                'dist/**',
                '**/*.d.ts',
                '**/__tests__/**',
                '**/index.ts',
                '**/interfaces/**',
            ],
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
})
```

**File**: `plugins/recommended/src/generators/tool/files/README.md__tmpl__`

````markdown
# <%= className %>

<%= description %>

## Installation

This tool is part of the FocusedUX workspace and can be used directly within the monorepo.

## Usage

```typescript
import { <%= className %> } from '@fux/<%= name %>';

const tool = new <%= className %>();
tool.execute();
```
````

## Development

### Building

```bash
nx build @fux/<%= name %>
```

### Testing

```bash
# Run all tests
nx test @fux/<%= name %>

# Run with coverage
nx test @fux/<%= name %> --coverage
```

### Linting

```bash
nx lint @fux/<%= name %>
```

## Architecture

This tool follows the FocusedUX Architecture.md patterns for tool packages:

- **Location**: `libs/tools/<%= name %>/`
- **Scope**: <%= scope %>
- **Build**: ESM format, no bundling
- **Dependencies**: Minimal external dependencies
- **Testing**: Comprehensive test structure with Vitest

## License

MIT

````

### **Step 5: Test Source Implementation**

**File**: `_test-source/observability/src/lib/logger.ts`
```typescript
export interface LogLevel {
  debug: 0;
  info: 1;
  warn: 2;
  error: 3;
}

export interface LogEntry {
  timestamp: string;
  level: keyof LogLevel;
  message: string;
  context?: Record<string, any>;
}

export class Logger {
  private level: keyof LogLevel = 'info';
  private levels: LogLevel = { debug: 0, info: 1, warn: 2, error: 3 };

  constructor(level: keyof LogLevel = 'info') {
    this.level = level;
  }

  private shouldLog(level: keyof LogLevel): boolean {
    return this.levels[level] >= this.levels[this.level];
  }

  private formatEntry(level: keyof LogLevel, message: string, context?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.shouldLog('debug')) {
      console.log(JSON.stringify(this.formatEntry('debug', message, context)));
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (this.shouldLog('info')) {
      console.log(JSON.stringify(this.formatEntry('info', message, context)));
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    if (this.shouldLog('warn')) {
      console.warn(JSON.stringify(this.formatEntry('warn', message, context)));
    }
  }

  error(message: string, context?: Record<string, any>): void {
    if (this.shouldLog('error')) {
      console.error(JSON.stringify(this.formatEntry('error', message, context)));
    }
  }
}
````

**File**: `_test-source/observability/src/index.ts`

```typescript
export * from './lib/logger'
export * from './lib/metrics'
export * from './lib/error-tracker'
export * from './lib/health-check'

export { Logger } from './lib/logger'
export { MetricsCollector } from './lib/metrics'
export { ErrorTracker } from './lib/error-tracker'
export { HealthChecker } from './lib/health-check'
```

### **Step 6: Plugin Registration**

**File**: `nx.json` (add to plugins section)

```json
{
    "plugins": [
        {
            "plugin": "@nx/eslint/plugin",
            "options": {
                "targetName": "lint",
                "configFile": "eslint.config.js"
            }
        },
        {
            "plugin": "./plugins/recommended",
            "options": {}
        }
    ]
}
```

## Testing Workflow

### **1. Prepare Test Source**

```bash
# Ensure test source is ready
ls _test-source/observability/src/
```

### **2. Test Generator with Dry Run**

```bash
# Test generator without making changes
nx g @fux/recommended:tool observability --description="Comprehensive observability system" --scope="monitoring" --dryRun
```

### **3. Generate Package**

```bash
# Generate actual package
nx g @fux/recommended:tool observability --description="Comprehensive observability system" --scope="monitoring"
```

### **4. Implant Test Source**

```bash
# Copy functional source code into generated package
cp -r _test-source/observability/src/* libs/tools/observability/src/
```

### **5. Validate Functionality**

```bash
# Build the generated package
nx build @fux/observability

# Run tests
nx test @fux/observability

# Verify it works as expected
```

### **6. Clean Up**

```bash
# Remove test package after validation
rm -rf libs/tools/observability
```

## Validation Checklist

### **Before Committing Plugin Changes**

- [ ] **Plugin builds successfully** - No TypeScript errors
- [ ] **Generator runs without errors** - Dry run succeeds
- [ ] **Templates are complete** - All necessary files included
- [ ] **Schema validation works** - Proper input validation
- [ ] **Workspace integration** - Package appears in Nx graph
- [ ] **Build succeeds** - Generated package builds without errors
- [ ] **Tests pass** - All tests run successfully
- [ ] **Functionality works** - Package performs its intended purpose

### **Test Source Validation**

- [ ] **Source code is functional** - Implements real features
- [ ] **No external dependencies** - Self-contained where possible
- [ ] **Follows patterns** - Consistent with existing packages
- [ ] **Well-documented** - Clear comments and examples
- [ ] **Testable** - Includes unit and integration tests

## Benefits of This Approach

### **For Developers**

- **Single command** to create fully functional packages
- **Consistent patterns** enforced automatically
- **Reduced errors** through predefined configurations
- **Better integration** with workspace tools

### **For the Organization**

- **Enforced best practices** through code
- **Consistent architecture** across all packages
- **Reduced maintenance** through automation
- **Better documentation** through generated examples

### **For the Codebase**

- **Architecture compliance** built into generators
- **Consistent structure** across all packages
- **Automatic workspace integration**
- **Comprehensive testing** from the start

## Next Steps

1. **Implement Phase 1** - Create plugin structure and tool generator
2. **Test with observability example** - Validate the approach
3. **Document lessons learned** - Update this guide
4. **Plan Phase 2** - Migrate remaining generators
5. **Implement advanced features** - Post-generation hooks, validation

## Resources

- [Nx Plugin Documentation](https://nx.dev/recipes/generators/local-generators)
- [Nx Devkit API](https://nx.dev/devkit/index)
- [Workspace Architecture Guide](./Architecture.md)
- [Testing Strategy Guide](./FocusedUX-Testing-Strategy.md)

---

**Goal**: Create a local plugin that enforces our organizational best practices and produces working packages immediately, with comprehensive testing and validation built into the generation process.
