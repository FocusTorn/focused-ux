# Project Butler - Task Tracker

## Current Tasks

_No current tasks pending_

---

## Potential Enhancements

### Interface Adapter Export Strategy ✅ COMPLETED

- **Description**: Adopt comprehensive interface adapter exporting strategy from GWC
- **Status**: Completed on 2025-01-27
- **Details**:
    - Implemented clear categorization of Service Interfaces vs Adapter Interfaces
    - Added comprehensive export coverage with detailed categorization
    - Maintained consistency with GWC's export strategy pattern
    - Verified build success and proper interface organization

### Test Coverage Enhancements

- **Description**: Add comprehensive tests for identified untested functionality
- **Status**: Potential enhancement
- **Details**:
    - **BackupManagementService**: Test `IBackupOptions` interface usage (currently unused)
    - **PackageJsonFormattingService**: Add more edge case tests for `getUnknownKeys` method
    - **Extension Commands**: Add tests for command function error handling edge cases
    - **Integration Tests**: Add error message validation and terminal behavior verification
    - **Constants Usage**: Test that error message constants are properly utilized

### Unused Feature Implementation

- **Description**: Implement planned but unused features identified in interfaces
- **Status**: Potential enhancement
- **Details**:
    - **Timestamp-based backups**: `BACKUP_TIMESTAMP_FORMAT` constant exists but not implemented
    - **Custom backup directory**: `IBackupOptions.directory` option not implemented
    - **Backup prefix/suffix customization**: Options exist but aren't used
    - **Default package.json order fallback**: `DEFAULT_PACKAGE_JSON_ORDER` not used as fallback
    - **Config format validation**: `SUPPORTED_CONFIG_FORMATS` not validated in services

### Future Interface Adapter Enhancements

- **Description**: Consider additional adapter interfaces as needed
- **Status**: Potential enhancement
- **Details**:
    - Monitor service implementations for additional VSCode integration needs
    - Consider adding Window/Workspace adapters if UI interactions are needed
    - Evaluate terminal-specific adapters for enhanced terminal management

---

## Completed Tasks

### Interface Adapter Export Strategy Implementation

- **Completed**: 2025-01-27
- **Description**: Implemented comprehensive interface adapter exporting strategy
- **Impact**: Improved developer experience and maintainability
