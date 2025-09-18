# AI Comparator Package Framework - ULTRA OPTIMIZED

## PROCESSING DIRECTIVE

Read → Identify violations → Establish reference → Generate actions → Present decisions

## CORE OBJECTIVES

1. Violation Detection → Remediation actions
2. Reference Establishment → Alignment targets
3. Concrete Actions → Specific steps with success criteria
4. Decision Interface → Flattened multiselect (✅⚠️❌)

## EXECUTION PHASES

### PHASE 1: DEEP COMPREHENSION

**REQUIREMENT**: Complete Deep Comprehension for both packages before comparison
**DATA**: Package identity, architecture patterns, functionality, implementation, integration
**RETENTION**: Structured comprehension models for both packages

### PHASE 2: VIOLATION DETECTION

**TARGET VIOLATIONS**:

- Dependency classification violations (runtime deps in devDependencies)
- Architectural rule violations (VSCode value imports in core)
- Build configuration inconsistencies (non-standard executors)
- Testing standard violations (missing integration tests)
- Package structure violations (non-compliant organization)

**RETENTION**: Violation catalog with remediation requirements

### PHASE 3: REFERENCE ESTABLISHMENT

**CRITERIA**: Follows architectural rules, demonstrates best practices, comprehensive testing, proper dependencies, clean configuration
**RETENTION**: Reference catalog with alignment targets

### PHASE 4: ACTION GENERATION

**REQUIREMENTS**: Specific file changes, clear steps, success criteria, validation methods, priority classification
**RETENTION**: Action catalog with implementation details

### PHASE 5: DECISION INTERFACE

**FORMAT**: Flattened multiselect `✅⚠️❌` for each finding
**PURPOSE**: Quick visual decision-making interface

## ANALYSIS CHECKLIST

### CRITICAL DIFFERENCES

- [ ] Runtime Dependency Patterns
- [ ] Service Architecture Patterns
- [ ] Configuration Management Strategies
- [ ] Testing Complexity Patterns
- [ ] Adapter Architecture Differences

**REQUIRED**: Description, Result, Acceptability, Response

### CONFIGURATION FILES

- [ ] TypeScript Configuration (tsconfig.json)
- [ ] Package Configuration (package.json)
- [ ] Build Configuration (project.json)
- [ ] Testing Configuration (vitest.config.ts)
- [ ] Integration Test Configuration (tsconfig.test.json)

**REQUIRED**: Description, Deviations, Result, Acceptability, Response

### PATTERN DEVIATIONS

- [ ] Interface Organization Patterns
- [ ] Export Strategy Variations
- [ ] Configuration Structure Differences
- [ ] Testing Strategy Evolution
- [ ] Service Count and Complexity

**REQUIRED**: Description, Deviations, Result, Acceptability, Response

## ACCEPTABILITY CLASSIFICATION

- **✅ ACCEPTABLE**: No changes needed - both approaches valid
- **⚠️ IMPROVE {target package name}**: Target package should adopt better patterns
- **⚠️ IMPROVE {reference package name}**: Reference package should adopt better patterns

## OUTPUT TEMPLATE

```markdown
# COMPARISON FINDINGS - {YYYY-MM-DD HH:MM:SS}

**Packages**: {PackageA} vs {PackageB}

## Critical Architectural Differences

### 1. {Difference Name}

- **{PackageA}**: {description}
- **{PackageB}**: {description}
- **Result**: {analysis}
- **Acceptability**: {✅ ACCEPTABLE | ⚠️ SHOULD IMPROVE | ✅ SHOULD ADOPT}
- **Response**: ✅⚠️❌

## Recommendations

### Immediate Remediation

1. **{Action}**: {specific steps}

### Preservation

1. **{Pattern}**: {justification}

### Alignment Standards

**Reference**: {compliant package}
**Target**: {package needing alignment}
**Action**: {specific remediation}
**Success**: {completion metrics}
```

## MEMORY PATTERNS

1. **Violation Catalog**: Violation → Impact → Remediation
2. **Reference Catalog**: Pattern → Implementation → Quality
3. **Action Catalog**: Issue → Steps → Success Criteria
4. **Alignment Map**: Current → Target → Actions
