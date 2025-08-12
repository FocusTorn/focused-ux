# Structure Auditor

A comprehensive validation tool for the F-UX monorepo that ensures all packages follow the established architectural patterns and best practices.

## Overview

The Structure Auditor is a TypeScript-based validation tool that performs extensive checks on the monorepo structure, configuration files, and code patterns. It helps maintain consistency across all packages and prevents common issues that could break builds or cause runtime problems.

## Features

- **Comprehensive Validation**: Checks package.json, project.json, tsconfig.json, and source code
- **Precise Error Reporting**: All errors include exact line and column numbers for quick fixes
- **Smart Dependency Analysis**: Validates dependency placement and usage in code
- **Architecture Enforcement**: Ensures packages follow the established core/ext pattern
- **VS Code Extension Compliance**: Validates VS Code extension-specific requirements

## Usage

### Running the Auditor

```bash
# Audit all packages
npx tsx libs/tools/structure-auditor/src/main.ts

# Audit a specific package
npx tsx libs/tools/structure-auditor/src/main.ts <package-name>

# Using Nx (if configured)
pnpm nx run structure-auditor:audit

# Warn-only mode (never exit non-zero)
npx tsx libs/tools/structure-auditor/src/main.ts --warn-only
pnpm nx run structure-auditor:audit:warn
```

### Example Output

```
Auditing:
  - ai-agent-interactor
  - context-cherry-picker
  - dynamicons
  - ghost-writer
  - note-hub
  - project-butler

Incorrect Dependency Placement:
    ai-agent-interactor/ext/package.json:17:9: '@fux/ai-agent-interactor-core' should be in 'dependencies', not 'devDependencies'.
    ghost-writer/ext/package.json:16:9: '@fux/ghost-writer-core' should be in 'dependencies', not 'devDependencies'.

Incorrect tsconfig.lib.json paths:
    ghost-writer/core/tsconfig.lib.json:12:9: The 'paths' configuration does not match the package's dependencies.

Unused Dependency:
    dynamicons/ext/package.json:29:9: '@fux/shared' in 'dependencies' is not imported in the code.
```

## Validation Checks

### Package.json Validation

#### Extension Dependencies

- **Core Package Dependencies**: Ensures `@fux/{package}-core` is properly declared in `dependencies` (not `devDependencies`) when imported
- **Shared Package Dependencies**: Ensures `@fux/shared` is properly declared in `dependencies` when imported
- **Runtime Dependency Chain**: Analyzes the full dependency chain from core packages to detect missing runtime dependencies that could cause "Cannot find module" errors
- **Unused Dependencies**: Flags dependencies declared in `package.json` but not imported in the extension code
- **Forbidden Dependencies**: Prevents use of specific packages (e.g., `picomatch`, `tslib`)

#### Forbidden Dependencies (`checkNoUnusedDeps`)

- **Blocked Packages**: Prevents `picomatch` and `tslib` from being included
- **Rationale**: These packages are bundled by the build system

#### VS Code Engine Version (`checkVSCodeEngineVersion`)

- **Minimum Version**: Requires `^1.99.3` or higher
- **Format Validation**: Ensures proper semver format with caret prefix
- **Compatibility**: Ensures extensions work with current VS Code versions

#### Package Version Format (`checkPackageVersionFormat`)

- **Semver Compliance**: Validates proper semantic versioning format
- **Dev Version Block**: Prevents `dev.` in version strings
- **Format Examples**: Accepts `1.0.0`, `1.0.0-beta.1`, rejects `1.0.0-dev.1`

### Project.json Validation

#### Build Target Configuration (`checkProjectJsonExt`)

- **Executor Validation**: Ensures build target uses `@nx/esbuild:esbuild`
- **No Extends**: Prevents use of `extends` in build targets for clarity
- **Target Presence**: Validates build target exists

#### Packaging Targets (`checkProjectJsonPackaging`)

- **Package:Dev Target**: Validates development packaging command
- **Package Target**: Validates production packaging command
- **Obsolete Targets**: Identifies and flags obsolete `copy-assets` targets

#### External Dependencies (`checkProjectJsonExtExternals`)

- **VS Code External**: Ensures `vscode` is in external array
- **Third-party Dependencies**: Validates all package.json dependencies are externalized
- **Array Format**: Ensures external is properly configured as an array

#### External Consistency (`checkProjectJsonExternalsConsistency`)

- **Core/Ext Alignment**: Ensures core and extension externals are consistent
- **Dependency Tracking**: Prevents missing externals between core and extension

### TypeScript Configuration Validation

#### Extension tsconfig.json (`checkTsconfigExt`)

- **Canonical Structure**: Validates against established tsconfig structure
- **No Lib Config**: Ensures `tsconfig.lib.json` doesn't exist in extensions
- **Reference Validation**: Validates references point to correct lib configs

#### Core tsconfig.json (`checkTsconfigCore`)

- **Composite Mode**: Ensures `composite: true` is set
- **Lib Config**: Validates `tsconfig.lib.json` composite setting if present

#### Shared Library (`checkTsconfigShared`)

- **Global Validation**: Checks shared library TypeScript configuration
- **Composite Requirements**: Ensures proper composite mode settings

#### Path Mapping (`checkTsconfigLibPaths`)

- **Dependency Paths**: Validates path mappings match package dependencies
- **Auto-generation**: Ensures paths are correctly configured for `@fux/` packages

### Source Code Validation

#### Required Files (`checkRequiredExtFiles`)

- **Extension Files**: Validates presence of `LICENSE.txt`, `README.md`, `.vscodeignore`
- **VS Code Compliance**: Ensures extensions have required metadata files

#### Dynamic Imports (`checkNoDynamicImports`)

- **Static Analysis**: Scans for `await import()` patterns
- **Build Compatibility**: Prevents dynamic imports that could break bundling
- **Performance**: Ensures optimal bundle generation

## Error Categories

### Dependencies

- **Unused Dependency**: Dependencies declared but not imported in code
- **Missing Runtime Dependency**: Runtime dependencies used in dependency chain but not declared
- **Incorrect Runtime Dependency Placement**: Runtime dependencies in wrong section (devDependencies vs dependencies)
- **Missing Dependency**: Required dependencies not declared
- **Incorrect Dependency Placement**: Dependencies in wrong section (devDependencies vs dependencies)
- **Forbidden dependency**: Use of prohibited packages

### Configuration Issues

- **Invalid tsconfig.json**: Non-canonical TypeScript configuration
- **Incorrect tsconfig.lib.json paths**: Path mappings don't match dependencies
- **Missing composite: true**: Required TypeScript project references setting
- **Invalid project.json**: Incorrect Nx project configuration

### Build and Packaging

- **Invalid Externals**: Missing or incorrect external dependency configuration
- **Inconsistent Externals**: Mismatch between core and extension externals
- **Missing Targets**: Required Nx build or packaging targets
- **Incorrect Commands**: Wrong packaging or build commands

### Code Quality

- **Disallowed dynamic import**: Dynamic imports that could break bundling
- **Missing required file**: Required extension metadata files

### VS Code Extension Compliance

- **Missing VSCode engine**: Required VS Code engine specification
- **Invalid VSCode engine version**: Incorrect or outdated engine version
- **Improper semver format**: Non-standard version format

## Architecture Requirements

The auditor enforces the following architectural patterns:

### Package Structure

```
packages/{package}/
├── core/           # Core library (shared logic)
│   ├── src/
│   ├── package.json
│   ├── project.json
│   └── tsconfig.json
└── ext/            # VS Code extension
    ├── src/
    ├── assets/
    ├── package.json
    ├── project.json
    └── tsconfig.json
```

### Dependency Flow

- **Core → Shared**: Core packages can depend on `@fux/shared`
- **Extension → Core**: Extensions must depend on their core package
- **Extension → Shared**: Extensions can depend on `@fux/shared`
- **No Reverse**: Core packages cannot depend on extensions

### Build Configuration

- **Core**: Built as library with composite TypeScript projects
- **Extension**: Built as VS Code extension with esbuild
- **Externals**: All third-party dependencies externalized
- **Bundling**: Static imports only, no dynamic imports

## Integration

### CI/CD

The auditor is designed to run in CI/CD pipelines and will exit with code 1 if any errors are found, making it suitable for automated validation.

### Pre-commit Hooks

Consider integrating the auditor into pre-commit hooks to catch issues before they reach the repository.

### IDE Integration

The precise line and column numbers make it easy to integrate with IDE error reporting systems.

## Contributing

When adding new validation rules:

1. **Create Check Function**: Add new check function in appropriate module
2. **Import in Main**: Add the check to the main validation loop
3. **Add Documentation**: Update this README with the new check details
4. **Test Thoroughly**: Ensure the check works with existing packages

### Error Message Guidelines

- Always include line and column numbers using `findJsonLocation`
- Use descriptive error categories
- Provide actionable error messages
- Include context about why the check exists

## Troubleshooting

### Common Issues

**"Missing dependency" but it's declared**

- Check if the dependency is actually imported in the code
- Verify the dependency name matches exactly

**"Incorrect tsconfig.lib.json paths"**

- Ensure all `@fux/` dependencies have corresponding path mappings
- Check that paths point to the correct source directories

**"Invalid externals"**

- Verify all third-party dependencies from package.json are in the external array
- Ensure `vscode` is included in externals

### Debug Mode

For detailed debugging, you can modify the source code to add console.log statements or run individual check functions directly.

## License

This tool is part of the F-UX project and follows the same licensing terms.
