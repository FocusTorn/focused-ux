# F-UX: Note Hub

A comprehensive note-taking and knowledge management extension for VS Code that provides hierarchical note organization with project-specific, remote, and global note management capabilities.

## Overview

Note Hub is part of the Focused UX (F-UX) suite of extensions designed to enhance knowledge management and note-taking workflows within VS Code. It provides a sophisticated note management system with hierarchical organization, multiple storage locations, and rich note features including frontmatter support and markdown preview.

## Features

### 📝 Hierarchical Note Management

- **Project Notes**: Notes specific to the current project
- **Remote Notes**: Notes stored in remote repositories
- **Global Notes**: System-wide notes accessible from any project
- **Nested Structure**: Organize notes in folders and subfolders
- **Note Types**: Support for various note formats and structures

### 🗂️ Folder Management

- **Project Folders**: Create folders within the current project
- **Remote Folders**: Organize notes in remote repositories
- **Global Folders**: System-wide folder organization
- **Nested Folders**: Create hierarchical folder structures
- **Folder Operations**: Copy, cut, paste, and delete folders

### 📄 Note Operations

- **Note Creation**: Create new notes with various templates
- **Note Editing**: Rich text editing with markdown support
- **Note Preview**: Live markdown preview functionality
- **Frontmatter Support**: YAML frontmatter for note metadata
- **Note Organization**: Copy, cut, paste, and delete operations

### 🎨 Rich Note Features

- **Markdown Support**: Full markdown editing and rendering
- **Frontmatter**: YAML metadata support for note organization
- **Note Templates**: Predefined templates for different note types
- **Note Preview**: Real-time markdown preview
- **Note Search**: Search across all notes and folders

## Commands

### Folder Management Commands

| Command                         | Description                                | Icon          | Category  |
| ------------------------------- | ------------------------------------------ | ------------- | --------- |
| `Notes Hub: New Project Folder` | Create a new folder in the current project | $(new-folder) | Notes Hub |
| `Notes Hub: New Remote Folder`  | Create a new folder in remote storage      | $(new-folder) | Notes Hub |
| `Notes Hub: New Global Folder`  | Create a new system-wide folder            | $(new-folder) | Notes Hub |
| `Notes Hub: New Nested Folder`  | Create a nested folder structure           | $(new-folder) | Notes Hub |

### Note Management Commands

| Command                        | Description                              | Icon            | Category  |
| ------------------------------ | ---------------------------------------- | --------------- | --------- |
| `Notes Hub: New Project Note`  | Create a new note in the current project | $(new-file)     | Notes Hub |
| `Notes Hub: New Remote Note`   | Create a new note in remote storage      | $(new-file)     | Notes Hub |
| `Notes Hub: New Global Note`   | Create a new system-wide note            | $(new-file)     | Notes Hub |
| `Notes Hub: New Nested Note`   | Create a nested note structure           | $(new-file)     | Notes Hub |
| `Notes Hub: Open Note`         | Open a note for editing                  | $(edit)         | Notes Hub |
| `Notes Hub: Open Note Preview` | Open note in preview mode                | $(open-preview) | Notes Hub |

### Note Enhancement Commands

| Command                      | Description                  | Icon              | Category  |
| ---------------------------- | ---------------------------- | ----------------- | --------- |
| `Notes Hub: Add Frontmatter` | Add YAML frontmatter to note | $(list-unordered) | Notes Hub |
| `Notes Hub: Copy Item`       | Copy note or folder          | $(copy)           | Notes Hub |
| `Notes Hub: Cut Item`        | Cut note or folder           | -                 | Notes Hub |
| `Notes Hub: Paste Item`      | Paste copied item            | -                 | Notes Hub |

## Views

### Activity Bar Views

- **Notes Explorer**: Main interface for browsing and managing notes
- **Note Preview**: Live preview of markdown notes
- **Search Results**: Search across notes and folders

### Notes Explorer Features

- **Tree View**: Hierarchical display of notes and folders
- **Context Menu**: Right-click operations for notes and folders
- **Quick Actions**: Toolbar for common operations
- **Search**: Integrated search functionality
- **Status Bar**: Information about current note/folder

## Usage Examples

### Creating Project Notes

1. Open the Notes Hub activity bar view
2. Right-click in the explorer and select "New Project Note"
3. Enter a name for the note
4. The note is created in the current project's notes directory

### Organizing with Folders

1. Right-click in the Notes Hub explorer
2. Select "New Project Folder" (or Remote/Global as needed)
3. Enter a folder name
4. Create nested folders by selecting "New Nested Folder"

### Adding Frontmatter

1. Open a note for editing
2. Right-click and select "Add Frontmatter"
3. YAML frontmatter template is inserted
4. Customize the metadata as needed

### Previewing Notes

1. Right-click on a markdown note
2. Select "Open Note Preview"
3. The note opens in a split view with live preview
4. Changes are reflected in real-time

### Managing Note Structure

1. Use copy/cut/paste operations to reorganize notes
2. Create nested structures with nested folders
3. Move notes between project, remote, and global storage
4. Use search to find specific notes across all locations

## Data Providers

Note Hub uses a flexible data provider system to support different storage locations:

### Project Data Provider

- **Location**: Current project directory
- **Scope**: Project-specific notes and folders
- **Persistence**: Stored with project files
- **Use Case**: Project documentation, development notes

### Remote Data Provider

- **Location**: Remote repositories
- **Scope**: Shared notes across team members
- **Persistence**: Version controlled
- **Use Case**: Team documentation, shared knowledge

### Global Data Provider

- **Location**: System-wide storage
- **Scope**: Personal notes accessible everywhere
- **Persistence**: Local system storage
- **Use Case**: Personal notes, system-wide knowledge

## Architecture

This extension follows the F-UX architecture pattern with separate core and extension packages:

- **Core Package** (`@fux/note-hub-core`): Contains the business logic and services
- **Extension Package** (`fux-note-hub`): VS Code extension wrapper

### Core Services

- **NotesHubService**: Main orchestration service
- **NotesHubActionService**: Handles note and folder operations
- **NotesHubConfigService**: Manages configuration and settings
- **BaseNotesDataProvider**: Base class for data providers
- **ProjectNotesDataProvider**: Project-specific note storage
- **GlobalNotesDataProvider**: System-wide note storage

## Development

### Prerequisites

- Node.js 18+
- VS Code 1.99.3+
- TypeScript 5.8+

### Building

```bash
# Build the extension
nx build note-hub-ext

# Package the extension
nx package note-hub-ext
```

### Testing

```bash
# Run tests
nx test note-hub-core
```

## Dependencies

### Runtime Dependencies

- `awilix`: Dependency injection container

### Development Dependencies

- `@fux/note-hub-core`: Core business logic
- `@fux/shared`: Shared utilities and interfaces
- `@types/node`: Node.js type definitions
- `@types/vscode`: VS Code API type definitions
- `typescript`: TypeScript compiler

## Configuration

Note Hub is designed to work out-of-the-box with sensible defaults. Notes are automatically organized in appropriate directories based on their type (project, remote, global).

## Use Cases

### Development Documentation

- Create project-specific documentation
- Organize development notes by feature
- Share documentation with team members
- Maintain project knowledge base

### Personal Knowledge Management

- Store personal notes and ideas
- Organize knowledge by topic
- Access notes from any project
- Build personal knowledge base

### Team Collaboration

- Share notes in remote repositories
- Collaborate on documentation
- Maintain team knowledge base
- Version control for shared notes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see [LICENSE.txt](../../../LICENSE.txt) for details.

## Support

For issues, feature requests, or questions:

- Create an issue on GitHub
- Check the documentation in the `docs/` folder
- Review the F-UX project guidelines

---

**Part of the Focused UX (F-UX) Extension Suite**
