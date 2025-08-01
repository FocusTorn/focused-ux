// ESLint & Imports -->>

import type { Dirent } from 'node:fs'
import { constants as fsConstants } from 'node:fs'
import { dynamiconsConstants } from '../_config/dynamicons.constants.js'
import type { IIconThemeGeneratorService } from '../_interfaces/IIconThemeGeneratorService.js'
import type { ICommonUtils } from '../_interfaces/ICommonUtils.js'
import type { IFileSystem } from '../_interfaces/IFileSystem.js'
import type { IPath } from '../_interfaces/IPath.js'
import stripJsonCommentsModule from 'strip-json-comments'

// Handle both default and direct exports
const stripJsonComments = (stripJsonCommentsModule as any).default || stripJsonCommentsModule

//--------------------------------------------------------------------------------------------------------------<<

interface IconDefinition {
	iconPath: string
}

interface ThemeManifest {
	iconDefinitions: Record<string, IconDefinition>
	folderNames?: Record<string, string>
	folderNamesExpanded?: Record<string, string>
	fileExtensions?: Record<string, string>
	fileNames?: Record<string, string>
	languageIds?: Record<string, string>
	file?: string
	folder?: string
	folderExpanded?: string
	rootFolder?: string
	rootFolderExpanded?: string
	hidesExplorerArrows?: boolean
	[key: string]: any
}

export class IconThemeGeneratorService implements IIconThemeGeneratorService {

	constructor(
		private readonly fileSystem: IFileSystem,
		private readonly path: IPath,
		private readonly commonUtils: ICommonUtils,
	) {}

	private readJsonFileSync<T = any>(filePath: string, encoding: BufferEncoding = 'utf-8'): T | undefined {
		try {
			const fileContent = this.fileSystem.readFileSync(filePath, encoding)
			const contentWithoutComments = stripJsonComments(fileContent.toString())

			return JSON.parse(contentWithoutComments) as T
		}
		catch (error) {
			this.commonUtils.errMsg(`Error reading or parsing JSON file synchronously: ${filePath}`, error)
			return undefined
		}
	}

	public async generateIconThemeManifest(
		baseManifestPath: string,
		generatedThemeDir: string,
		userIconsDirectory?: string,
		customMappings?: Record<string, string>,
		hideExplorerArrows?: boolean | null,
	): Promise<Record<string, any> | undefined> {
		const manifest = this.readJsonFileSync<ThemeManifest>(baseManifestPath)

		if (!manifest) {
			this.commonUtils.errMsg(`[IconThemeGeneratorService] Base manifest not found or failed to parse at: ${baseManifestPath}`)
			return undefined
		}



		manifest.iconDefinitions = manifest.iconDefinitions || {}

		if (userIconsDirectory) {
			try {
				await this.fileSystem.access(userIconsDirectory, fsConstants.R_OK)

				const files = await this.fileSystem.readdir(userIconsDirectory, { withFileTypes: true }) as Dirent[]

				for (const file of files) {
					if (file.isFile() && file.name.endsWith('.svg')) {
						const iconName = file.name.replace(/\.svg$/, '')
						const definitionKey = `${dynamiconsConstants.defaults.userIconDefinitionPrefix}${iconName}`
						const absoluteUserIconFilePath = this.path.join(userIconsDirectory, file.name)
						const relativeIconPath = this.path.relative(generatedThemeDir, absoluteUserIconFilePath).replace(/\\/g, '/')

						manifest.iconDefinitions[definitionKey] = {
							iconPath: relativeIconPath,
						}
					}
				}
			}
			catch (error) {
				this.commonUtils.errMsg(`[IconThemeGeneratorService] Error accessing user icons directory '${userIconsDirectory}':`, error)
			}
		}

		if (customMappings) {
			for (const key in customMappings) {
				const value = customMappings[key]

				if (key.startsWith(dynamiconsConstants.associationKeyPrefixes.file)) {
					const fileNameOrExt = key.substring(dynamiconsConstants.associationKeyPrefixes.file.length).trim()

					if (fileNameOrExt.includes('.')) {
						manifest.fileNames = manifest.fileNames || {}
						manifest.fileNames[fileNameOrExt] = value
					}
					else {
						manifest.fileExtensions = manifest.fileExtensions || {}
						manifest.fileExtensions[fileNameOrExt] = value
					}
				}
				else if (key.startsWith(dynamiconsConstants.associationKeyPrefixes.folder)) {
					const folderName = key.substring(dynamiconsConstants.associationKeyPrefixes.folder.length).trim()

					manifest.folderNames = manifest.folderNames || {}
					manifest.folderNamesExpanded = manifest.folderNamesExpanded || {}
					manifest.folderNames[folderName] = value

					let openDefinitionKey = value

					if (value.startsWith(dynamiconsConstants.defaults.iconThemeNamePrefix)) {
						const baseName = value.substring(dynamiconsConstants.defaults.iconThemeNamePrefix.length)

						openDefinitionKey = `${dynamiconsConstants.defaults.iconThemeNamePrefix}${baseName}${dynamiconsConstants.defaults.openFolderIconSuffix}`
					}
					else if (value.startsWith(dynamiconsConstants.defaults.userIconDefinitionPrefix)) {
						const baseName = value.substring(dynamiconsConstants.defaults.userIconDefinitionPrefix.length)

						openDefinitionKey = `${dynamiconsConstants.defaults.userIconDefinitionPrefix}${baseName}${dynamiconsConstants.defaults.openFolderIconSuffix}`
					}
					else {
						openDefinitionKey = `${value}${dynamiconsConstants.defaults.openFolderIconSuffix}`
					}
					if (manifest.iconDefinitions[openDefinitionKey]) {
						manifest.folderNamesExpanded[folderName] = openDefinitionKey
					}
					else {
						manifest.folderNamesExpanded[folderName] = value
					}
				}
				else if (key.startsWith(dynamiconsConstants.associationKeyPrefixes.language)) {
					const langId = key.substring(dynamiconsConstants.associationKeyPrefixes.language.length).trim()

					manifest.languageIds = manifest.languageIds || {}
					manifest.languageIds[langId] = value
				}
			}
			

		}

		if (hideExplorerArrows !== null && hideExplorerArrows !== undefined) {
			manifest.hidesExplorerArrows = hideExplorerArrows
		}
		else {
			delete manifest.hidesExplorerArrows
		}

		// Add a timestamp for debugging to confirm the file is being rewritten.
		manifest._lastUpdated = new Date().toISOString()

		// Enable VS Code's built-in file watching for automatic theme refresh
		manifest._watch = true



		return manifest
	}

	public async writeIconThemeFile(manifest: Record<string, any>, outputPath: string): Promise<void> {
		try {
			const manifestJsonString = JSON.stringify(manifest, null, 2)

			await this.fileSystem.writeFile(outputPath, manifestJsonString, 'utf-8')
		}
		catch (error) {
			this.commonUtils.errMsg(`[IconThemeGeneratorService] Failed to write icon theme manifest to ${outputPath}:`, error)
			throw error
		}
	}

}
