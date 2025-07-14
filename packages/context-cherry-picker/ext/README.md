# F-UX: Context Cherry Picker

A standalone extension for advanced context selection and formatting, designed to help you quickly gather and prepare code context for large language models or documentation.

## Features

- **Context Explorer**: A dedicated tree view to browse your workspace.
- **Cherry-Picking**: Check files and folders to include them in the final context output.
- **Quick Settings**: A webview panel to quickly toggle visibility of file groups (e.g., build artifacts, config files) and control output formatting.
- **Save & Load States**: Save a set of checked items as a named state and reload it later.
- **Copy Context**: Generate a comprehensive context block including a project tree and the contents of all checked files, and copy it to the clipboard.

### Commands

- **CCP: Save Checked State**: Saves the currently checked items in the Context Explorer.
- **CCP: Refresh Explorer**: Manually refreshes the file and folder views.
- **CCP: Delete Saved State**: Deletes a previously saved state.
- **CCP: Load Saved State**: Loads a saved state, checking the corresponding items in the explorer.
- **CCP: Clear All Checked Items**: Unchecks all items in the Context Explorer.
- **CCP: Copy Context of Checked Items**: Gathers the context from all checked items and copies it to the clipboard.

## Configuration

This extension can be configured via your VS Code `settings.json` or, preferably, through a `.FocusedUX` file in the root of your workspace for project-specific settings.

- `ccp.ignoreGlobs`: Glob patterns for files/folders to completely ignore.
- `ccp.google.apiKey`: Your API Key for Google Generative AI services, used for accurate token counting.

## License

This project is licensed under the MIT License.
