# Plugin Executors

## Overview

Plugin executors are Nx plugins that provide **execution capabilities** - they run tasks like building, testing, linting, or other operations. They're the "doers" in the Nx ecosystem.

## Characteristics

- **Execute Tasks**: Run build, test, lint, deploy, or other operations
- **Target Integration**: Integrate with Nx's target system
- **Caching Support**: Leverage Nx's intelligent caching
- **Dependency Management**: Handle task dependencies and execution order
- **Output Management**: Manage build outputs and artifacts

## Examples in FocusedUX

- **`@fux/vpack:pack`** - VSCode extension packaging executor
- **`@fux/ft-typescript:typecheck`** - TypeScript type checking executor
- **`@fux/vscode-test-executor:test-integration`** - VSCode integration testing executor
- **`@fux/recommended:audit-structure`** - Package structure auditing executor

## Executor Structure

```
plugins/{executor-name}/
├── src/
│   └── executors/
│       └── {executor-name}/
│           ├── {executor-name}.ts          # Main executor implementation
│           ├── schema.json                 # Executor options schema
│           ├── schema.d.ts                 # TypeScript types
│           └── {executor-name}.spec.ts    # Tests
├── executors.json                          # Executor registration
├── project.json                           # Plugin configuration
└── package.json                           # Dependencies
```

## Executor Implementation Pattern

```typescript
// src/executors/{executor-name}/{executor-name}.ts
import { ExecutorContext } from '@nx/devkit'
import { execSync } from 'child_process'

export default async function executor(
    options: ExecutorOptions,
    context: ExecutorContext
): Promise<{ success: boolean }> {
    try {
        // Executor logic here
        const result = await performTask(options, context)

        return { success: true }
    } catch (error) {
        console.error('Executor failed:', error)
        return { success: false }
    }
}
```

## Schema Definition

```json
// schema.json
{
    "type": "object",
    "properties": {
        "targetPath": {
            "type": "string",
            "description": "Path to the target project"
        },
        "outputPath": {
            "type": "string",
            "description": "Output directory for artifacts"
        }
    },
    "required": ["targetPath"]
}
```

## Registration

```json
// executors.json
{
    "executors": {
        "{executor-name}": {
            "implementation": "./src/executors/{executor-name}/{executor-name}.ts",
            "schema": "./src/executors/{executor-name}/schema.json"
        }
    }
}
```

## Generation Commands

### Generate New Executor in Existing Plugin

```bash
# Generate executor within an existing plugin
npx nx generate @nx/plugin:executor plugins/{plugin-name}/src/executors/{executor-name}

# Example: Generate a new pack executor in vpack plugin
npx nx generate @nx/plugin:executor plugins/vpack/src/executors/pack-dev
```

### Generate New Plugin with Executor

```bash
# Generate new plugin first
npx nx g @nx/plugin:plugin plugins/{plugin-name} \
  --directory=plugins \
  --importPath=@fux/{plugin-name} \
  --linter=none \
  --unitTestRunner=none \
  --useProjectJson=true \
  --tags={relevant-tags}

# Then generate executor within the plugin
npx nx generate @nx/plugin:executor plugins/{plugin-name}/src/executors/{executor-name}
```

## Usage in project.json

```json
{
    "targets": {
        "custom-task": {
            "executor": "@fux/{plugin-name}:{executor-name}",
            "options": {
                "targetPath": "{projectRoot}",
                "outputPath": "dist"
            }
        }
    }
}
```

## Best Practices

- **Error Handling**: Always return `{ success: boolean }`
- **Logging**: Use `console.log` for progress, `console.error` for errors
- **Options Validation**: Validate input options against schema
- **Dependency Awareness**: Use `context.projectGraph` for dependency info
- **Caching**: Leverage Nx's caching when appropriate
- **Outputs**: Define clear outputs for caching and dependency tracking

## Testing

- **Unit Tests**: Test executor logic in isolation
- **Integration Tests**: Test with real project contexts
- **Schema Validation**: Test option validation
- **Error Scenarios**: Test failure cases and error handling

## Common Executor Types

- **Build Executors**: Compile, bundle, transform code
- **Test Executors**: Run unit, integration, e2e tests
- **Lint Executors**: Code quality and style checking
- **Package Executors**: Create distributable packages
- **Deploy Executors**: Deploy applications and packages
- **Audit Executors**: Analyze and validate project structure
