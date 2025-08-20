# Project Maid Core - Architecture Plan

## Goal

Transform the monolithic Project Maid All package into a proper core/ext architecture where the core package contains all business logic in separate, maintainable services, following the established FocusedUX patterns.

## Current State

- **Source**: `packages/project-maid/all/src/extension.ts` contains all logic (282 lines)
- **Pattern**: Direct VSCode integration with business logic mixed in
- **Dependencies**: Only `js-yaml` for configuration parsing

## Target State

- **Architecture**: Pure business logic with dependency injection
- **Services**: Each feature split into its own service
- **Dependencies**: Injected via DI container (no direct VSCode imports)
- **Testing**: Comprehensive unit tests with proper mocking

## Features to Extract

### 1. Package.json Formatting Service

- **Current**: `formatPackageJson()` function (lines ~50-150)
- **Responsibilities**:
    - Read `.FocusedUX` configuration
    - Parse YAML configuration
    - Validate package.json structure
    - Reorder keys according to configuration
    - Handle unknown keys with warnings
- **Dependencies**: `js-yaml`, file system operations
- **Interface**: `IPackageJsonFormattingService`

### 2. Terminal Management Service

- **Current**: `updateTerminalPath()` function (lines ~180-200)
- **Responsibilities**:
    - Determine target directory from file/folder
    - Generate CD commands
    - Handle terminal creation/activation
- **Dependencies**: File system operations, terminal operations
- **Interface**: `ITerminalManagementService`

### 3. Backup Management Service

- **Current**: `createBackup()` function (lines ~210-250)
- **Responsibilities**:
    - Generate backup file names (.bak, .bak2, etc.)
    - Check for existing backups
    - Copy files to backup locations
- **Dependencies**: File system operations
- **Interface**: `IBackupManagementService`

### 4. Poetry Shell Service

- **Current**: `enterPoetryShell()` function (lines ~260-282)
- **Responsibilities**:
    - Determine target directory
    - Generate poetry shell commands
    - Handle terminal creation
- **Dependencies**: File system operations, terminal operations
- **Interface**: `IPoetryShellService`

## Service Architecture

### Core Services

```
services/
├── PackageJsonFormatting.service.ts
├── TerminalManagement.service.ts
├── BackupManagement.service.ts
├── PoetryShell.service.ts
└── ProjectMaidManager.service.ts  # Orchestrator service
```

### Interfaces

```
_interfaces/
├── IPackageJsonFormattingService.ts
├── ITerminalManagementService.ts
├── IBackupManagementService.ts
├── IPoetryShellService.ts
└── IProjectMaidManagerService.ts
```

### Models

```
models/
├── PackageJsonConfig.ts
├── TerminalCommand.ts
├── BackupOptions.ts
└── PoetryShellOptions.ts
```

## Dependency Injection Setup

### Container Configuration

- Use `awilix` for DI (following established patterns)
- Register all services as factories
- Inject dependencies through constructor parameters
- No direct VSCode imports in core package

### Service Dependencies

- **PackageJsonFormatting**: File system adapter, YAML parser
- **TerminalManagement**: File system adapter, terminal adapter
- **BackupManagement**: File system adapter
- **PoetryShell**: File system adapter, terminal adapter
- **ProjectMaidManager**: All above services

## Testing Strategy

### Unit Tests

- Test each service in isolation
- Mock all external dependencies
- Test error conditions and edge cases
- Achieve 100% coverage for business logic

### Test Structure

```
__tests__/
├── _setup.ts
├── unit/
│   ├── PackageJsonFormatting.service.test.ts
│   ├── TerminalManagement.service.test.ts
│   ├── BackupManagement.service.test.ts
│   └── PoetryShell.service.test.ts
└── integration/
    └── ProjectMaidManager.service.test.ts
```

## TODO List

### Phase 1: Foundation Setup

- [x] Create core package structure
- [x] Set up package.json and project.json
- [x] Create tsconfig.lib.json
- [ ] Set up DI container configuration
- [ ] Create base interfaces for all services
- [ ] Set up test infrastructure

### Phase 2: Service Extraction

- [ ] Extract PackageJsonFormatting service
- [ ] Extract TerminalManagement service
- [ ] Extract BackupManagement service
- [ ] Extract PoetryShell service
- [ ] Create ProjectMaidManager orchestrator service

### Phase 3: Testing & Validation

- [ ] Write unit tests for each service
- [ ] Write integration tests for manager service
- [ ] Achieve 100% test coverage
- [ ] Validate all business logic works correctly

### Phase 4: Integration Preparation

- [ ] Export all services from index.ts
- [ ] Create DI container factory function
- [ ] Document service interfaces and usage
- [ ] Prepare for extension package integration

## Success Criteria

1. **Architectural Compliance**: All business logic in core, no VSCode imports
2. **Service Separation**: Each feature in its own service with clear interfaces
3. **Test Coverage**: 100% coverage for all business logic
4. **DI Compliance**: All services properly injected via container
5. **Maintainability**: Clear separation of concerns, easy to extend

## Notes

- This is the "guinea pig" package, so no shared library dependencies
- All VSCode operations will be abstracted through adapters in the ext package
- Focus on clean, testable business logic
- Follow established patterns from Context Cherry Picker core
