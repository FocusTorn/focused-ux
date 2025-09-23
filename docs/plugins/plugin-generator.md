# Plugin Generators

## Overview

Plugin generators are Nx plugins that provide **code generation capabilities** - they create new files, projects, or modify existing code. They're the "creators" in the Nx ecosystem.

## Characteristics

- **Generate Code**: Create new files, projects, or components
- **Template-Based**: Use templates and schemas for consistent generation
- **Interactive**: Can prompt users for input during generation
- **Modify Existing**: Can update existing files (add imports, update configs)
- **Project-Aware**: Understand workspace structure and dependencies

## Examples in FocusedUX

- **`@fux/recommended:tests`** - Generate test configurations and structure
- **`@nx/js:library`** - Generate new library projects
- **`@nx/plugin:plugin`** - Generate new Nx plugins
- **`@nx/plugin:generator`** - Generate new generators within plugins

## Generator Structure

```
plugins/{generator-name}/
├── src/
│   └── generators/
│       └── {generator-name}/
│           ├── {generator-name}.ts          # Main generator implementation
│           ├── schema.json                  # Generator options schema
│           ├── schema.d.ts                  # TypeScript types
│           ├── files/                       # Template files
│           │   ├── __name__/
│           │   │   └── __name__.ts__tmpl__  # Template files
│           │   └── __name__.spec.ts__tmpl__
│           └── {generator-name}.spec.ts     # Tests
├── generators.json                          # Generator registration
├── project.json                            # Plugin configuration
└── package.json                            # Dependencies
```

## Generator Implementation Pattern

```typescript
// src/generators/{generator-name}/{generator-name}.ts
import { Tree, formatFiles, generateFiles, names } from '@nx/devkit'
import { join } from 'path'

export default async function generator(tree: Tree, options: GeneratorOptions): Promise<void> {
    const { name, directory } = options
    const { className, fileName } = names(name)

    // Generate files from templates
    generateFiles(tree, join(__dirname, 'files'), directory || `libs/${fileName}`, {
        ...options,
        className,
        fileName,
        ...names(name),
    })

    // Update existing files
    updateProjectConfiguration(tree, projectName, {
        // ... configuration updates
    })

    // Format generated files
    await formatFiles(tree)
}
```

## Schema Definition

```json
// schema.json
{
    "type": "object",
    "properties": {
        "name": {
            "type": "string",
            "description": "Name of the generated item",
            "$default": {
                "$source": "argv",
                "index": 0
            }
        },
        "directory": {
            "type": "string",
            "description": "Directory where the item will be created"
        },
        "tags": {
            "type": "string",
            "description": "Tags to add to the project"
        }
    },
    "required": ["name"]
}
```

## Template Files

```
files/
├── __name__/
│   ├── src/
│   │   ├── __name__.ts__tmpl__           # Template with substitutions
│   │   └── index.ts__tmpl__
│   ├── __name__.spec.ts__tmpl__
│   ├── project.json__tmpl__
│   └── package.json__tmpl__
```

Template syntax:

- `__name__` - Replaced with the name parameter
- `__className__` - Replaced with PascalCase name
- `__fileName__` - Replaced with kebab-case name
- `__upperCaseName__` - Replaced with UPPERCASE name

## Registration

```json
// generators.json
{
    "generators": {
        "{generator-name}": {
            "implementation": "./src/generators/{generator-name}/{generator-name}.ts",
            "schema": "./src/generators/{generator-name}/schema.json"
        }
    }
}
```

## Generation Commands

### Generate New Generator in Existing Plugin

```bash
# Generate generator within an existing plugin
npx nx generate @nx/plugin:generator plugins/{plugin-name}/src/generators/{generator-name}

# Example: Generate a new component generator in ui plugin
npx nx generate @nx/plugin:generator plugins/ui/src/generators/component
```

### Generate New Plugin with Generator

```bash
# Generate new plugin first
npx nx g @nx/plugin:plugin plugins/{plugin-name} \
  --directory=plugins \
  --importPath=@fux/{plugin-name} \
  --linter=none \
  --unitTestRunner=none \
  --useProjectJson=true \
  --tags={relevant-tags}

# Then generate generator within the plugin
npx nx generate @nx/plugin:generator plugins/{plugin-name}/src/generators/{generator-name}
```

## Usage

```bash
# Generate using the generator
npx nx g @fux/{plugin-name}:{generator-name} my-item --directory=libs

# Or with options
npx nx g @fux/{plugin-name}:{generator-name} my-item --tags=ui,component
```

## Generator Capabilities

### File Operations

- **Generate Files**: Create new files from templates
- **Update Files**: Modify existing files (add imports, update configs)
- **Delete Files**: Remove files when needed
- **Move Files**: Reorganize file structure

### Project Operations

- **Create Projects**: Generate new Nx projects
- **Update Configuration**: Modify project.json, package.json
- **Add Dependencies**: Update dependency graphs
- **Configure Targets**: Add build, test, lint targets

### Workspace Operations

- **Update Workspace Config**: Modify nx.json, tsconfig.json
- **Add Libraries**: Update path mappings
- **Configure Tools**: Set up ESLint, Prettier, etc.

## Best Practices

- **Consistent Naming**: Use consistent naming conventions
- **Template Organization**: Organize templates logically
- **Schema Validation**: Validate all input options
- **Error Handling**: Handle edge cases and invalid inputs
- **Documentation**: Document generator purpose and options
- **Testing**: Test generation with various inputs

## Common Generator Types

- **Project Generators**: Create new applications or libraries
- **Component Generators**: Generate UI components
- **Service Generators**: Create service classes
- **Configuration Generators**: Set up tools and configs
- **Migration Generators**: Update code for breaking changes
- **Template Generators**: Create boilerplate code

## Testing Generators

```typescript
// {generator-name}.spec.ts
import { Tree } from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import generator from './generator'

describe('generator', () => {
    let tree: Tree

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace()
    })

    it('should generate files', async () => {
        await generator(tree, { name: 'test' })

        expect(tree.exists('libs/test/src/test.ts')).toBeTruthy()
        expect(tree.read('libs/test/src/test.ts', 'utf-8')).toContain('Test')
    })
})
```

## Interactive Prompts

```typescript
// Add prompts to schema.json
{
    "properties": {
        "style": {
            "type": "string",
            "enum": ["css", "scss", "styled-components"],
            "x-prompt": "Which styling approach would you like to use?"
        }
    }
}
```




