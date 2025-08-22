import type { Uri } from 'vscode'

export interface IIconThemeGeneratorService {
	generateIconThemeManifest: (
		baseManifestUri: Uri,
		generatedThemeDirUri: Uri,
		userIconsDirectory?: string,
		customMappings?: Record<string, string>,
		hideExplorerArrows?: boolean | null,
	) => Promise<Record<string, any> | undefined>

	writeIconThemeFile: (manifest: Record<string, any>, outputPathUri: Uri) => Promise<void>
}
