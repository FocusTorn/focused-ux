# Observability Test Source

This directory contains a functional observability system implementation that serves as test source code for the tool generator.

## Purpose

This implementation demonstrates:

- Structured logging with different log levels
- Metrics collection and reporting
- Error tracking and reporting
- Health check functionality
- CLI interface with configuration management
- Comprehensive test coverage

## Structure

```
_test-source/observability/
├── README.md                    # This file
├── src/                         # Source code to copy into generated tool
│   ├── index.ts                # Main exports
│   ├── lib/                    # Core functionality
│   │   ├── logger.ts           # Structured logging
│   │   ├── metrics.ts          # Metrics collection
│   │   ├── error-tracker.ts    # Error tracking
│   │   └── health-check.ts     # Health monitoring
│   └── cli/                    # CLI interface
│       └── index.ts            # CLI entry point
├── config/                      # Configuration files
│   ├── default-config.json     # Default configuration
│   └── schema.json             # Configuration schema
└── expected-output/             # Expected generated structure
    └── structure.md            # Expected file structure
```

## Usage

1. **Generate tool package**:

    ```bash
    nx g ./generators:tool observability --description="Comprehensive observability system"
    ```

2. **Copy test source**:

    ```bash
    cp -r _test-source/observability/src/* libs/tools/observability/src/
    cp -r _test-source/observability/config/* libs/tools/observability/
    ```

3. **Test functionality**:
    ```bash
    nx build @fux/observability
    nx test @fux/observability
    ```

## Features

### Logging

- Structured JSON logging
- Multiple log levels (debug, info, warn, error)
- Configurable output formats
- Log rotation and retention

### Metrics

- Counter, gauge, and histogram metrics
- Prometheus-compatible output
- Custom metric types
- Metric aggregation

### Error Tracking

- Error capture and reporting
- Stack trace analysis
- Error categorization
- Integration with logging

### Health Checks

- Service health monitoring
- Dependency health checks
- Custom health check endpoints
- Health status reporting

### CLI Interface

- Configuration management
- Log level control
- Metrics export
- Health check commands

## Testing

This implementation includes:

- Unit tests for all components
- Integration tests for CLI
- Performance benchmarks
- Configuration validation tests

## Cleanup

After testing, remove the generated package:

```bash
rm -rf libs/tools/observability
```
