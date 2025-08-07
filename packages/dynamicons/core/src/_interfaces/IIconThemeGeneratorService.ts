import type { IUri } from '@fux/shared'

export interface IIconThemeGeneratorService {
	generateIconThemeManifest: (
		baseManifestUri: IUri,
		generatedThemeDirUri: IUri,
		userIconsDirectory?: string,
		customMappings?: Record<string, string>,
		hideExplorerArrows?: boolean | null,
	) => Promise<Record<string, any> | undefined>

	writeIconThemeFile: (manifest: Record<string, any>, outputPathUri: IUri) => Promise<void>
}
