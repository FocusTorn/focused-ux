# FocusedUX Generators - Functional Testing Guide

## Overview

This directory contains Nx generators designed to create architecture-compliant packages that work immediately after generation. Each generator includes functional test source code in the `_test-source/` directory to validate that the generated structure works correctly.

## Goal

**Create generators (tool, lib, core, ext) with actual functional source code contained in `_test-source/` to be implanted into the generated structure, ensuring they work as expected right out of the box.**

## Generator Philosophy

### 1. **Functional by Default**

- Every generated package should build, test, and run immediately
- No placeholder code or TODO comments
- Real, working implementations that demonstrate the package's purpose

### 2. **Test-Driven Development**

- Use `_test-source/` directory to store functional implementations
- Copy real source code into generated packages during testing
- Validate that generated packages work with actual code

### 3. **Architecture Compliance**

- Follow established patterns from `docs/Architecture.md`
- Ensure generated packages integrate properly with the workspace
- Maintain consistency across all package types

## Directory Structure

```
generators/
├── README.md                    # This guide
├── collection.json              # Generator collection configuration
├── package.json                 # Collection metadata
├── tool/                        # Tool package generator
│   ├── generator.ts
│   ├── schema.json
│   ├── schema.d.ts
│   └── files/                   # Template files
├── lib/                         # Library package generator
├── core/                        # Core package generator
├── ext/                         # Extension package generator
└── test-scaffold/               # Test structure generator

_test-source/                    # Functional test implementations
├── observability/               # Test implementation for observability tool
│   ├── src/                     # Source code to copy into generated tool
│   ├── config/                  # Configuration files
│   └── expected-output/         # Expected generated structure
├── example-core/                # Test implementation for core package
├── example-ext/                 # Test implementation for extension package
└── example-lib/                 # Test implementation for library package
```

## Generator Types

### 1. Tool Generator (`tool/`)

**Purpose**: Generate standalone utility packages in `libs/tools/`

**Test Implementation**: `_test-source/observability/`

- Comprehensive observability system
- Structured logging, metrics collection, error tracking
- CLI interface with configuration management
- Full test suite with coverage

**Generated Structure**:

```
libs/tools/{name}/
├── package.json                 # ESM package with minimal dependencies
├── project.json                 # Nx project configuration
├── tsconfig.json               # TypeScript configuration
├── vitest.config.ts            # Test configuration
├── README.md                   # Documentation
├── src/
│   ├── index.ts                # Main exports
│   ├── lib/                    # Core functionality
│   └── cli/                    # CLI interface (optional)
└── __tests__/                  # Comprehensive test structure
    ├── _setup.ts
    ├── isolated-tests/
    ├── functional-tests/
    └── coverage-tests/
```

### 2. Core Generator (`core/`)

**Purpose**: Generate pure business logic packages in `packages/{feature}/core/`

**Test Implementation**: `_test-source/example-core/`

- Self-contained business logic
- No VSCode dependencies
- Asset generation capabilities
- Pure TypeScript/JavaScript

**Generated Structure**:

```
packages/{feature}/core/
├── package.json                 # Pure business logic package
├── project.json                 # Build and test targets
├── src/
│   ├── index.ts                # Main exports
│   ├── services/               # Business logic services
│   └── scripts/                # Asset generation scripts
└── __tests__/                  # Unit and integration tests
```

### 3. Extension Generator (`ext/`)

**Purpose**: Generate VSCode extension packages in `packages/{feature}/ext/`

**Test Implementation**: `_test-source/example-ext/`

- VSCode integration wrapper
- CommonJS bundling
- Local adapters pattern
- Integration testing setup

**Generated Structure**:

```
packages/{feature}/ext/
├── package.json                 # VSCode extension manifest
├── project.json                 # Extension build configuration
├── src/
│   ├── extension.ts            # Main extension entry point
│   └── adapters/               # VSCode API adapters
└── __tests__/                  # Extension-specific tests
```

### 4. Library Generator (`lib/`)

**Purpose**: Generate shared utility libraries in `libs/`

**Test Implementation**: `_test-source/example-lib/`

- Reusable utility functions
- No external dependencies
- Pure functions with clear contracts
- Comprehensive documentation

**Generated Structure**:

```
libs/{name}/
├── package.json                 # Shared utility package
├── project.json                 # Library configuration
├── src/
│   ├── index.ts                # Main exports
│   └── utils/                  # Utility functions
└── __tests__/                  # Unit tests
```

## Testing Workflow

### 1. **Prepare Test Source**

```bash
# Create test implementation in _test-source/
mkdir -p _test-source/{package-name}
# Add functional source code, config files, etc.
```

### 2. **Test Generator with Dry Run**

```bash
# Test generator without making changes
nx g ./generators:tool test-package --dryRun

# Verify generated structure matches expectations
# Check that all templates are correctly applied
```

### 3. **Generate Package**

```bash
# Generate actual package
nx g ./generators:tool test-package --description="Test package"
```

### 4. **Implant Test Source**

```bash
# Copy functional source code into generated package
cp -r _test-source/{package-name}/src/* libs/tools/test-package/src/
cp -r _test-source/{package-name}/config/* libs/tools/test-package/
```

### 5. **Validate Functionality**

```bash
# Build the generated package
nx build @fux/test-package

# Run tests
nx test @fux/test-package

# Verify it works as expected
```

### 6. **Clean Up**

```bash
# Remove test package after validation
rm -rf libs/tools/test-package
```

## Test Source Requirements

### Functional Source Code

- **Real implementations** - No placeholder code
- **Working examples** - Demonstrates package capabilities
- **Proper structure** - Follows established patterns
- **Complete features** - Shows full functionality

### Configuration Files

- **Build configuration** - Proper Nx targets
- **Test configuration** - Vitest setup
- **TypeScript config** - Correct compiler options
- **Package metadata** - Proper dependencies and scripts

### Documentation

- **README templates** - Clear usage instructions
- **API documentation** - Function signatures and examples
- **Architecture notes** - Package design decisions

## Validation Checklist

### Before Committing Generator Changes

- [ ] **Generator runs successfully** - No errors during generation
- [ ] **Templates are complete** - All necessary files included
- [ ] **Schema validation works** - Proper input validation
- [ ] **Workspace integration** - Package appears in Nx graph
- [ ] **Build succeeds** - Generated package builds without errors
- [ ] **Tests pass** - All tests run successfully
- [ ] **Functionality works** - Package performs its intended purpose
- [ ] **Documentation is clear** - README and comments are helpful

### Test Source Validation

- [ ] **Source code is functional** - Implements real features
- [ ] **No external dependencies** - Self-contained where possible
- [ ] **Follows patterns** - Consistent with existing packages
- [ ] **Well-documented** - Clear comments and examples
- [ ] **Testable** - Includes unit and integration tests

## Best Practices

### Generator Development

1. **Start with test source** - Create functional implementation first
2. **Test thoroughly** - Use dry runs and manual validation
3. **Follow patterns** - Reuse successful approaches
4. **Document everything** - Clear guides and examples
5. **Validate integration** - Ensure workspace compatibility

### Test Source Management

1. **Keep implementations simple** - Focus on core functionality
2. **Use realistic examples** - Demonstrate real use cases
3. **Maintain consistency** - Follow established conventions
4. **Update regularly** - Keep test source current
5. **Version control** - Track changes to test implementations

## Troubleshooting

### Common Issues

**Generator not found**

- Check `collection.json` configuration
- Verify `defaultCollection` in `package.json`
- Use full path: `nx g ./generators:generator-name`

**Template variables not resolved**

- Ensure `generateFiles` includes all variables
- Check template file naming (`__tmpl__` suffix)
- Verify `names()` function usage

**Generated package doesn't build**

- Check `project.json` configuration
- Verify dependencies in `package.json`
- Ensure TypeScript configuration is correct

**Test source doesn't work**

- Validate source code independently
- Check for missing dependencies
- Verify file structure matches templates

## Future Enhancements

### Planned Improvements

1. **Automated testing** - Scripts to validate generators
2. **More test sources** - Additional functional examples
3. **Template validation** - Automated template checking
4. **Integration testing** - End-to-end generator validation
5. **Documentation generation** - Auto-generated usage guides

### Generator Extensions

1. **Custom templates** - Project-specific variations
2. **Conditional generation** - Feature flags for optional components
3. **Post-generation hooks** - Automated setup tasks
4. **Validation rules** - Custom schema validation
5. **Migration helpers** - Update existing packages

## Resources

- [Nx Generators Documentation](https://nx.dev/recipes/generators)
- [Workspace Architecture Guide](../docs/Architecture.md)
- [Testing Strategy Guide](../docs/FocusedUX-Testing-Strategy.md)
- [Package-Specific Details](../docs/Package-Specific-Details.md)

---

**Remember**: The goal is to create generators that produce working packages immediately. Every generated package should be functional, testable, and ready for development.
