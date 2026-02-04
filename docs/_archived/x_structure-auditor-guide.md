# Test Structure Auditor Implementation Guide

## Overview

This document provides a comprehensive guide for implementing an automated test structure auditor that will detect and fix violations in test files to ensure consistent adherence to the Enhanced Mock Strategy across the CCP codebase.

## Auditor Architecture

### Core Components

1. **Violation Detector** - Scans test files for structural violations
2. **Pattern Matcher** - Identifies specific violation patterns
3. **Auto-Fixer** - Applies standardized fixes to violations
4. **Report Generator** - Creates detailed violation reports
5. **Configuration Manager** - Manages auditor settings and rules

## Violation Categories & Detection Rules

### 1. Duplicate Mock Class Definitions

#### Detection Pattern

```typescript
// Pattern: Class definitions starting with "Mock" + service name
const duplicateMockPattern = /class\s+Mock(FileSystem|Path|Yaml|Tokenizer|Micromatch|Workspace|Window|TreeItemFactory)\s*\{/g

// Detection Rules:
- Look for class definitions with names starting with `Mock` + service name
- Check if the service is already mocked in `globals.ts` or `helpers.ts`
- Flag any duplicate mock classes for: `FileSystem`, `Path`, `Yaml`, `Tokenizer`, `Micromatch`, `Workspace`, `Window`, `TreeItemFactory`
```

#### Auto-Fix Strategy

```typescript
// Replace local mock classes with global mocks
const fixDuplicateMocks = (fileContent: string): string => {
    return fileContent
        .replace(/class\s+MockFileSystem\s*\{[^}]*\}/gs, '')
        .replace(/class\s+MockPath\s*\{[^}]*\}/gs, '')
        .replace(/class\s+MockYaml\s*\{[^}]*\}/gs, '')
        .replace(/class\s+MockTokenizer\s*\{[^}]*\}/gs, '')
        .replace(/class\s+MockMicromatch\s*\{[^}]*\}/gs, '')
        .replace(/class\s+MockWorkspace\s*\{[^}]*\}/gs, '')
        .replace(/class\s+MockWindow\s*\{[^}]*\}/gs, '')
        .replace(/class\s+MockTreeItemFactory\s*\{[^}]*\}/gs, '')
}
```

### 2. Incorrect Mock Setup Order

#### Detection Pattern

```typescript
// Pattern: resetAllMocks called after setup functions
const incorrectOrderPattern = /setupFileSystemMocks\(mocks\)[\s\S]*?resetAllMocks\(mocks\)/g

// Detection Rules:
- Look for `resetAllMocks(mocks)` calls
- Ensure it's called before any `setup*Mocks(mocks)` calls
- Flag if `resetAllMocks` appears after setup functions
```

#### Auto-Fix Strategy

```typescript
const fixMockSetupOrder = (fileContent: string): string => {
    // Extract beforeEach block
    const beforeEachMatch = fileContent.match(/beforeEach\(\(\)\s*=>\s*\{([\s\S]*?)\}\)/g)
    if (beforeEachMatch) {
        const block = beforeEachMatch[0]
        const setupCalls = block.match(/setup\w+Mocks\(mocks\)/g) || []
        const resetCall = block.match(/resetAllMocks\(mocks\)/g)

        if (resetCall && setupCalls.length > 0) {
            // Reorder: reset first, then setup calls
            const reorderedBlock = block
                .replace(/resetAllMocks\(mocks\)/, '')
                .replace(/setup\w+Mocks\(mocks\)/g, '')

            const newContent = `beforeEach(() => {
        mocks = setupTestEnvironment()
        resetAllMocks(mocks)
        ${setupCalls.join('\n        ')}
        
        service = new SomeService(mocks.fileSystem as any, mocks.path as any)
    })`

            return fileContent.replace(beforeEachMatch[0], newContent)
        }
    }
    return fileContent
}
```

### 3. Missing Helper Function Calls

#### Detection Pattern

```typescript
// Pattern: Test uses operations but doesn't call required setup functions
const missingHelperPatterns = {
    fileSystem: /mocks\.fileSystem\.(readFile|writeFile|stat|readDirectory)/g,
    path: /mocks\.path\.(dirname|basename|join|resolve|extname)/g,
    yaml: /mocks\.yaml\.(load|dump)/g,
    tokenizer: /mocks\.tokenizer\.(encode|decode|calculateTokens)/g,
    micromatch: /mocks\.micromatch\.(isMatch|match)/g
}

// Detection Rules:
- Check if test uses file system operations → requires `setupFileSystemMocks`
- Check if test uses path operations → requires `setupPathMocks`
- Check if test uses YAML operations → requires `setupYamlMocks`
- Check if test uses tokenizer operations → requires `setupTokenizerMocks`
- Check if test uses micromatch operations → requires `setupMicromatchMocks`
```

#### Auto-Fix Strategy

```typescript
const addMissingHelperCalls = (fileContent: string): string => {
    const requiredHelpers = []

    if (fileContent.match(/mocks\.fileSystem\.(readFile|writeFile|stat|readDirectory)/)) {
        requiredHelpers.push('setupFileSystemMocks(mocks)')
    }
    if (fileContent.match(/mocks\.path\.(dirname|basename|join|resolve|extname)/)) {
        requiredHelpers.push('setupPathMocks(mocks)')
    }
    if (fileContent.match(/mocks\.yaml\.(load|dump)/)) {
        requiredHelpers.push('setupYamlMocks(mocks)')
    }
    if (fileContent.match(/mocks\.tokenizer\.(encode|decode|calculateTokens)/)) {
        requiredHelpers.push('setupTokenizerMocks(mocks)')
    }
    if (fileContent.match(/mocks\.micromatch\.(isMatch|match)/)) {
        requiredHelpers.push('setupMicromatchMocks(mocks)')
    }

    // Add missing imports
    const importMatch = fileContent.match(
        /import\s*\{([^}]*)\}\s*from\s*['"]\.\.\/__mocks__\/helpers['"]/
    )
    if (importMatch) {
        const existingImports = importMatch[1].split(',').map((imp) => imp.trim())
        const newImports = requiredHelpers.map((helper) => helper.replace('(mocks)', '').trim())
        const allImports = [...new Set([...existingImports, ...newImports])]

        fileContent = fileContent.replace(
            importMatch[0],
            `import { ${allImports.join(', ')} } from '../__mocks__/helpers'`
        )
    }

    return fileContent
}
```

### 4. Inconsistent Service Instantiation

#### Detection Pattern

```typescript
// Pattern: Service constructors using local mock variables
const inconsistentServicePattern = /new\s+\w+Service\(mock\w+\.as\s+any/g

// Detection Rules:
- Look for service constructor calls
- Check if parameters reference local mock variables instead of `mocks.*`
- Flag any service instantiation using local mock classes
```

#### Auto-Fix Strategy

```typescript
const fixServiceInstantiation = (fileContent: string): string => {
    return fileContent
        .replace(
            /new\s+(\w+Service)\(mockFileSystem\.as\s+any,\s*mockPath\.as\s+any\)/g,
            'new $1(mocks.fileSystem as any, mocks.path as any)'
        )
        .replace(/new\s+(\w+Service)\(mock\w+\.as\s+any/g, 'new $1(mocks.$2 as any')
}
```

### 5. Direct Global Mock References

#### Detection Pattern

```typescript
// Pattern: Direct references to global mock variables
const directGlobalPattern = /(mockYaml|mockMicromatch|mockTokenizer)\.\w+/g

// Detection Rules:
- Look for direct references to `mockYaml`, `mockMicromatch`, etc.
- Ensure all mock operations go through `mocks.*` object
- Flag any direct global mock variable usage
```

#### Auto-Fix Strategy

```typescript
const fixDirectGlobalReferences = (fileContent: string): string => {
    return fileContent
        .replace(/mockYaml\./g, 'mocks.yaml.')
        .replace(/mockMicromatch\./g, 'mocks.micromatch.')
        .replace(/mockTokenizer\./g, 'mocks.tokenizer.')
        .replace(/mockFileSystem\./g, 'mocks.fileSystem.')
        .replace(/mockPath\./g, 'mocks.path.')
}
```

### 6. Missing Scenario Builder Usage

#### Detection Pattern

```typescript
// Pattern: Manual mock setup instead of scenario builder
const manualSetupPattern = /mocks\.\w+\.\w+\.mock(ResolvedValue|ReturnValue|Implementation)\(/g

// Detection Rules:
- Look for manual mock setup in test cases
- Check if scenario builder functions are available for the service being tested
- Flag manual mock setup when scenario builder alternatives exist
```

#### Auto-Fix Strategy

```typescript
const convertToScenarioBuilder = (fileContent: string): string => {
    // Identify manual mock setups and suggest scenario builder alternatives
    const manualSetups = fileContent.match(/mocks\.\w+\.\w+\.mock\w+\([^)]+\)/g) || []

    if (manualSetups.length > 3) {
        // Suggest using scenario builder for complex setups
        const suggestion = `
        // Consider using scenario builder for complex mock setup:
        // setupFileExplorerSuccessScenario(mocks, {
        //     operation: 'getChildren',
        //     entries: [...],
        //     expectedChildren: [...]
        // })`

        return fileContent.replace(
            /beforeEach\(\(\)\s*=>\s*\{([\s\S]*?)\}/,
            `beforeEach(() => {${suggestion}\n$1}`
        )
    }

    return fileContent
}
```

### 7. Inconsistent Import Patterns

#### Detection Pattern

```typescript
// Pattern: Missing required imports from mock infrastructure
const importPattern = /import\s*\{([^}]*)\}\s*from\s*['"]\.\.\/__mocks__\/helpers['"]/

// Detection Rules:
- Check if test uses file system operations but doesn't import `setupFileSystemMocks`
- Check if test uses path operations but doesn't import `setupPathMocks`
- Check if test uses YAML operations but doesn't import `setupYamlMocks`
- Check if test uses tokenizer operations but doesn't import `setupTokenizerMocks`
- Check if test uses micromatch operations but doesn't import `setupMicromatchMocks`
```

#### Auto-Fix Strategy

```typescript
const fixImportPatterns = (fileContent: string): string => {
    const requiredImports = ['setupTestEnvironment', 'resetAllMocks']

    // Add required imports based on usage
    if (fileContent.match(/mocks\.fileSystem/)) requiredImports.push('setupFileSystemMocks')
    if (fileContent.match(/mocks\.path/)) requiredImports.push('setupPathMocks')
    if (fileContent.match(/mocks\.yaml/)) requiredImports.push('setupYamlMocks')
    if (fileContent.match(/mocks\.tokenizer/)) requiredImports.push('setupTokenizerMocks')
    if (fileContent.match(/mocks\.micromatch/)) requiredImports.push('setupMicromatchMocks')

    const importStatement = `import { ${requiredImports.join(', ')} } from '../__mocks__/helpers'`

    // Replace existing import or add new one
    if (fileContent.match(/import.*from.*__mocks__\/helpers/)) {
        return fileContent.replace(
            /import\s*\{[^}]*\}\s*from\s*['"]\.\.\/__mocks__\/helpers['"]/,
            importStatement
        )
    } else {
        return fileContent.replace(/import.*from.*vitest.*\n/, `$&${importStatement}\n`)
    }
}
```

### 8. Unnecessary Global Declarations

#### Detection Pattern

```typescript
// Pattern: Local global declarations that duplicate globals.ts
const globalDeclarationPattern = /declare\s+global\s*\{[\s\S]*?\}/g

// Detection Rules:
- Look for `declare global` statements in test files
- Flag any global declarations that duplicate what's in `globals.ts`
- Ensure global declarations are only in `globals.ts`
```

#### Auto-Fix Strategy

```typescript
const removeUnnecessaryGlobals = (fileContent: string): string => {
    return fileContent.replace(/declare\s+global\s*\{[\s\S]*?\}/g, '')
}
```

### 9. Mock Service Class Patterns

#### Detection Pattern

```typescript
// Pattern: Inconsistent mock class structure
const mockClassPattern = /class\s+Mock\w+\s*\{[\s\S]*?\}/g

// Detection Rules:
- Check mock class consistency
- Ensure all methods are properly mocked with `vi.fn()`
- Verify proper initialization patterns
```

#### Auto-Fix Strategy

```typescript
const standardizeMockClasses = (fileContent: string): string => {
    return fileContent.replace(/class\s+Mock(\w+)\s*\{([^}]*)\}/g, (match, className, body) => {
        const standardizedBody = body
            .replace(/(\w+)\s*=\s*vi\.fn\(\)/g, '$1 = vi.fn()')
            .replace(/(\w+)\s*=\s*vi\.fn\(\)/g, '$1 = vi.fn()')

        return `class Mock${className} {
    ${standardizedBody.trim()}
}`
    })
}
```

### 10. Test Structure Patterns

#### Detection Pattern

```typescript
// Pattern: Inconsistent test structure
const testStructurePattern = /describe\(['"][^'"]*['"],\s*\(\)\s*=>\s*\{[\s\S]*?\}\)/g

// Detection Rules:
- Check for consistent `mocks` variable declaration
- Verify proper `beforeEach` structure
- Ensure service instantiation follows patterns
```

#### Auto-Fix Strategy

```typescript
const standardizeTestStructure = (fileContent: string): string => {
    return fileContent.replace(
        /describe\(['"]([^'"]*)['"],\s*\(\)\s*=>\s*\{([\s\S]*?)\}/g,
        (match, testName, body) => {
            const standardizedBody = body
                .replace(/let\s+(\w+):\s*\w+/g, 'let $1: $2')
                .replace(
                    /let\s+mocks:\s*ReturnType<typeof\s+setupTestEnvironment>/g,
                    'let mocks: ReturnType<typeof setupTestEnvironment>'
                )

            return `describe('${testName}', () => {
    let service: SomeService
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
        resetAllMocks(mocks)
        setupFileSystemMocks(mocks)
        setupPathMocks(mocks)

        service = new SomeService(mocks.fileSystem as any, mocks.path as any)
    })

    ${standardizedBody}
})`
        }
    )
}
```

## Implementation Strategy

### Phase 1: Core Detection Engine

```typescript
interface ViolationDetector {
    detectViolations(filePath: string): Violation[]
    categorizeViolation(violation: Violation): ViolationCategory
    calculateSeverity(violation: Violation): SeverityLevel
}

interface Violation {
    type: string
    line: number
    column: number
    message: string
    suggestion: string
    autoFixable: boolean
}

enum ViolationCategory {
    DUPLICATE_MOCK_CLASS = 'duplicate_mock_class',
    INCORRECT_SETUP_ORDER = 'incorrect_setup_order',
    MISSING_HELPER_CALLS = 'missing_helper_calls',
    INCONSISTENT_SERVICE_INSTANTIATION = 'inconsistent_service_instantiation',
    DIRECT_GLOBAL_REFERENCES = 'direct_global_references',
    MISSING_SCENARIO_BUILDER = 'missing_scenario_builder',
    INCONSISTENT_IMPORTS = 'inconsistent_imports',
    UNNECESSARY_GLOBALS = 'unnecessary_globals',
    MOCK_CLASS_PATTERNS = 'mock_class_patterns',
    TEST_STRUCTURE_PATTERNS = 'test_structure_patterns',
}

enum SeverityLevel {
    CRITICAL = 'critical',
    HIGH = 'high',
    MEDIUM = 'medium',
    LOW = 'low',
}
```

### Phase 2: Auto-Fix Engine

```typescript
interface AutoFixEngine {
    applyFixes(violations: Violation[], fileContent: string): string
    validateFix(originalContent: string, fixedContent: string): boolean
    generateFixReport(violations: Violation[]): FixReport
}

interface FixReport {
    totalViolations: number
    fixedViolations: number
    failedFixes: number
    warnings: string[]
    suggestions: string[]
}
```

### Phase 3: Configuration Management

```typescript
interface AuditorConfig {
    enabledRules: ViolationCategory[]
    severityThresholds: Record<SeverityLevel, number>
    autoFixEnabled: boolean
    backupEnabled: boolean
    reportFormat: 'json' | 'markdown' | 'html'
    excludePatterns: string[]
    includePatterns: string[]
}

const defaultConfig: AuditorConfig = {
    enabledRules: Object.values(ViolationCategory),
    severityThresholds: {
        [SeverityLevel.CRITICAL]: 0,
        [SeverityLevel.HIGH]: 5,
        [SeverityLevel.MEDIUM]: 10,
        [SeverityLevel.LOW]: 20,
    },
    autoFixEnabled: true,
    backupEnabled: true,
    reportFormat: 'markdown',
    excludePatterns: ['**/node_modules/**', '**/dist/**'],
    includePatterns: ['**/*.test.ts', '**/__tests__/**/*.ts'],
}
```

## Usage Examples

### Command Line Interface

```bash
# Run auditor on specific file
npx test-structure-auditor --file packages/context-cherry-picker/core/__tests__/functional-tests/SomeService.test.ts

# Run auditor on entire package
npx test-structure-auditor --package packages/context-cherry-picker/core

# Run with auto-fix enabled
npx test-structure-auditor --fix --package packages/context-cherry-picker/core

# Generate detailed report
npx test-structure-auditor --report --format markdown --package packages/context-cherry-picker/core
```

### Programmatic Usage

```typescript
import { TestStructureAuditor } from './test-structure-auditor'

const auditor = new TestStructureAuditor({
    autoFixEnabled: true,
    backupEnabled: true,
    severityThresholds: {
        [SeverityLevel.CRITICAL]: 0,
        [SeverityLevel.HIGH]: 5,
    },
})

const results = await auditor.auditPackage('packages/context-cherry-picker/core')
console.log(`Found ${results.violations.length} violations`)
console.log(`Fixed ${results.fixedViolations.length} violations`)
```

## Integration with CI/CD

### Pre-commit Hook

```json
{
    "husky": {
        "hooks": {
            "pre-commit": "test-structure-auditor --package packages/context-cherry-picker/core --fail-on-critical"
        }
    }
}
```

### GitHub Actions

```yaml
name: Test Structure Audit
on: [push, pull_request]
jobs:
    audit:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v2
            - name: Run Test Structure Auditor
              run: |
                  npx test-structure-auditor --package packages/context-cherry-picker/core --report --format markdown
            - name: Upload Report
              uses: actions/upload-artifact@v2
              with:
                  name: test-structure-report
                  path: test-structure-report.md
```

## Monitoring and Metrics

### Key Metrics

- **Violation Density**: Violations per test file
- **Fix Success Rate**: Percentage of successfully auto-fixed violations
- **Rule Effectiveness**: Which rules catch the most violations
- **Trend Analysis**: Violation trends over time

### Dashboard Integration

```typescript
interface AuditMetrics {
    totalFiles: number
    totalViolations: number
    violationsByCategory: Record<ViolationCategory, number>
    violationsBySeverity: Record<SeverityLevel, number>
    fixSuccessRate: number
    averageViolationsPerFile: number
    trendData: TrendDataPoint[]
}

interface TrendDataPoint {
    date: string
    violations: number
    fixedViolations: number
    newViolations: number
}
```

## Conclusion

This structure auditor will ensure consistent adherence to the Enhanced Mock Strategy across all test files in the CCP package. By automating the detection and fixing of violations, we can maintain high code quality and reduce the cognitive load on developers when writing tests.

The auditor is designed to be:

- **Comprehensive**: Covers all identified violation patterns
- **Automated**: Provides auto-fix capabilities for common issues
- **Configurable**: Allows customization of rules and thresholds
- **Integrable**: Works with existing CI/CD pipelines
- **Maintainable**: Easy to extend with new rules and patterns
