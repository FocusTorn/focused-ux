# CLI Silent Failure Debugging

- Learning: CLI can appear to run successfully but fail silently due to module detection issues
- Pattern: Use comprehensive logging at every execution step to identify where execution stops
- Implementation: Add console.log statements at imports, main function entry, command processing, and module detection
- Benefit: Eliminates silent failures and provides clear visibility into execution flow
- Not documented: The docs don't cover debugging silent CLI failures or module detection issues

# Module Detection Path Normalization

- Learning: import.meta.url and process.argv[1] paths can differ in format (forward vs backslashes, case sensitivity)
- Pattern: Normalize paths by converting to lowercase and replacing backslashes with forward slashes before comparison
- Implementation: `const normalizedImportUrl = import.meta.url.replace(/\\/g, '/').toLowerCase()` and `const normalizedArgvPath = \`file:///${process.argv[1].replace(/\\/g, '/').toLowerCase()}\``
- Benefit: Ensures module detection works across different operating systems and path formats
- Not documented: The docs don't mention path normalization requirements for module detection

# JSON-with-Comments Configuration Files

- Learning: Configuration files with JavaScript-style comments (//) cannot be parsed with standard JSON.parse()
- Pattern: Use strip-json-comments package to handle JSON files with comments
- Implementation: Install strip-json-comments and use it instead of JSON.parse() for config files
- Benefit: Allows configuration files to have documentation comments while maintaining JSON structure
- Not documented: The docs don't specify how to handle JSON files with comments in Node.js applications

# Comprehensive Error Handling and Logging

- Learning: Silent failures occur when errors are caught but not properly logged or when execution stops unexpectedly
- Pattern: Add try-catch blocks with detailed logging at every major function boundary
- Implementation: Wrap all major functions in try-catch, log function entry/exit, log all error details, and provide helpful error messages
- Benefit: Eliminates silent failures and provides clear debugging information
- Not documented: The docs don't emphasize the importance of comprehensive error handling for CLI tools

# Debug Mode Implementation

- Learning: Debug logging should be controlled by environment variables and provide detailed execution flow information
- Pattern: Use PAE_DEBUG=1 environment variable to enable detailed logging throughout execution
- Implementation: Check `process.env.PAE_DEBUG === '1'` and log detailed information about arguments, config loading, command processing, and execution flow
- Benefit: Allows users to debug issues without modifying code
- Not documented: The docs don't cover implementing debug modes for CLI tools

# Path Resolution Robustness

- Learning: File path resolution can fail when running from different working directories or execution contexts
- Pattern: Try multiple possible paths for configuration files, including relative and absolute paths
- Implementation: Array of possible paths: `[path.join(process.cwd(), 'libs', 'project-alias-expander', 'config.json'), path.join(process.cwd(), 'config.json'), path.join(PACKAGE_ROOT, 'config.json'), path.resolve('libs/project-alias-expander/config.json')]`
- Benefit: Configuration loading works regardless of current working directory or execution context
- Not documented: The docs don't cover robust path resolution strategies for configuration files

# Build Process Integration Testing

- Learning: Unit tests can pass while the actual CLI functionality is completely broken
- Pattern: Test the actual compiled CLI binary directly, not just the source code functions
- Implementation: Run `node dist/cli.js` commands directly to verify end-to-end functionality
- Benefit: Catches integration issues that unit tests miss
- Not documented: The docs don't emphasize testing compiled binaries vs source code

# Error Message Enhancement

- Learning: Generic error messages don't help users understand what went wrong or how to fix it
- Pattern: Provide specific error details, current working directory, attempted paths, and debugging instructions
- Implementation: Include helpful context like "Current working directory:", "To debug this issue, run: PAE_DEBUG=1 pae <command>", and specific file locations
- Benefit: Users can self-diagnose and fix issues without additional support
- Not documented: The docs don't cover writing helpful error messages for CLI tools

