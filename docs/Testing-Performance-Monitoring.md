# Testing Performance Monitoring

## Overview

The FocusedUX workspace includes a comprehensive performance monitoring system for test execution that helps developers identify performance regressions, track improvements, and maintain optimal test execution times. This system integrates seamlessly with the existing PAE CLI tool and provides actionable insights for performance optimization.

## Features

- **Baseline Establishment**: Create performance baselines for test targets
- **Regression Detection**: Automatically detect performance regressions
- **Memory Monitoring**: Track memory usage during test execution
- **Build Time Analysis**: Monitor build dependency performance
- **Actionable Recommendations**: Get specific suggestions for performance improvements
- **Historical Tracking**: Maintain performance history for trend analysis

## Quick Start

### 1. Establish Baseline

Create a performance baseline for a project's test target:

```bash
# Create baseline for shared library tests
pae shared test --performance-baseline

# Create baseline for coverage tests
pae shared tc --performance-baseline

# Create baseline for extension tests
pae gwe test --performance-baseline
```

### 2. Monitor Performance

Check current performance against established baseline:

```bash
# Quick performance check
pae shared test --performance-check

# Validate performance with detailed analysis
pae shared test --performance-validate
```

### 3. Monitor All Projects

Check performance across all projects:

```bash
# Check all core packages
pae core test --performance-check

# Check all extension packages
pae ext test --performance-check

# Check everything
pae all test --performance-check
```

## Performance Metrics

The system tracks the following key metrics:

### Core Metrics

- **Duration**: Total test execution time in milliseconds
- **Memory Peak**: Peak memory usage during test execution (MB)
- **Test Count**: Number of tests executed
- **Build Time**: Time spent on build dependencies
- **Coverage Time**: Time spent generating coverage reports

### Derived Metrics

- **Duration Deviation**: Percentage change from baseline
- **Memory Deviation**: Percentage change in memory usage
- **Build Time Deviation**: Percentage change in build time

## Performance Status

The system categorizes performance into four status levels:

| Status             | Emoji | Description               | Action Required            |
| ------------------ | ----- | ------------------------- | -------------------------- |
| `within_threshold` | ✅    | Performance is acceptable | None                       |
| `regression`       | ⚠️    | Performance has degraded  | Investigate and optimize   |
| `improvement`      | 🚀    | Performance has improved  | Consider updating baseline |
| `no_baseline`      | ❓    | No baseline available     | Create baseline first      |

## Thresholds

Default performance thresholds (configurable in baseline files):

- **Duration**: 20% increase allowed
- **Memory Peak**: 30% increase allowed
- **Build Time**: 25% increase allowed

## Usage Examples

### Establishing Baselines

```bash
# Create baseline for functional tests
pae shared test --performance-baseline

# Create baseline for coverage tests
pae shared tc --performance-baseline

# Create baseline for specific package
pae gwc test --performance-baseline
```

### Daily Performance Monitoring

```bash
# Quick check before committing
pae shared test --performance-check

# Comprehensive validation
pae shared test --performance-validate

# Check all core packages
pae core test --performance-check
```

### CI/CD Integration

```bash
# Performance gate in CI pipeline
pae all test --performance-validate

# Baseline update after optimizations
pae all test --performance-baseline
```

## Output Interpretation

### Performance Report Example

```
📊 Performance Report
==================================================
Project: @fux/shared
Target: test
Timestamp: 2024-12-27T18:30:00.000Z

📈 Metrics:
  Duration: 5820ms
  Memory Peak: 156.20MB
  Test Count: 82

📊 Analysis:
  Duration Deviation: 0.3%
  Memory Deviation: 2.1%
  Build Time Deviation: -1.5%
  Status: ✅ within_threshold

💡 Recommendations:
  • Performance is within acceptable thresholds.
```

### Regression Detection

```
📊 Performance Report
==================================================
Project: @fux/shared
Target: test
Timestamp: 2024-12-27T18:30:00.000Z

📈 Metrics:
  Duration: 7200ms
  Memory Peak: 180.50MB
  Test Count: 82

📊 Analysis:
  Duration Deviation: 23.7%
  Memory Deviation: 15.6%
  Build Time Deviation: 5.2%
  Status: ⚠️ regression

💡 Recommendations:
  • Test execution time increased by 23.7% (threshold: 20%). Consider splitting large test files or optimizing test setup.
  • Memory usage increased by 15.6% (threshold: 30%). Check for memory leaks in test setup or cleanup.
```

## File Structure

The performance monitoring system creates the following directory structure:

```
_FocusedUX/
├── performance-baselines/          # Baseline files
│   ├── @fux/shared-test.json
│   ├── @fux/shared-tc.json
│   └── ...
├── performance-reports/            # Historical reports
│   ├── @fux/shared-test-1735320000000.json
│   ├── @fux/shared-test-1735323600000.json
│   └── ...
└── packages/
    └── {package}/
        └── __tests__/
            └── _reports/
                └── performance.json  # Latest performance data
```

## Baseline Files

Baseline files contain the performance standards for each project-target combination:

```json
{
    "project": "@fux/shared",
    "target": "test",
    "baselineMetrics": {
        "duration": 5820,
        "testCount": 82,
        "memoryPeak": 156.2,
        "buildTime": 1200,
        "coverageTime": 450
    },
    "thresholds": {
        "duration": 20,
        "memoryPeak": 30,
        "buildTime": 25
    },
    "lastUpdated": "2024-12-27T18:30:00.000Z",
    "version": "1.0.0"
}
```

## Performance Reports

Performance reports contain detailed analysis of each test run:

```json
{
    "timestamp": "2024-12-27T18:30:00.000Z",
    "project": "@fux/shared",
    "target": "test",
    "metrics": {
        "project": "@fux/shared",
        "target": "test",
        "startTime": 1735320000000,
        "endTime": 1735320005820,
        "duration": 5820,
        "memoryPeak": 156.2,
        "testCount": 82,
        "status": "success"
    },
    "baseline": {
        /* baseline data */
    },
    "analysis": {
        "durationDeviation": 0.3,
        "memoryDeviation": 2.1,
        "buildTimeDeviation": -1.5,
        "status": "within_threshold",
        "recommendations": ["Performance is within acceptable thresholds."]
    }
}
```

## Best Practices

### Baseline Management

1. **Create Baselines After Optimizations**: Only create baselines when performance is optimal
2. **Update Baselines Regularly**: Refresh baselines after significant improvements
3. **Version Control Baselines**: Commit baseline files to track performance history
4. **Environment Consistency**: Ensure consistent environment for baseline creation

### Performance Monitoring

1. **Daily Checks**: Run performance checks before committing changes
2. **Regression Investigation**: Immediately investigate performance regressions
3. **Trend Analysis**: Monitor performance trends over time
4. **CI/CD Integration**: Include performance gates in automated pipelines

### Optimization Strategies

1. **Test File Splitting**: Split large test files (>500 lines) to improve performance
2. **Mock Optimization**: Use efficient mocking strategies to reduce setup time
3. **Memory Management**: Ensure proper cleanup in test teardown
4. **Build Optimization**: Minimize build dependencies and optimize build configuration

## Troubleshooting

### Common Issues

#### No Baseline Available

**Problem**: Performance check shows "no_baseline" status

**Solution**: Create a baseline first:

```bash
pae {project} {target} --performance-baseline
```

#### Performance Regression

**Problem**: Tests show regression status

**Investigation Steps**:

1. Check recent changes that might affect performance
2. Review test file sizes and organization
3. Analyze memory usage patterns
4. Examine build dependency changes

**Optimization Actions**:

1. Split large test files
2. Optimize test setup and teardown
3. Review mocking strategies
4. Update baseline if improvements are made

#### Memory Leaks

**Problem**: Memory usage consistently increases

**Investigation Steps**:

1. Check for unclosed resources in tests
2. Review global test setup
3. Analyze mock cleanup procedures
4. Monitor for retained references

**Solutions**:

1. Ensure proper cleanup in `afterEach`/`afterAll`
2. Clear mocks between tests
3. Dispose of resources properly
4. Use memory profiling tools

### Debugging Performance Issues

#### Enable Verbose Output

```bash
# Get detailed performance information
pae {project} {target} --performance-validate --verbose
```

#### Check Historical Data

```bash
# Review performance reports
ls performance-reports/
cat performance-reports/{project}-{target}-{timestamp}.json
```

#### Compare Baselines

```bash
# Compare current performance with baseline
diff performance-baselines/{project}-{target}.json performance-reports/{latest-report}.json
```

## Integration with Development Workflow

### Pre-Commit Checks

Add performance monitoring to your pre-commit workflow:

```bash
#!/bin/bash
# pre-commit-performance.sh

echo "Running performance checks..."

# Check performance for modified packages
pae shared test --performance-check
pae gwc test --performance-check
pae gwe test --performance-check

# Fail if any regressions detected
if [ $? -ne 0 ]; then
    echo "Performance regression detected. Please investigate before committing."
    exit 1
fi

echo "Performance checks passed."
```

### CI/CD Pipeline Integration

```yaml
# .github/workflows/performance-check.yml
name: Performance Check

on: [push, pull_request]

jobs:
    performance:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v3
            - uses: actions/setup-node@v3
              with:
                  node-version: '18'

            - name: Install dependencies
              run: pnpm install

            - name: Performance validation
              run: |
                  pae all test --performance-validate

            - name: Upload performance reports
              uses: actions/upload-artifact@v3
              with:
                  name: performance-reports
                  path: performance-reports/
```

### IDE Integration

Configure your IDE to run performance checks:

**VS Code Settings**:

```json
{
    "tasks": {
        "version": "2.0.0",
        "tasks": [
            {
                "label": "Performance Check",
                "type": "shell",
                "command": "pae",
                "args": ["shared", "test", "--performance-check"],
                "group": "test",
                "presentation": {
                    "echo": true,
                    "reveal": "always",
                    "focus": false,
                    "panel": "shared"
                }
            }
        ]
    }
}
```

## Advanced Configuration

### Custom Thresholds

Modify baseline files to adjust thresholds for specific projects:

```json
{
    "project": "@fux/shared",
    "target": "test",
    "thresholds": {
        "duration": 15, // Stricter duration threshold
        "memoryPeak": 25, // Stricter memory threshold
        "buildTime": 20 // Stricter build time threshold
    }
}
```

### Performance Reporter Configuration

Configure Vitest performance reporting in your test configuration:

```typescript
// vitest.functional.config.ts
export default defineConfig({
    test: {
        reporters: [
            'default',
            [
                'performance',
                {
                    outputFile: './__tests__/_reports/performance.json',
                    baselineFile: './performance-baselines/functional.json',
                },
            ],
        ],
    },
})
```

## Monitoring and Alerts

### Performance Dashboard

Create a simple dashboard to monitor performance trends:

```bash
#!/bin/bash
# performance-dashboard.sh

echo "📊 Performance Dashboard"
echo "========================"

for baseline in performance-baselines/*.json; do
  project=$(basename "$baseline" .json)
  echo "Project: $project"

  # Get latest report
  latest_report=$(ls -t performance-reports/${project}-*.json 2>/dev/null | head -1)

  if [ -n "$latest_report" ]; then
    status=$(jq -r '.analysis.status' "$latest_report")
    duration=$(jq -r '.metrics.duration' "$latest_report")
    echo "  Status: $status"
    echo "  Duration: ${duration}ms"
  else
    echo "  No recent reports"
  fi
  echo ""
done
```

### Automated Alerts

Set up automated alerts for performance regressions:

```bash
#!/bin/bash
# performance-alert.sh

# Check for regressions and send alerts
pae all test --performance-validate

# Parse results and send notifications
if grep -q "regression" performance-reports/*.json; then
  echo "Performance regression detected!" | mail -s "Performance Alert" team@example.com
fi
```

## Conclusion

The testing performance monitoring system provides comprehensive insights into test execution performance, enabling proactive optimization and regression prevention. By integrating this system into your development workflow, you can maintain optimal test performance and ensure consistent development velocity.

For questions or issues with the performance monitoring system, refer to the troubleshooting section or consult the Actions Log for historical performance optimization patterns.
