# Changelog

All notable changes to the Dynamicons core package will be documented in this file.

## [2025-08-22] - TypeScript Configuration and Build System Improvements

### Added

- **Resource Type Detection**: Added automatic detection of file vs folder for icon picker filtering
    - New `detectResourceType` method in `IconActionsService`
    - Uses `fileSystem.stat()` to determine resource type automatically
    - Improves user experience by filtering icon picker appropriately

### Changed

- **Icon Theme Refresh**: Improved refresh mechanism in `IconActionsService`
    - Removed explicit file explorer refresh commands that caused unwanted side effects
    - Now relies on VS Code's native auto-refresh behavior
    - Eliminated file explorer focus changes and theme selection prompts
    - Theme updates are now seamless and non-intrusive

### Fixed

- **TypeScript Project References**: Fixed build info conflicts
    - Resolved conflicts between `tsconfig.json` and `tsconfig.lib.json` output directories
    - Updated to use unique `out-tsc` directories for each TypeScript configuration
    - Fixed `tsBuildInfoFile` conflicts that were causing compilation errors
    - Proper project reference structure now in place

### Technical Improvements

- **Build System**: Improved TypeScript project reference structure
    - Unique output directories for each `tsconfig.*.json` file
    - Proper separation of concerns between different TypeScript configurations
    - Better incremental build support
- **Configuration**: Standardized TypeScript configuration
    - Consistent patterns across all core packages
    - Proper composite project setup
    - Declaration and declaration map generation

### Architecture

- **Project Structure**: Enhanced internal project reference configuration
    - Proper separation between `tsconfig.json` and `tsconfig.lib.json`
    - Unique build info files to prevent conflicts
    - Better IDE support and type checking
