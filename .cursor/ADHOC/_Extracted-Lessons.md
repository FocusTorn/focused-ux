# PAE Migration and Architecture Lessons Learned

## Service-Based Architecture Migration Pattern

- Learning: Migrating from monolithic command classes to service-based architecture provides better separation of concerns and testability
- Pattern: Replace single large classes with focused services (CommandResolutionService, PackageResolutionService, TargetResolutionService, ConfigurationValidator)
- Implementation: Extract specific responsibilities into dedicated services with clear interfaces, then compose them in the main command class
- Benefit: Better testability, clearer responsibilities, easier maintenance, and more flexible configuration
- Not documented: The migration pattern from legacy monolithic approaches to service-based architecture isn't documented in the current architecture docs

## Configuration Format Migration Strategy

- Learning: Complete commitment to new configuration format (YAML-only) eliminates complexity and prevents fallback confusion
- Pattern: Remove all legacy format support immediately rather than maintaining dual compatibility
- Implementation: Delete JSON parsing logic, remove legacy type definitions, update all validation to be strict for new format only
- Benefit: Eliminates format ambiguity, reduces code complexity, forces proper migration, prevents configuration drift
- Not documented: The strategy for complete format migration without backward compatibility isn't documented in migration guides

## Expandable Flag Template Processing

- Learning: Template variable mapping requires careful handling of default values vs. provided arguments
- Pattern: Use explicit variable mapping where provided values replace defaults entirely, not append to them
- Implementation: Initialize variables object with defaults, then override with provided values before template processing
- Benefit: Prevents incorrect flag expansion like `--bail 1 2` instead of `--bail 2`
- Mistake/Assumption: Initially assumed template processing would automatically handle value replacement
- Correction: Implemented explicit variable mapping in ExpandableProcessorService.expandFlags method
- Not documented: Template variable mapping patterns and default value handling strategies aren't documented

## Flag Format Validation and Error Handling

- Learning: Strict flag format enforcement prevents ambiguous command parsing and improves user experience
- Pattern: Enforce specific formats (-{flag} or -{flag}=value) and throw descriptive errors for invalid formats
- Implementation: Use regex validation in parseExpandableFlag method with try-catch error handling in expandFlags
- Benefit: Prevents combo flags, ambiguous parsing, and provides clear error messages
- Mistake/Assumption: Initially allowed flexible flag parsing which led to combo flag issues
- Correction: Implemented strict regex patterns and error throwing for invalid formats
- Not documented: Flag validation patterns and error handling strategies for CLI tools aren't documented

## Command Execution Consolidation

- Learning: Consolidating multiple command execution methods into a single consistent approach improves maintainability
- Pattern: Migrate specialized methods (runNx) to use general-purpose methods (runCommand) for consistency
- Implementation: Remove runNx method, update all calls to use runCommand with proper argument structure
- Benefit: Single execution path, easier testing, consistent behavior, better command generation capabilities
- Not documented: Command execution consolidation patterns and when to use specialized vs. general methods aren't documented

## Local Development Testing Workflow

- Learning: Direct TypeScript execution (tsx) provides faster development cycles than building and installing packages
- Pattern: Use `tsx libs/project-alias-expander/src/cli.ts` for local testing instead of npm scripts or batch files
- Implementation: Execute TypeScript source directly with tsx rather than building to dist and running compiled JS
- Benefit: Faster iteration, immediate feedback, no build step required, easier debugging
- Not documented: Local development testing patterns and tool selection criteria aren't documented

## Package Resolution for Direct String References

- Learning: Tools defined as direct string references in nxPackages require different resolution logic than PackageDefinition objects
- Pattern: Handle direct string references by returning the package name as the full name when no PackageDefinition exists
- Implementation: Check if packageName exists in packageMap, if not, treat as direct string reference and return as-is
- Benefit: Supports both complex package definitions and simple tool references in the same configuration structure
- Mistake/Assumption: Initially assumed all packages would have PackageDefinition objects
- Correction: Added fallback logic in PackageResolutionService.resolvePackage for direct string references
- Not documented: Package resolution patterns for different configuration structures aren't documented

## Error Message Formatting and Debug Information

- Learning: User-friendly error messages with conditional debug information improve user experience
- Pattern: Use colored error prefixes, hide stack traces in normal mode, show full details only in debug mode
- Implementation: Colorize error prefix with ANSI codes, conditionally display stack traces based on DEBUG flag
- Benefit: Clean user experience, detailed debugging when needed, professional error presentation
- Not documented: Error message formatting patterns and debug information strategies aren't documented

## Legacy Code Identification and Removal Strategy

- Learning: Systematic identification of duplicated functionality prevents architectural debt accumulation
- Pattern: Compare implementations side-by-side, identify which is correctly wired, remove unused/incorrect versions
- Implementation: Use codebase search to find duplicate patterns, analyze usage, remove legacy implementations
- Benefit: Cleaner codebase, reduced confusion, better maintainability, prevents bugs from legacy code
- Not documented: Legacy code identification patterns and systematic removal strategies aren't documented

## TypeScript Type System Enforcement

- Learning: Strict type definitions prevent runtime errors and improve code quality during migrations
- Pattern: Remove legacy types immediately, update all references, let TypeScript compiler catch inconsistencies
- Implementation: Delete AliasValue type, remove legacy properties from interfaces, update all type references
- Benefit: Compile-time error detection, prevents type mismatches, forces proper migration completion
- Not documented: TypeScript migration patterns and type system enforcement strategies aren't documented
