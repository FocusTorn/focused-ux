# Changelog

All notable changes to the Dynamicons core package will be documented in this file.

## [2025-08-30] - Deep-Dive Audit and Asset Pipeline Refinement

### Fixed

- **Cross-contamination in orphan detection**: Resolved issue where file and folder icon orphan detection was sharing state, causing false positives when icon names appeared in both orphans arrays
- **Orphan detection accuracy**: Fixed orphan detection to properly respect commented entries in model files without interference from other orphan arrays
- **Asset path inconsistencies**: Corrected asset generation paths to ensure all assets are generated to `core/assets` directory
- **Console output readability**: Improved asset generation status messages for better user experience and debugging

### Changed

- **Orphan detection architecture**: Refactored orphan detection into separate functions (`checkOrphanedFileIcons` and `checkOrphanedFolderIcons`) with distinct orphan arrays
- **State management**: Changed from shared Set-based to separate array-based orphan processing to ensure proper isolation
- **Asset generation workflow**: Enhanced all asset generation scripts with improved error handling and status verification
- **Console output format**: Streamlined asset generation status messages for cleaner, more readable output
- **Naming conventions**: Aligned folder icon naming conventions with assignment array patterns for consistent orphan detection

### Technical Improvements

- **Separation of concerns**: Implemented proper separation between file and folder icon processing to prevent state contamination
- **Debug output enhancement**: Added systematic debug output to trace data flow and identify state contamination issues
- **Code maintainability**: Improved asset pipeline reliability and maintainability through better state isolation
- **Error handling**: Enhanced build failure detection and status verification throughout asset generation pipeline
- **User experience**: Improved console output readability and debugging effectiveness
- **Architectural alignment**: Ensured asset pipeline follows core package self-sufficiency principles

---

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
