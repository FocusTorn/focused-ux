# PAX Testing Documentation

This directory contains comprehensive tests for the Project Alias Expander (PAX) tool following the FocusedUX Testing Strategy.

## Test Structure

### Functional Tests (`functional/`)
- **Purpose**: Test core CLI functionality and business logic
- **Scope**: Configuration loading, alias resolution, target expansion, flag expansion
- **Environment**: Isolated test environment with mocked dependencies

### Isolated Tests (`isolated-tests/`)
- **Purpose**: Test specific isolated functionality
- **Scope**: Individual functions and edge cases
- **Environment**: Highly controlled test environment

### Coverage Tests (`coverage/`)
- **Purpose**: Generate and analyze test coverage reports
- **Scope**: Coverage analysis and reporting
- **Environment**: Coverage-enabled test runs

## Test Categories

### 1. Configuration Management
- Loading and parsing `config.json`
- Handling missing or invalid configuration files
- JSON comment stripping functionality

### 2. Alias Resolution
- Simple string alias resolution
- Object-based alias resolution with suffixes
- Integration test routing logic
- Full package semantics

### 3. Target Expansion
- Target shortcut expansion (`b` → `build`)
- Unknown target handling
- Multi-word target expansion

### 4. Flag Expansion
- Single flag expansion (`-f` → `--fix`)
- Bundled flag expansion (`-fs` → `--fix --skip-nx-cache`)
- Unknown flag handling

### 5. PowerShell Module Generation
- Module content generation
- Directory creation
- File writing operations
- Export statement generation

### 6. Command Execution
- Nx command execution
- Non-Nx command execution
- Echo mode functionality
- Error handling

### 7. Multi-Project Operations
- Extension package operations (`ext`)
- Core package operations (`core`)
- All package operations (`all`)

## Test Execution

### Standard Tests
```bash
# Run functional tests
nx test project-alias-expander

# Run with PAX aliases
pax test
```

### Full Test Suite
```bash
# Run entire dependency chain
nx test:full project-alias-expander

# Run with PAX aliases
pax test:full
```

### Coverage Tests
```bash
# Run with coverage
nx run project-alias-expander:test --coverage

# Run with PAX aliases
pax tc
```

## Mocking Strategy

### External Dependencies
- **`strip-json-comments`**: Mocked for JSON parsing tests
- **`fs`**: Mocked for file system operations
- **`path`**: Mocked for path manipulation
- **`process`**: Mocked for environment and process control
- **`child_process`**: Mocked for command execution

### Test Helpers
- **`setupTestEnvironment()`**: Creates mock instances
- **`resetAllMocks()`**: Cleans up mocks between tests
- **`setupFileSystemMocks()`**: Configures file system mocks
- **`setupPathMocks()`**: Configures path manipulation mocks

## Quality Gates

- [ ] All configuration loading scenarios tested
- [ ] All alias resolution patterns tested
- [ ] All target expansion scenarios tested
- [ ] All flag expansion patterns tested
- [ ] PowerShell module generation tested
- [ ] Command execution tested
- [ ] Multi-project operations tested
- [ ] Error handling tested
- [ ] Edge cases covered
- [ ] 100% test coverage for business logic

## Test Data

### Sample Configuration
```json
{
    "targets": {
        "b": "build",
        "t": "test",
        "l": "lint"
    },
    "packages": {
        "test": "test-package",
        "pbc": {
            "name": "project-butler",
            "suffix": "core"
        }
    }
}
```

### Test Scenarios
- Valid configuration loading
- Invalid JSON handling
- Missing file handling
- Empty configuration handling
- Complex alias resolution
- Multi-word target expansion
- Bundled flag expansion
- PowerShell module generation
- Command execution simulation
