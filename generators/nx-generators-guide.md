# Nx Generators Guide - FocusedUX Workspace

## Overview

This guide documents the implementation, best practices, and project-specific patterns for Nx generators in the FocusedUX workspace. It serves as a reference for creating and maintaining generators that align with our architectural patterns and development workflows.

## Table of Contents

1. [Generator Structure](#generator-structure)
2. [Implementation Patterns](#implementation-patterns)
3. [File Templates](#file-templates)
4. [Schema Design](#schema-design)
5. [Testing Generators](#testing-generators)
6. [Common Issues & Solutions](#common-issues--solutions)
7. [Best Practices](#best-practices)
8. [Project-Specific Patterns](#project-specific-patterns)

## Generator Structure

### Directory Layout

```
generators/
├── collection.json              # Generator collection configuration
├── package.json                 # Collection metadata
├── {generator-name}/
│   ├── generator.ts             # Main generator logic
│   ├── schema.json              # Generator schema
│   ├── schema.d.ts              # TypeScript schema types
│   └── files/                   # File templates
│       ├── package.json__tmpl__
│       ├── project.json__tmpl__
│       ├── tsconfig.json__tmpl__
│       └── src/
│           └── index.ts__tmpl__
```

### Collection Configuration

**File**: `generators/collection.json`

```json
{
    "generators": {
        "generator-name": {
            "factory": "./generator-name/generator#default",
            "schema": "./generator-name/schema.json",
            "description": "Description of what this generator does"
        }
    }
}
```

### Workspace Integration

**File**: `package.json`

```json
{
    "nx": {
        "defaultCollection": "./generators"
    }
}
```

## Implementation Patterns

### Generator Function Signature

```typescript
import type { Tree } from '@nx/devkit'
import { formatFiles, generateFiles, joinPathFragments, names, updateJson } from '@nx/devkit'
import type { GeneratorSchema } from './schema.d.ts'

export default async function (tree: Tree, schema: GeneratorSchema) {
    const options = normalizeOptions(schema)

    // Create package directory structure
    const packageRoot = joinPathFragments('target/directory', options.name)

    // Generate files from templates
    generateFiles(tree, joinPathFragments(__dirname, './files'), packageRoot, {
        ...options,
        ...names(options.name),
        packageRoot,
        tmpl: '',
    })

    // Update workspace configuration
    updateJson(tree, 'nx.json', (json) => {
        // Add to release.projects if needed
        if (json.release?.projects && !json.release.projects.includes(options.projectName)) {
            json.release.projects.push(options.projectName)
        }
        return json
    })

    await formatFiles(tree)
}
```

### Options Normalization

```typescript
interface NormalizedSchema extends GeneratorSchema {
    projectName: string
    packageName: string
}

function normalizeOptions(schema: GeneratorSchema): NormalizedSchema {
    const name = names(schema.name)

    return {
        ...schema,
        projectName: `@fux/${name.fileName}`,
        packageName: `@fux/${name.fileName}`,
    }
}
```

## File Templates

### Template Variables

Available variables in templates:

- `name` - Normalized file name
- `className` - PascalCase class name
- `constantName` - UPPER_SNAKE_CASE constant name
- `propertyName` - camelCase property name
- `fileName` - kebab-case file name
- `projectName` - Full project name (e.g., `@fux/tool-name`)
- `packageName` - Package name
- `packageRoot` - Full package root path
- All schema properties (description, author, version, etc.)

### Template File Naming

- Use `__tmpl__` suffix for template files
- Template files are copied to the target location with the suffix removed
- Example: `package.json__tmpl__` → `package.json`

### Common Template Patterns

**Package.json Template**:

```json
{
    "name": "@fux/<%= name %>",
    "version": "<%= version %>",
    "description": "<%= description %>",
    "main": "dist/index.js",
    "type": "module",
    "exports": {
        ".": {
            "import": "./dist/index.js",
            "types": "./dist/index.d.ts"
        }
    },
    "scripts": {
        "build": "nx build @fux/<%= name %>",
        "test": "nx test @fux/<%= name %>",
        "lint": "nx lint @fux/<%= name %>"
    },
    "author": "<%= author %>",
    "license": "MIT"
}
```

**Project.json Template**:

```json
{
    "name": "@fux/<%= name %>",
    "$schema": "../../node_modules/nx/schemas/project-schema.json",
    "sourceRoot": "libs/tools/<%= name %>/src",
    "projectType": "library",
    "targets": {
        "build": {
            "executor": "@nx/esbuild:esbuild",
            "outputs": ["{options.outputPath}"],
            "options": {
                "outputPath": "dist/libs/tools/<%= name %>",
                "main": "libs/tools/<%= name %>/src/index.ts",
                "tsConfig": "libs/tools/<%= name %>/tsconfig.lib.json",
                "bundle": false,
                "format": ["esm"]
            }
        }
    },
    "tags": ["type:tool", "scope:shared"]
}
```

## Schema Design

### Schema Structure

```json
{
    "$schema": "http://json-schema.org/schema",
    "$id": "GeneratorName",
    "title": "Generator Title",
    "type": "object",
    "properties": {
        "name": {
            "type": "string",
            "description": "The name of the package",
            "$default": {
                "$source": "argv",
                "index": 0
            },
            "x-prompt": "What is the name of the package?",
            "pattern": "^[a-z][a-z0-9-]*$"
        },
        "description": {
            "type": "string",
            "description": "Description of the package",
            "x-prompt": "What is the description of the package?"
        },
        "author": {
            "type": "string",
            "description": "Author of the package",
            "x-prompt": "Who is the author of the package?",
            "default": "FocusedUX Team"
        },
        "version": {
            "type": "string",
            "description": "Initial version of the package",
            "default": "1.0.0"
        }
    },
    "required": ["name", "description"]
}
```

### Schema Best Practices

1. **Use descriptive property names** that match the intended purpose
2. **Provide meaningful defaults** for optional properties
3. **Use patterns** to validate input (e.g., kebab-case for names)
4. **Include x-prompt** for interactive prompts
5. **Use $default with argv source** for positional arguments
6. **Keep required fields minimal** - only essential properties

## Testing Generators

### Dry Run Testing

```bash
# Test generator without making changes
nx g ./generators:generator-name test-package --dryRun

# Test with specific options
nx g ./generators:generator-name test-package \
  --description="Test package" \
  --author="Test Author" \
  --dryRun
```

### Manual Testing

1. Run generator with `--dryRun` to verify output
2. Run generator without `--dryRun` to create actual files
3. Verify generated files match expected structure
4. Test generated package builds and tests correctly
5. Clean up test files after verification

### Test Source Directory

Use `_test-source/` directory for testing generators:

```
_test-source/
├── {package-name}/
│   ├── src/                    # Source files to test with
│   ├── config/                 # Configuration files
│   └── expected-output/        # Expected generated structure
```

## Common Issues & Solutions

### Issue: Generator Not Found

**Problem**: `Could not find any generators named "generator-name"`

**Solutions**:

1. Verify `defaultCollection` is set in `package.json`
2. Check `collection.json` has correct generator entry
3. Ensure generator directory structure is correct
4. Use full path: `nx g ./generators:generator-name`

### Issue: Schema Validation Errors

**Problem**: `Property 'property' does not match the schema`

**Solutions**:

1. Check schema.json for correct property types
2. Verify command-line arguments match schema
3. Use `--verbose` flag for detailed error information
4. Check for conflicting boolean flags

### Issue: Template Variables Not Resolved

**Problem**: Template variables like `<%= name %>` not replaced

**Solutions**:

1. Ensure `generateFiles` includes all necessary variables
2. Check template file naming (`__tmpl__` suffix)
3. Verify `names()` function is called correctly
4. Include `tmpl: ''` in generateFiles options

### Issue: Workspace Configuration Not Updated

**Problem**: Generated packages not recognized by workspace

**Solutions**:

1. Implement `updateJson` to modify `nx.json`
2. Add packages to `release.projects` array
3. Verify `project.json` has correct structure
4. Check package is included in workspace configuration

### Issue: Generator Not Recognized by Nx

**Problem**: `Could not find any generators named "generator-name"` even with correct structure

**Root Cause**: Missing default collection configuration

**Solutions**:

1. Add `defaultCollection` to `package.json`:
    ```json
    {
        "nx": {
            "defaultCollection": "./generators"
        }
    }
    ```
2. Use full path syntax: `nx g ./generators:generator-name`
3. Verify `collection.json` has correct generator entries
4. Check generator directory structure matches expected pattern

**Note**: This was the primary issue encountered during tool generator development. The workspace had generators but no default collection configured.

## Best Practices

### Generator Development

1. **Start with dry runs** - Always test with `--dryRun` first
2. **Use descriptive names** - Generator names should be clear and specific
3. **Follow existing patterns** - Reuse successful patterns from other generators
4. **Validate inputs** - Use schema patterns and validation
5. **Provide meaningful defaults** - Reduce required user input
6. **Update workspace config** - Ensure generated packages are properly integrated

### File Organization

1. **Group related templates** - Keep templates organized by purpose
2. **Use consistent naming** - Follow established naming conventions
3. **Include documentation** - Add README templates for generated packages
4. **Test structure** - Include comprehensive test setup templates
5. **Configuration files** - Provide all necessary config files

### Schema Design

1. **Minimize required fields** - Only require essential information
2. **Use meaningful defaults** - Provide sensible defaults for optional fields
3. **Validate inputs** - Use patterns and constraints to ensure valid input
4. **Clear descriptions** - Provide helpful descriptions for all fields
5. **Consistent naming** - Use consistent property names across generators

## Project-Specific Patterns

### Tool Package Generator

**Purpose**: Generate tool packages in `libs/tools/`

**Key Features**:

- ESM format, no bundling
- Minimal external dependencies
- Comprehensive test structure
- CLI support (optional)
- Configuration directory (optional)

**Template Structure**:

```
libs/tools/{name}/
├── package.json
├── project.json
├── tsconfig.json
├── tsconfig.lib.json
├── vitest.config.ts
├── vitest.coverage.config.ts
├── README.md
├── src/
│   ├── index.ts
│   ├── lib/
│   │   └── main.ts
│   └── cli/
│       └── index.ts
└── __tests__/
    ├── _setup.ts
    ├── README.md
    ├── _reports/
    │   └── coverage/
    ├── isolated-tests/
    ├── functional-tests/
    └── coverage-tests/
```

### Core Package Generator

**Purpose**: Generate core packages in `packages/{feature}/core/`

**Key Features**:

- Pure business logic
- Self-contained functionality
- No VSCode dependencies
- Asset generation support

### Extension Package Generator

**Purpose**: Generate extension packages in `packages/{feature}/ext/`

**Key Features**:

- VSCode integration
- CommonJS bundling
- Local adapters pattern
- Integration testing setup

### Shared Package Generator

**Purpose**: Generate shared utilities in `libs/shared/`

**Key Features**:

- Pure utility functions
- No external dependencies
- Reusable across packages
- Comprehensive documentation

## Usage Examples

### Creating a Tool Package

```bash
# Basic tool package
nx g ./generators:tool my-tool --description="My custom tool"

# Tool with CLI and config
nx g ./generators:tool my-tool \
  --description="My custom tool with CLI" \
  --author="My Name" \
  --version="1.0.0" \
  --includeCli=true \
  --includeConfig=true
```

### Creating a Core Package

```bash
nx g ./generators:core my-feature --directory=packages
```

### Creating an Extension Package

```bash
nx g ./generators:ext my-feature --directory=packages
```

## Maintenance

### Updating Generators

1. **Test changes thoroughly** - Use dry runs and manual testing
2. **Update documentation** - Keep this guide current
3. **Version control** - Commit generator changes separately
4. **Backward compatibility** - Consider impact on existing generated packages

### Troubleshooting

1. **Check Nx version** - Ensure compatibility with current Nx version
2. **Verify dependencies** - Check `@nx/devkit` version
3. **Clear cache** - Use `nx reset` if needed
4. **Check logs** - Use `--verbose` for detailed error information

## Resources

- [Nx Generators Documentation](https://nx.dev/recipes/generators)
- [Nx Devkit API](https://nx.dev/devkit/index)
- [JSON Schema Specification](https://json-schema.org/)
- [Workspace Architecture Guide](./Architecture.md)
- [Testing Strategy Guide](./FocusedUX-Testing-Strategy.md)
