/**
 * Asset Processing Constants
 * Configuration for the complete asset processing workflow
 */
export const assetConstants = {
	// External source configuration
	externalIconSource: 'D:/_dev/_Projects/_fux/icons',
	deleteOriginalSvg: false, // Set to true to move (delete original), false to copy
	
	// Directory structure paths
	paths: {
		newIconsDir: 'assets/icons/new_icons',
		fileIconsDir: 'assets/icons/file_icons',
		folderIconsDir: 'assets/icons/folder_icons',
		languageIconsDir: 'assets/icons/file_icons', // Language icons use the same directory as file icons
		distImagesDir: 'dist/assets/images/preview-images',
		distPreviewImagesDir: 'dist/assets/images/preview-images',
		distIconsDir: 'dist/assets/icons',
		distThemesDir: 'dist/assets/themes',
		modelsDir: 'src/models',
	},
	
	// File type filtering
	fileTypes: {
		allowed: ['.svg'],
		ignored: ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp'],
	},
	
	// Icon naming conventions
	iconNaming: {
		folderPrefix: 'folder-',
		filePrefix: '', // Any icon not starting with 'folder-'
		openFolderIconSuffix: '-open',
	},
	
	// Theme file names
	themeFiles: {
		baseTheme: 'base.theme.json',
		generatedTheme: 'dynamicons.theme.json',
	},
	
	// Processing options
	processing: {
		defaultConfigPath: 'svgo.config.mjs',
		defaultPreviewSize: 32,
	},
} as const
