# F-UX: Dynamicons

A dynamic and customizable icon theme for a focused user experience. Dynamicons allows for runtime customization of file, folder, and language icons without requiring a full extension reload.

## Features

- **Dynamic Theme Generation**: The icon theme is generated on the fly, allowing for user customizations to be applied instantly.
- **Custom Icon Assignments**: Assign any built-in or user-provided SVG icon to specific files or folders.
- **User-Provided Icons**: Specify a directory of your own SVG icons to be used in assignments.
- **Toggle Explorer Arrows**: Hide or show the explorer arrows for a cleaner look.

### Commands

- **Dynamicons: Activate Icon Theme**: Sets Dynamicons as the active icon theme.
- **Assign Icon to File/Folder...**: Opens a Quick Pick menu to assign an icon to the selected resource(s).
- **Revert Icon Assignment**: Removes a custom icon assignment from the selected resource(s).
- **Dynamicons: Toggle Explorer Arrow Visibility**: Toggles the visibility of the arrows next to folders in the explorer.
- **Dynamicons: Refresh Icon Theme**: Manually regenerates and applies the icon theme.

## Configuration

- `dynamicons.userIconsDirectory`: Path to a directory containing custom user-provided SVG icons.
- `dynamicons.customIconMappings`: User-defined custom icon mappings. It's recommended to manage this via the provided commands.
- `dynamicons.hideExplorerArrows`: Set to `true` to hide explorer arrows, `false` to show them.

## License

This project is licensed under the MIT License.
