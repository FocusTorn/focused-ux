export const assetConstants = {
	externalIconSource: 'D:/_dev/!Projects/_fux/icons',
	deleteOriginalSvg: false, // Set to true to move (delete original), false to copy
	paths: {
		newIconsDir: 'assets/icons/new_icons',
		fileIconsDir: 'assets/icons/file_icons',
		folderIconsDir: 'assets/icons/folder_icons',
		distImagesDir: 'dist/assets/images/preview-images',
		distThemesDir: 'dist/assets/themes',
		modelsDir: 'src/models',
	},
	fileTypes: {
		allowed: ['.svg'],
		ignored: ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp'],
	},
	iconNaming: {
		folderPrefix: 'folder-',
		filePrefix: '', // Any icon not starting with 'folder-'
	},
} as const
