# Changelog

All notable changes to the Ghost Writer extension will be documented in this file.

## [2025-08-22] - TypeScript Configuration and Build System Improvements

### Fixed

- **TypeScript Configuration**: Fixed project reference configuration issues
    - Resolved build info conflicts between `tsconfig.json` and `tsconfig.lib.json`
    - Updated to use unique output directories for each TypeScript configuration
    - Corrected extension package configuration to match proper patterns
    - Removed unnecessary module and resolution settings

### Technical Improvements

- **Build System**: Improved TypeScript project reference structure
    - Unique output directories for each `tsconfig.*.json` file
    - Proper separation of concerns between different TypeScript configurations
    - Better incremental build support
- **Configuration**: Standardized TypeScript configuration
    - Consistent patterns across all packages
    - Proper composite project setup
    - Declaration and declaration map generation
