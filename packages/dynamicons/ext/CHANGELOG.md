# Changelog

All notable changes to the Dynamicons extension will be documented in this file.

## [2025-08-22] - Extension Testing Limitations and TypeScript Configuration Fixes

### Added

- **Resource Type Detection**: Automatic detection of file vs folder for icon picker filtering
    - Icon picker now shows only relevant icons based on selected resource type
    - Eliminates confusion from showing all icons regardless of selection
    - Uses `fileSystem.stat()` to determine resource type automatically

### Changed

- **Refresh Mechanism**: Improved icon theme refresh behavior
    - Removed explicit file explorer refresh commands that caused unwanted side effects
    - Now relies on VS Code's native auto-refresh behavior
    - Eliminated file explorer focus changes and theme selection prompts
    - Theme updates are now seamless and non-intrusive

### Fixed

- **TypeScript Configuration**: Fixed project reference configuration issues
    - Resolved build info conflicts between `tsconfig.json` and `tsconfig.lib.json`
    - Updated to use unique output directories for each TypeScript configuration
    - Corrected extension package configuration to match proper patterns
    - Removed unnecessary module and resolution settings

### Technical Improvements

- **Testing Strategy**: Established clear understanding of VS Code extension testing limitations
- **Build System**: Improved TypeScript project reference structure
- **Configuration**: Standardized TypeScript configuration across all packages
- **Documentation**: Added comprehensive testing strategy documentation

### Known Limitations

- **UI/UX Testing**: Some behaviors like file explorer focus changes and theme prompts require manual testing
- **VS Code Integration**: Certain VS Code internal behaviors are outside extension control
- **Timing Dependencies**: Some operations require specific timing that cannot be easily automated
