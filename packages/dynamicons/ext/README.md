# F-UX: Dynamicons

A dynamic and customizable icon theme for VS Code that provides a focused user experience with extensive customization options.

## Overview

Dynamicons is part of the Focused UX (F-UX) suite of extensions designed to enhance the visual experience in VS Code. It provides a comprehensive icon theme system with dynamic icon assignment capabilities, allowing users to customize file and folder icons based on their preferences and project needs.

## Features

### 🎨 Dynamic Icon Theme
- **Customizable Icons**: Assign custom icons to specific files and folders
- **Project-Specific Themes**: Different icon sets for different project types
- **Real-time Updates**: Icon changes are applied immediately without restart

### 📁 File & Folder Icon Management
- **Icon Assignment**: Assign specific icons to file types or individual files
- **Icon Reversion**: Easily revert custom icon assignments
- **Bulk Operations**: Manage multiple icon assignments efficiently

### 🎯 Explorer Enhancements
- **Arrow Visibility**: Toggle folder arrow visibility in the explorer
- **Icon Preview**: Preview available icons before assignment
- **User Assignments**: View and manage your custom icon assignments

### 🔄 Theme Management
- **Theme Activation**: Activate the Dynamicons icon theme
- **Theme Refresh**: Refresh icon theme to apply changes
- **Theme Persistence**: Custom assignments persist across sessions

## Commands

### Core Commands

| Command | Description | Icon | Category |
|---------|-------------|------|----------|
| `Dynamicons: Activate Icon Theme` | Activate the Dynamicons icon theme | - | Dynamicons |
| `Assign Icon to File/Folder...` | Assign custom icon to selected item | $(symbol-color) | Dynamicons |
| `Revert Icon Assignment` | Remove custom icon assignment | $(discard) | Dynamicons |
| `Dynamicons: Toggle Explorer Arrow Visibility` | Toggle folder arrows in explorer | - | Dynamicons |
| `Dynamicons: Show User File Icon Assignments` | Display current file icon assignments | - | Dynamicons |
| `Dynamicons: Show User Folder Icon Assignments` | Display current folder icon assignments | - | Dynamicons |
| `Dynamicons: Refresh Icon Theme` | Refresh the icon theme | $(refresh) | Dynamicons |

## Views

### Activity Bar Views
- **Context Explorer**: Browse and manage file/folder icons
- **Quick Settings**: Configure theme preferences
- **Saved States**: Manage saved icon configurations

## Themes

### Included Themes
- **Dynamicons Theme**: Main icon theme with comprehensive file type coverage
- **Focused UX Color Theme**: Complementary color theme for dark UI

### Icon Categories
- **File Icons**: 117+ file type icons
- **Folder Icons**: 114+ folder type icons
- **Language Icons**: Programming language-specific icons
- **Framework Icons**: Framework and tool-specific icons

## Usage Examples

### Activating the Theme
1. Open the Command Palette (`Ctrl+Shift+P`)
2. Run "Dynamicons: Activate Icon Theme"
3. The Dynamicons theme is now active

### Assigning Custom Icons
1. Right-click on a file or folder in the explorer
2. Select "Assign Icon to File/Folder..."
3. Choose from available icons
4. The icon is immediately applied

### Managing Icon Assignments
1. Open the Dynamicons activity bar view
2. Navigate to "User File Icon Assignments" or "User Folder Icon Assignments"
3. View and manage your custom assignments

### Toggling Explorer Arrows
1. Open the Command Palette (`Ctrl+Shift+P`)
2. Run "Dynamicons: Toggle Explorer Arrow Visibility"
3. Folder arrows are toggled on/off

## Architecture

This extension follows the F-UX architecture pattern with separate core and extension packages:

- **Core Package** (`@fux/dynamicons-core`): Contains the business logic and services
- **Extension Package** (`fux-dynamicons`): VS Code extension wrapper

### Core Services

- **IconActionsService**: Manages icon assignment and removal
- **IconThemeGeneratorService**: Generates and updates icon themes
- **TreeFormatterService**: Formats file tree data for display

### Asset Management

The extension includes a comprehensive set of SVG icons organized by category:
- `assets/icons/file_icons/`: File type icons
- `assets/icons/folder_icons/`: Folder type icons
- `assets/themes/`: Theme configuration files

## Development

### Prerequisites
- Node.js 18+
- VS Code 1.99.3+
- TypeScript 5.8+

### Building
```bash
# Build the extension
nx build dynamicons-ext

# Package the extension
nx package dynamicons-ext
```

### Asset Generation
```bash
# Generate icon manifests
nx run dynamicons-core:generate-icon-manifests

# Build dynamicon assets
nx run dynamicons-core:build-dynamicon-assets
```

### Testing
```bash
# Run tests
nx test dynamicons-core
```

## Dependencies

### Runtime Dependencies
- `@fux/dynamicons-core`: Core business logic
- `@fux/shared`: Shared utilities and interfaces
- `awilix`: Dependency injection container

### Development Dependencies
- `@types/node`: Node.js type definitions
- `@types/vscode`: VS Code API type definitions
- `typescript`: TypeScript compiler

## Configuration

Dynamicons is designed to work out-of-the-box with comprehensive default icon coverage. The theme automatically adapts to your project structure and file types.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Adding New Icons
1. Add SVG icon files to the appropriate category folder
2. Update icon manifests using the generation scripts
3. Test the new icons in various contexts
4. Update documentation if needed

## License

MIT License - see [LICENSE.txt](../../../LICENSE.txt) for details.

## Support

For issues, feature requests, or questions:
- Create an issue on GitHub
- Check the documentation in the `docs/` folder
- Review the F-UX project guidelines

---

**Part of the Focused UX (F-UX) Extension Suite**
