# PAE Configuration Migration Execution Plan

## Overview

This document outlines the complete execution plan for migrating the Project Alias Expander (PAE) system from the current JSON configuration format to the new simplified YAML format. The migration involves significant structural changes to improve maintainability, readability, and performance.

## Migration Goals

- **Simplify configuration structure** - reduce complexity and redundancy
- **Improve maintainability** - easier to understand and modify
- **Enhance performance** - faster parsing and resolution
- **Better developer experience** - clearer error messages and validation
- **Clean architecture** - single format support without backward compatibility

## Current vs New Format Comparison

### Configuration Structure Changes

| Aspect        | Current (JSON)                        | New (YAML)                       | Impact                   |
| ------------- | ------------------------------------- | -------------------------------- | ------------------------ |
| **Targets**   | Separate `nxTargets`, `not-nxTargets` | Nested `targets` structure       | Consolidation            |
| **Templates** | `{variable}` syntax                   | `{{variable}}` syntax            | PowerShell compatibility |
| **Defaults**  | `"defaults": {"key": "value"}`        | `"default": "value"`             | Simplified structure     |
| **Packages**  | Individual alias objects              | Grouped by package with variants | Major restructuring      |
| **Commands**  | Static descriptions                   | Direct execution commands        | New functionality        |

### Key Structural Changes

#### 1. Target Consolidation

```yaml
# Before: Separate sections
nxTargets: { 'b': 'build', 'p': 'package' }
not-nxTargets: { 'esv': 'npx esbuild-visualizer --metadata' }

# After: Nested structure
targets:
    nx-targets: { 'b': 'build', 'p': 'package' }
    not-nx-target: { 'esv': 'npx esbuild-visualizer --metadata' }
```

#### 2. Package Structure Overhaul

```yaml
# Before: Individual aliases
ccp: { 'name': 'context-cherry-picker', 'suffix': 'ext', 'full': true }
ccpc: { 'name': 'context-cherry-picker', 'suffix': 'core' }
ccpe: { 'name': 'context-cherry-picker', 'suffix': 'ext' }

# After: Grouped structure
context-cherry-picker:
    aliases: [ccp]
    variants:
        core: ccpc
        ext: ccpe
    default: ext
```

#### 3. Template Syntax Update

```yaml
# Before: PowerShell conflict syntax
template: "--output-style={style}"

# After: Clear template syntax
template: "--output-style={{style}}"
```

#### 4. Defaults Simplification

```yaml
# Before: Nested object
defaults: { 'style': 'stream' }

# After: Direct value
default: 'stream'
```

## Execution Phases

### Phase 1: Configuration Structure Updates

#### 1.1 Update Type Definitions

**Files to modify:**

- `src/_types/config.types.ts`
- `src/_types/expandable.types.ts`

**Changes:**

```typescript
// Add new package definition type
export interface PackageDefinition {
    aliases: string[]
    variants: Record<string, string>
    default?: string
}

// Update expandable value structure
export type ExpandableValue =
    | string
    | {
          position?: 'start' | 'prefix' | 'pre-args' | 'suffix' | 'end'
          default?: string // Changed from defaults object
          template?: string
          mutation?: string
          // ... other properties
      }

// Update main config interface
export interface AliasConfig {
    'feature-nxTargets'?: Record<string, FeatureTarget>
    targets?: {
        'nx-targets'?: TargetsMap
        'not-nx-target'?: TargetsMap
    }
    'expandable-commands'?: Record<string, string>
    'expandable-flags'?: Record<string, ExpandableValue>
    'context-aware-flags'?: Record<string, ContextAwareFlagValue>
    'internal-flags'?: Record<string, ExpandableValue>
    'env-setting-flags'?: Record<string, ExpandableValue>
    nxPackages?: Record<string, AliasValue | PackageDefinition>
}
```

#### 1.2 Create New Services

**New files to create:**

- `src/services/CommandResolutionService.ts`
- `src/services/PackageResolutionService.ts`
- `src/services/ConfigurationValidator.ts`

### Phase 2: Command Resolution System

#### 2.1 Command Resolution Priority

**New priority order:**

1. **Reserved PAE commands** (install, help, refresh, etc.)
2. **Expandable commands** (build, globalize) - direct execution
3. **Package aliases** (pbc, dc, etc.) - normal processing
4. **Unknown commands** - throw error

#### 2.2 Reserved Command Validation

**Reserved commands to block:**

- `install` - PAE module installation
- `remove` - PAE module removal
- `refresh` - alias refresh
- `help` - help system
- `load` - module loading

**Implementation:**

```typescript
export class CommandResolutionService {
    private readonly reservedCommands = ['install', 'remove', 'refresh', 'help', 'load']

    resolveCommand(command: string, config: AliasConfig): CommandResolution {
        if (this.isReservedCommand(command)) {
            return { type: 'reserved', command }
        }

        if (config['expandable-commands']?.[command]) {
            return {
                type: 'expandable',
                command,
                execution: config['expandable-commands'][command],
            }
        }

        return { type: 'package', command }
    }
}
```

#### 2.3 Direct Command Execution

**Expandable commands behavior:**

- `pae build` → executes `nx build @fux/project-alias-expander -s` directly
- `pae globalize` → executes `nx install @fux/project-alias-expander` directly
- No alias/target processing
- No flag expansion (except PAE internal flags)

### Phase 3: Template Processing Updates

#### 3.1 Template Engine Update

**Syntax change:**

- **Before:** `{variable}` syntax
- **After:** `{{variable}}` syntax

**Implementation:**

```typescript
export class TemplateProcessor {
    processTemplate(template: string, variables: Record<string, string>): string {
        return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
            return variables[variable] || match
        })
    }
}
```

#### 3.2 Defaults Structure Update

**Access pattern change:**

- **Before:** `config.defaults.key`
- **After:** `config.default`

### Phase 4: Package Resolution Overhaul

#### 4.1 Package Resolution Service

**New service responsibilities:**

- Build package definitions from new structure
- Create alias mappings
- Handle variant resolution
- Generate full package names

**Implementation:**

```typescript
export class PackageResolutionService {
    private packageMap: Map<string, PackageDefinition> = new Map()
    private aliasMap: Map<string, string> = new Map()

    constructor(config: AliasConfig) {
        this.buildMaps(config)
    }

    private buildMaps(config: AliasConfig): void {
        Object.entries(config.nxPackages || {}).forEach(([key, value]) => {
            if (typeof value === 'object' && 'aliases' in value) {
                const packageDef = value as PackageDefinition
                this.packageMap.set(key, packageDef)

                // Build alias mappings
                packageDef.aliases.forEach((alias) => {
                    this.aliasMap.set(alias, key)
                })

                // Build variant mappings
                Object.entries(packageDef.variants).forEach(([variant, alias]) => {
                    this.aliasMap.set(alias, key)
                })
            }
        })
    }
}
```

### Phase 5: Target Resolution Updates

#### 5.1 Nested Target Structure

**New target resolution:**

```typescript
export class TargetResolutionService {
    resolveTarget(target: string, config: AliasConfig): string {
        // Check feature targets first
        if (config['feature-nxTargets']?.[target]) {
            return config['feature-nxTargets'][target]['run-target']
        }

        // Check nested targets structure
        if (config.targets?.['nx-targets']?.[target]) {
            return config.targets['nx-targets'][target]
        }

        if (config.targets?.['not-nx-target']?.[target]) {
            return config.targets['not-nx-target'][target]
        }

        throw new Error(`Unknown target: ${target}`)
    }
}
```

### Phase 6: Configuration Validation

#### 6.1 Validation Rules

**New validation requirements:**

- No reserved commands in expandable-commands
- No package alias conflicts with expandable commands
- Valid template syntax with `{{variable}}`
- Proper package structure validation
- Required fields validation

**Implementation:**

```typescript
export class ConfigurationValidator {
    validate(config: AliasConfig): ValidationResult {
        const errors: string[] = []

        this.validateExpandableCommands(config, errors)
        this.validatePackageStructure(config, errors)
        this.validateTemplateSyntax(config, errors)

        return { isValid: errors.length === 0, errors }
    }
}
```

### Phase 7: Testing Strategy

#### 7.1 Unit Tests

**Test coverage areas:**

- Command resolution priority
- Template processing with `{{variable}}` syntax
- Package resolution with new structure
- Configuration validation
- Reserved command blocking
- Direct command execution

#### 7.2 Integration Tests

**End-to-end testing:**

- Complete command execution flow
- Expandable command execution
- Package alias processing
- Flag expansion and processing
- Error handling and validation

#### 7.3 Migration Tests

**Migration validation:**

- Test new config format parsing
- Verify functionality equivalence
- Performance comparison
- Error message validation

### Phase 8: Deployment Strategy

#### 8.1 Clean Migration Approach

**No backward compatibility:**

- Support only new YAML format
- Clear error messages for old format
- Clean break from old system
- Single format maintenance

#### 8.2 Error Handling

**Old format detection:**

```typescript
if (this.isOldFormat(rawConfig)) {
    throw new Error(`
    Old configuration format detected. Please migrate to the new YAML format.
    
    Migration steps:
    1. Convert your .pae.json to .pae.yaml
    2. Update the structure according to the new format
    3. Test your configuration
    
    See migration guide: [link to docs]
  `)
}
```

#### 8.3 Rollout Plan

1. **Phase 1**: Update PAE codebase to support new format only
2. **Phase 2**: Convert `.pae.json` to `.pae.yaml`
3. **Phase 3**: Deploy new system
4. **Phase 4**: Remove old format entirely

## Implementation Timeline

### Week 1-2: Foundation

- Update type definitions
- Create new service interfaces
- Implement basic command resolution

### Week 3-4: Core Services

- Implement package resolution service
- Update template processing
- Create configuration validator

### Week 5-6: Integration

- Update main command processing
- Integrate all services
- Implement error handling

### Week 7-8: Testing & Validation

- Comprehensive unit testing
- Integration testing
- Migration testing
- Performance validation

### Week 9-10: Deployment

- Documentation updates
- Migration guide creation
- System deployment
- User communication

## Risk Mitigation

### Technical Risks

- **Template syntax conflicts** - Thorough testing with PowerShell
- **Package resolution complexity** - Incremental implementation
- **Performance regression** - Benchmarking and optimization
- **Configuration validation** - Comprehensive test coverage

### User Experience Risks

- **Migration complexity** - Clear documentation and examples
- **Error message clarity** - User-friendly error messages
- **Functionality loss** - Comprehensive testing
- **Learning curve** - Migration guide and examples

## Success Criteria

### Technical Success

- [ ] All existing functionality preserved
- [ ] New format fully supported
- [ ] Performance maintained or improved
- [ ] Comprehensive test coverage
- [ ] Clean error handling

### User Experience Success

- [ ] Clear migration path
- [ ] Improved configuration readability
- [ ] Better error messages
- [ ] Faster command execution
- [ ] Simplified maintenance

## Post-Migration Benefits

### Developer Experience

- **Cleaner configuration** - easier to read and maintain
- **Better error messages** - clearer validation feedback
- **Faster development** - simplified structure
- **Improved performance** - optimized parsing

### System Architecture

- **Simpler codebase** - single format support
- **Better maintainability** - consolidated structure
- **Enhanced performance** - optimized resolution
- **Cleaner architecture** - focused responsibilities

## Conclusion

This migration represents a significant improvement to the PAE system architecture. The new YAML format provides better readability, maintainability, and performance while maintaining all existing functionality. The clean migration approach ensures a focused implementation without the complexity of backward compatibility.

The execution plan provides a structured approach to implementing these changes while minimizing risk and ensuring a smooth transition for users.
