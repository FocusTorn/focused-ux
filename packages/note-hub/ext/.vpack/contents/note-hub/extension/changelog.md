# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2025-08-22] - Comprehensive Adapter Test Suite - 100% Success Rate Achievement

### Added

- **Complete Adapter Test Coverage**: Achieved 100% test success rate (89/89 tests passing)
    - CommandsAdapter tests (10 tests): Command registration, execution, disposable management, error handling
    - WindowAdapter tests (19 tests): UI operations, input handling, progress operations, tree data provider management
    - ExtensionContextAdapter tests (17 tests): State management, subscription handling, Thenable/Promise conversion
    - WorkspaceAdapter tests (25 tests): Configuration management, file operations, workspace folder access, file system watching
    - UriAdapter tests (18 tests): URI creation, parsing, transformation, error handling

- **Global VSCode Mocking Infrastructure**: Established comprehensive `_setup.ts` with global VSCode API mocking
- **Method Overloading Resolution**: Resolved complex VSCode API method signature mismatches through iterative debugging

### Changed

- **Testing Philosophy Alignment**: Pivoted from basic setup tests to comprehensive functionality testing per user guidance
- **Mock Precision Enhancement**: Achieved exact match between test expectations and actual VSCode API behavior

### Fixed

- **Parameter Handling Issues**: Resolved method overloading conflicts in WindowAdapter showInputBox and message methods
- **Interface Signature Mismatches**: Corrected adapter implementations to match expected VSCode API patterns

### Technical Improvements

- **Guinea Pig Package Compliance**: Maintained complete independence from shared dependencies through local interfaces and adapters
- **Thin Wrapper Pattern**: Extension package properly delegates all business logic to core package while providing VSCode integration
- **Adapter Pattern Implementation**: All VSCode API interactions properly abstracted through testable adapters

## [2025-08-22] - Thin Wrapper Implementation and VSCode Configuration Preservation

### Added

- **Adapter Implementation**: Created 9 comprehensive adapters for VSCode API abstraction
    - `Window.adapter.ts` - Implements `IWindow` interface with message display and tree data provider registration
    - `Workspace.adapter.ts` - Implements `IWorkspace` interface with file system operations and workspace folders
    - `Commands.adapter.ts` - Implements `ICommands` interface for command registration
    - `FileSystem.adapter.ts` - Implements `IFileSystem` interface with file operations and directory creation
    - `PathUtils.adapter.ts` - Implements `IPathUtilsService` interface with path manipulation utilities
    - `CommonUtils.adapter.ts` - Implements `ICommonUtilsService` interface for common UI operations
    - `Uri.adapter.ts` - Implements `IUriFactory` interface for URI creation and manipulation
    - `WorkspaceUtils.adapter.ts` - Implements `IWorkspaceUtilsService` interface with workspace information
    - `FrontmatterUtils.adapter.ts` - Implements `IFrontmatterUtilsService` interface for frontmatter operations

- **Thin Wrapper Architecture**: Implemented adapter pattern for all VSCode API interactions
    - All VSCode API calls wrapped in adapters for testability
    - Clean separation between VSCode integration and business logic
    - Direct instantiation of core services without DI containers

- **Build Configuration**: Updated build system for new architecture
    - Updated `package.json` to remove external dependencies while preserving VSCode configuration
    - Updated `project.json` with proper build configuration
    - Created Vitest configuration files for testing

### Changed

- **Extension Entry Point**: Complete rewrite of `extension.ts` to remove DI container usage
    - Direct instantiation of core services and local adapters
    - Proper error handling and user feedback
    - `NotesHubProviderManager` constructor with all 13 parameters
    - Storage service mock with `delete` method
    - Variable type fixes (`undefined` instead of `null`)

- **Architecture Refactoring**: Removed dependency injection containers and shared dependencies
    - Removed `awilix` DI container dependency
    - Removed `@fux/shared` and `@fux/mockly` dependencies
    - Implemented direct service instantiation pattern

- **VSCode API Integration**: Updated all VSCode API usage to go through adapters
    - Promise/Thenable compatibility fixes in Workspace adapter
    - Variable naming conflict resolution in PathUtils adapter
    - Proper type handling in Uri adapter

### Fixed

- **VSCode Extension Configuration**: Preserved all critical VSCode extension configuration
    - All `contributes` sections preserved (commands, views, menus, configuration)
    - All `activationEvents` maintained
    - All `engines` and extension metadata intact
    - Only business logic dependencies removed, not VSCode configuration

- **Type Safety**: Fixed all TypeScript compilation errors and type mismatches
    - Promise/Thenable compatibility issues resolved
    - Variable naming conflicts resolved
    - Proper interface implementation across all adapters

### Technical Improvements

- **Thin Wrapper Pattern**: Implemented proper thin wrapper around core package
    - Extension contains only VSCode integration code
    - All business logic delegated to core package
    - Adapter pattern used for all VSCode API interactions
    - Clean separation of concerns maintained

- **Build System**: Successfully configured build system with proper core package integration
    - Core package integration with proper imports from `@fux/note-hub-core`
    - TypeScript compilation without errors
    - VSCode extension configuration preserved

### Removed

- **Dependency Injection**: Removed `src/injection.ts` file and DI container usage
- **External Dependencies**: Removed `@fux/shared`, `awilix`, and `@fux/mockly` dependencies
- **Shared Imports**: Replaced all shared library imports with local interface implementations

### Preserved

- **VSCode Extension Configuration**: All VSCode-specific configuration maintained
    - `contributes` sections for commands, views, menus, and configuration
    - `activationEvents` for proper extension activation
    - `engines` for VSCode version compatibility
    - Extension metadata and display information
