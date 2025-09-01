# Expected Generated Structure

This document outlines the expected structure when the tool generator creates an observability package.

## Generated Package Structure

```
libs/tools/observability/
├── package.json                 # ESM package configuration
├── project.json                 # Nx project configuration
├── tsconfig.json               # TypeScript configuration
├── tsconfig.lib.json           # Library TypeScript configuration
├── vitest.config.ts            # Main test configuration
├── vitest.coverage.config.ts   # Coverage test configuration
├── README.md                   # Package documentation
├── src/                        # Source code (after copying test source)
│   ├── index.ts               # Main exports
│   ├── lib/                   # Core functionality
│   │   ├── logger.ts          # Structured logging
│   │   ├── metrics.ts         # Metrics collection
│   │   ├── error-tracker.ts   # Error tracking
│   │   └── health-check.ts    # Health monitoring
│   └── cli/                   # CLI interface
│       └── index.ts           # CLI entry point
└── __tests__/                 # Test structure
    ├── _setup.ts              # Test setup
    ├── README.md              # Test documentation
    ├── _reports/              # Test reports
    │   └── coverage/          # Coverage reports
    ├── isolated-tests/        # Unit tests
    ├── functional-tests/      # Integration tests
    └── coverage-tests/        # Coverage tests
```

## Key Files

### package.json

- ESM format (`"type": "module"`)
- Minimal dependencies
- Proper exports configuration
- Build, test, and lint scripts

### project.json

- Nx project configuration
- Build target with esbuild
- Test target with vitest
- Lint target with eslint
- Audit target for validation

### tsconfig.json

- Extends workspace base configuration
- Declaration generation enabled
- Proper include/exclude patterns

### vitest.config.ts

- Node environment
- Global test setup
- Proper include/exclude patterns
- Coverage configuration

### src/index.ts

- Main package exports
- Clean API surface
- TypeScript declarations

## Validation Checklist

After generation and test source implantation:

- [ ] Package builds successfully (`nx build @fux/observability`)
- [ ] Tests pass (`nx test @fux/observability`)
- [ ] Linting passes (`nx lint @fux/observability`)
- [ ] CLI works (`node libs/tools/observability/src/cli/index.js`)
- [ ] All imports resolve correctly
- [ ] TypeScript compilation succeeds
- [ ] Coverage meets thresholds
- [ ] Documentation is clear and complete

## Integration Points

The generated package should integrate with:

- **Nx workspace**: Appears in project graph
- **Build system**: Uses workspace build targets
- **Testing framework**: Uses workspace test configuration
- **Linting**: Uses workspace ESLint configuration
- **Package management**: Works with pnpm workspace

## Cleanup

After validation, the test package should be removed:

```bash
rm -rf libs/tools/observability
```

This ensures the workspace remains clean and the generator can be tested again in the future.
