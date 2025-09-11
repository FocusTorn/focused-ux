# Audit Criteria Reference

This document outlines the audit sections and criteria used in the original audit scripts for the dynamicons package.

## Model Audit (`audit-models.ts`)

### Directory-Based Checks

These checks identify icons that exist in directories but are not assigned in model files.

#### 1. **ORPHANED FILE ICONS** (`orphanedFileIcons`)

- **Criteria**: Icons that exist in the `file_icons` directory but are NOT assigned in `file_icons.model.json`
- **Description**: "DIRECTORY: UNASSIGNED ICON"
- **Purpose**: Find unused file icons that should be either assigned or removed

#### 2. **ORPHANED FOLDER ICONS** (`orphanedFolderIcons`)

- **Criteria**: Icons that exist in the `folder_icons` directory but are NOT assigned in `folder_icons.model.json`
- **Description**: "DIRECTORY: UNASSIGNED ICON"
- **Purpose**: Find unused folder icons that should be either assigned or removed

### Model-Based Checks

These checks identify icons that are assigned in model files but the corresponding files don't exist.

#### 3. **ORPHANED FILE ASSIGNMENTS** (`orphanedFileAssignments`)

- **Criteria**: Icons assigned in `file_icons.model.json` but the corresponding file does NOT exist in the directory
- **Description**: "MODEL: ASSIGNED ICON NOT FOUND"
- **Purpose**: Find broken model assignments that reference non-existent files

#### 4. **ORPHANED FOLDER ASSIGNMENTS** (`orphanedFolderAssignments`)

- **Criteria**: Icons assigned in `folder_icons.model.json` but the corresponding file does NOT exist in the directory
- **Description**: "MODEL: ASSIGNED ICON NOT FOUND"
- **Purpose**: Find broken model assignments that reference non-existent files

#### 5. **ORPHANED LANGUAGE ASSIGNMENTS** (`orphanedLanguageAssignments`)

- **Criteria**: Icons assigned in `language_icons.model.json` but the corresponding file does NOT exist in the directory
- **Description**: "MODEL: ASSIGNED ICON NOT FOUND"
- **Purpose**: Find broken language assignments that reference non-existent files

### Duplicate Detection Checks

These checks identify duplicate or invalid assignments within model files.

#### 6. **DUPLICATE FILE ICONS** (`duplicateFileIcons`)

- **Criteria**: Duplicate `iconName` values within `file_icons.model.json`
- **Description**: "MODEL: DUPLICATE ASSIGNMENT"
- **Purpose**: Find duplicate icon assignments in the model file

#### 7. **DUPLICATE FOLDER ICONS** (`duplicateFolderIcons`)

- **Criteria**: Duplicate `iconName` values within `folder_icons.model.json`
- **Description**: "MODEL: DUPLICATE ASSIGNMENT"
- **Purpose**: Find duplicate icon assignments in the model file

#### 8. **DUPLICATE LANGUAGE ICONS** (`duplicateLanguageIcons`)

- **Criteria**: Duplicate `languageID` values within `language_icons.model.json`
- **Description**: "MODEL: DUPLICATE ASSIGNMENT ID"
- **Purpose**: Find duplicate language ID assignments in the model file

#### 9. **INVALID LANGUAGE IDS** (`invalidLanguageIds`)

- **Criteria**: Invalid or malformed `languageID` values in `language_icons.model.json`
- **Description**: "MODEL: DUPLICATE ASSIGNMENT ID"
- **Purpose**: Find malformed language ID assignments in the model file

## Theme Audit (`audit-themes.ts`)

### Theme File Validation Checks

These checks validate the generated theme files against the model assignments.

#### 1. **MISSING FILE ICONS** (`missingFileIcons`)

- **Criteria**: Model assignments that are missing from the generated theme files
- **Description**: "THEME: ASSIGNED ICON NOT FOUND"
- **Purpose**: Ensure all model assignments appear in generated themes

#### 2. **MISSING FOLDER ICONS** (`missingFolderIcons`)

- **Criteria**: Model assignments that are missing from the generated theme files
- **Description**: "THEME: ASSIGNED ICON NOT FOUND"
- **Purpose**: Ensure all model assignments appear in generated themes

### Theme File Duplicate Checks

These checks identify duplicate assignments within the generated theme files.

#### 3. **DUPLICATE FILE ASSIGNMENTS** (`duplicateFileAssignments`)

- **Criteria**: Duplicate assignments within the generated theme files
- **Description**: "THEME: DUPLICATE ASSIGNMENT"
- **Purpose**: Find duplicate assignments in generated theme files

#### 4. **DUPLICATE FOLDER ASSIGNMENTS** (`duplicateFolderAssignments`)

- **Criteria**: Duplicate assignments within the generated theme files
- **Description**: "THEME: DUPLICATE ASSIGNMENT"
- **Purpose**: Find duplicate assignments in generated theme files

#### 5. **DUPLICATE LANGUAGE ASSIGNMENTS** (`duplicateLanguageAssignments`)

- **Criteria**: Duplicate assignments within the generated theme files
- **Description**: "THEME: DUPLICATE ASSIGNMENT"
- **Purpose**: Find duplicate assignments in generated theme files

## Key Principles

### Model Audit Principles

- **Directory vs Model**: Check for icons in directories not assigned in models (orphaned icons)
- **Model vs Directory**: Check for model assignments referencing non-existent files (orphaned assignments)
- **Internal Consistency**: Check for duplicates and invalid values within model files

### Theme Audit Principles

- **Model vs Theme**: Ensure all model assignments appear in generated theme files
- **Theme Consistency**: Check for duplicates within generated theme files
- **Theme Completeness**: Verify no model assignments are missing from themes

### Error Categories

- **DIRECTORY: UNASSIGNED ICON**: Icons in directories not assigned in models
- **MODEL: ASSIGNED ICON NOT FOUND**: Model assignments referencing non-existent files
- **MODEL: DUPLICATE ASSIGNMENT**: Duplicate assignments within model files
- **MODEL: DUPLICATE ASSIGNMENT ID**: Duplicate or invalid language IDs in model files
- **THEME: ASSIGNED ICON NOT FOUND**: Model assignments missing from generated themes
- **THEME: DUPLICATE ASSIGNMENT**: Duplicate assignments within generated theme files

## Implementation Notes

- **Language Icons**: Language icons are just file icons with a different purpose - they don't need separate "unused" checks
- **Tree Formatter**: Uses configurable section titles for different error types
- **CLI Interface**: Both audit processors support standalone execution with proper exit codes
- **Error Handling**: Centralized error management with categorized error types and severity levels
