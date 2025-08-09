import type { ExtensionContext, Uri } from 'vscode'
import type { AwilixContainer } from 'awilix'
import { createDIContainer } from './injection.js'
import type { Cradle } from './injection.js'
import { dynamiconsConstants } from '@fux/dynamicons-core'
import type { IUri } from '@fux/shared'

const EXT_NAME = 'dynamicons'
const CONFIG_PREFIX = dynamiconsConstants.configPrefix
const COMMANDS = dynamiconsConstants.commands
const ICON_THEME_ID = dynamiconsConstants.iconThemeId
const CONFIG_KEYS = dynamiconsConstants.configKeys
const ASSETS_PATHS = dynamiconsConstants.assets
const DEFAULT_FILENAMES = dynamiconsConstants.defaults

// Prevent multiple activations
let isActivated = false
let isRegenerating = false
let isThemeInitialized = false

async function getGeneratedThemePath(context: ExtensionContext, container: AwilixContainer): Promise<IUri> {
	const workspace = container.resolve('workspace')
	const config = workspace.getConfiguration(CONFIG_PREFIX) as { get: <T>(key: string, defaultValue?: T) => T | undefined }
	const generatedThemeFileName = config.get<string>(
		CONFIG_KEYS.generatedThemeFileName,
		DEFAULT_FILENAMES.generatedThemeFilenameDefault,
	)

	const uriAdapter = container.resolve('uriAdapter')
	const baseUri = uriAdapter.create(context.extensionUri)
	
	const fullUri = uriAdapter.joinPath(baseUri, ASSETS_PATHS.themesPath, generatedThemeFileName)
	
	// console.log(`[dynamicons] Constructing generated theme URI:`)
	// console.log(`  - extensionUri: ${context.extensionUri.toString()}`)
	// console.log(`  - themesPath: ${ASSETS_PATHS.themesPath}`)
	// console.log(`  - generatedThemeFileName: ${generatedThemeFileName}`)
	// console.log(`  - fullUri.fsPath: ${fullUri.fsPath}`)
	
	if (!fullUri || fullUri.fsPath.trim() === '') {
		throw new Error('Generated theme URI is empty or invalid')
	}
	
	return fullUri
}

async function getBaseThemePath(context: ExtensionContext, container: AwilixContainer): Promise<IUri> {
	const workspace = container.resolve('workspace')
	const config = workspace.getConfiguration(CONFIG_PREFIX) as { get: <T>(key: string, defaultValue?: T) => T | undefined }
	const baseThemeFileName = config.get<string>(
		CONFIG_KEYS.baseThemeFileName,
		DEFAULT_FILENAMES.baseThemeFilenameDefault,
	)

	const uriAdapter = container.resolve('uriAdapter')
	const baseUri = uriAdapter.create(context.extensionUri)

	const fullUri = uriAdapter.joinPath(baseUri, ASSETS_PATHS.themesPath, baseThemeFileName)

	// console.log(`[dynamicons] Constructing base theme URI:`)
	// console.log(`  - extensionUri: ${context.extensionUri.toString()}`)
	// console.log(`  - themesPath: ${ASSETS_PATHS.themesPath}`)
	// console.log(`  - baseThemeFileName: ${baseThemeFileName}`)
	// console.log(`  - fullUri.fsPath: ${fullUri.fsPath}`)
	
	if (!fullUri || fullUri.fsPath.trim() === '') {
		throw new Error('Base theme URI is empty or invalid')
	}
	
	return fullUri
}

async function ensureThemeAssets(context: ExtensionContext, container: AwilixContainer): Promise<void> {
	const fileSystem = container.resolve('fileSystem')
	const uriAdapter = container.resolve('uriAdapter')

	const themesDirUri = uriAdapter.joinPath(uriAdapter.create(context.extensionUri), ASSETS_PATHS.themesPath)
	const baseThemeUri = await getBaseThemePath(context, container)
	const generatedThemeUri = await getGeneratedThemePath(context, container)

	try {
		await fileSystem.access(themesDirUri)
	}
	catch {
		await fileSystem.mkdir(themesDirUri, { recursive: true })
	}

	const defaultBaseManifest = {
		iconDefinitions: {
			_file: { iconPath: './icons/file.svg' },
		},
		file: '_file',
	}

	try {
		await fileSystem.access(baseThemeUri)
	}
	catch {
		await fileSystem.writeFile(baseThemeUri, `${JSON.stringify(defaultBaseManifest, null, 4)}\n`)

		const window = container.resolve('window')

		await window.showInformationMessage(
			`${dynamiconsConstants.featureName}: Created default base theme at ${baseThemeUri.fsPath}. Consider generating a full one.`,
		)
	}

	try {
		await fileSystem.access(generatedThemeUri)
	}
	catch (_error) {
		// File doesn't exist, that's okay - it will be generated later
	}
}

async function regenerateAndApplyTheme(context: ExtensionContext, container: AwilixContainer): Promise<void> { //>
	if (isRegenerating) {
		// console.log(`[${EXT_NAME}] Theme regeneration already in progress, skipping...`)
		return
	}

	isRegenerating = true
	
	try {
		const iconThemeGeneratorService = container.resolve('iconThemeGeneratorService')
		const workspaceService = container.resolve('workspace')
		const fileSystem = container.resolve('fileSystem')
		const uriAdapter = container.resolve('uriAdapter')

		const config = workspaceService.getConfiguration(CONFIG_PREFIX) as { get: <T>(key: string, defaultValue?: T) => T | undefined }
		const userIconsDir = config.get(CONFIG_KEYS.userIconsDirectory) as string | undefined
		const customMappings = config.get(CONFIG_KEYS.customIconMappings) as Record<string, string> | undefined
		const hideArrows = config.get(CONFIG_KEYS.hideExplorerArrows) as boolean | null | undefined

		const baseThemeUri = await getBaseThemePath(context, container)
		const generatedThemeUri = await getGeneratedThemePath(context, container)
		const generatedThemeDirUri = uriAdapter.dirname(generatedThemeUri)

		// Log current theme file contents before regeneration (only for comparison)
		let currentTheme: any = null

		try {
			// Check if the file exists and has content
			const stats = await fileSystem.stat(generatedThemeUri)

			if (stats.size > 0) {
				const currentThemeContent = await fileSystem.readFile(generatedThemeUri, 'utf8')

				currentTheme = JSON.parse(currentThemeContent)
			}
		}
		catch (_error) {
			// Could not read current theme file, that's okay
		}

		const newManifest = await iconThemeGeneratorService.generateIconThemeManifest(
			baseThemeUri,
			generatedThemeDirUri,
			userIconsDir || undefined,
			customMappings,
			hideArrows,
		)

		if (newManifest) {
			// console.log(`[${EXT_NAME}] Writing theme file to: ${generatedThemeUri.fsPath}`)
			await iconThemeGeneratorService.writeIconThemeFile(newManifest, generatedThemeUri)
			
			// Show only the specific items that were changed
			if (customMappings) {
				// console.log(`[${EXT_NAME}] === ASSIGNED ITEMS SUMMARY ===`)

				let changedItemsCount = 0
				
				for (const [key, _value] of Object.entries(customMappings)) {
					// Extract the actual name from the key (e.g., "folder:deploy" -> "deploy")
					const actualName = key.includes(':') ? key.split(':')[1] : key
					
					// Determine which section to check based on the key prefix
					let beforeInTheme = 'NOT FOUND'
					let afterInTheme = 'NOT FOUND'
					
					if (key.startsWith('folder:')) {
						beforeInTheme = currentTheme?.folderNames?.[actualName] || 'NOT FOUND'
						afterInTheme = newManifest.folderNames?.[actualName] || 'NOT FOUND'
					}
					else if (key.startsWith('file:')) {
						if (actualName.includes('.')) {
							beforeInTheme = currentTheme?.fileNames?.[actualName] || 'NOT FOUND'
							afterInTheme = newManifest.fileNames?.[actualName] || 'NOT FOUND'
						}
						else {
							beforeInTheme = currentTheme?.fileExtensions?.[actualName] || 'NOT FOUND'
							afterInTheme = newManifest.fileExtensions?.[actualName] || 'NOT FOUND'
						}
					}
					
					// Only show items that actually changed
					if (beforeInTheme !== afterInTheme) {
						// console.log(`[${EXT_NAME}] ${actualName}: ${beforeInTheme} → ${afterInTheme}`)
						changedItemsCount++
					}
				}
				
				if (changedItemsCount === 0) {
					// console.log(`[${EXT_NAME}] No items changed in theme file`)
				}
				
				// console.log(`[${EXT_NAME}] === END ASSIGNED ITEMS ===`)
			}
			
			// Add a minimal delay to ensure VS Code has time to detect the file change
			await new Promise(resolve => setTimeout(resolve, 50))
		}
		else {
			const window = container.resolve('window')

			await window.showErrorMessage(`${dynamiconsConstants.featureName}: Failed to generate icon theme manifest.`)
		}
	}
	catch (error: any) {
		const window = container.resolve('window')

		await window.showErrorMessage(`${dynamiconsConstants.featureName}: Error regenerating theme: ${error.message}`)
	}
	finally {
		isRegenerating = false
	}
} //<

async function refreshFileExplorer(context: ExtensionContext, container: AwilixContainer): Promise<void> {
	const workspaceService = container.resolve('workspace')
	const workbenchConfig = workspaceService.getConfiguration('workbench')
	
	await workbenchConfig.update('settings.openDefaultSettings', true)
	await workbenchConfig.update('settings.openDefaultSettings', false)
}

async function activateIconThemeIfNeeded(context: ExtensionContext, container: AwilixContainer): Promise<void> {
	const workspaceService = container.resolve('workspace')
	const fileSystem = container.resolve('fileSystem')

	const workbenchConfig = workspaceService.getConfiguration('workbench')
	const currentTheme = workbenchConfig.get('iconTheme') as string | undefined

	if (currentTheme !== ICON_THEME_ID) {
		const generatedThemeUri = await getGeneratedThemePath(context, container)

		try {
			await fileSystem.access(generatedThemeUri)

			const window = container.resolve('window')
			const choice = await window.showInformationMessage(
				`The "${EXT_NAME}" extension provides an icon theme. Do you want to activate it?`,
				'Activate',
				'Later',
			)

			if (choice === 'Activate') {
				await workbenchConfig.update('iconTheme', ICON_THEME_ID, true) // true for global
			}
		}
		catch {
			// Theme file doesn't exist, do nothing.
		}
	}
}

async function checkIfThemeNeedsRegeneration(context: ExtensionContext, container: AwilixContainer): Promise<boolean> {
	const workspaceService = container.resolve('workspace')
	const fileSystem = container.resolve('fileSystem')
	const iconThemeGeneratorService = container.resolve('iconThemeGeneratorService')
	const uriAdapter = container.resolve('uriAdapter')

	const config = workspaceService.getConfiguration(CONFIG_PREFIX) as { get: <T>(key: string, defaultValue?: T) => T | undefined }
	const userIconsDir = config.get(CONFIG_KEYS.userIconsDirectory) as string | undefined
	const customMappings = config.get(CONFIG_KEYS.customIconMappings) as Record<string, string> | undefined
	const hideArrows = config.get(CONFIG_KEYS.hideExplorerArrows) as boolean | null | undefined

	// Check if any settings exist that would affect theme generation
	const hasRelevantSettings = userIconsDir || (customMappings && Object.keys(customMappings).length > 0) || hideArrows !== null

	if (!hasRelevantSettings) {
		// console.log(`[${EXT_NAME}] No relevant settings found, theme regeneration not needed`)
		return false
	}

	try {
		const generatedThemeUri = await getGeneratedThemePath(context, container)
		const baseThemeUri = await getBaseThemePath(context, container)
		const generatedThemeDirUri = uriAdapter.dirname(generatedThemeUri)

		// Check if generated theme file exists
		try {
			await fileSystem.access(generatedThemeUri)
		}
		catch {
			// console.log(`[${EXT_NAME}] Generated theme file doesn't exist, regeneration needed`)
			return true
		}

		// Read current generated theme
		let currentTheme: any = null

		try {
			const currentThemeContent = await fileSystem.readFile(generatedThemeUri, 'utf8')

			currentTheme = JSON.parse(currentThemeContent)
		}
		catch (_error) {
			// console.log(`[${EXT_NAME}] Error reading current theme file, regeneration needed:`, _error)
			return true
		}

		// Generate what the theme should look like with current settings
		const expectedTheme = await iconThemeGeneratorService.generateIconThemeManifest(
			baseThemeUri,
			generatedThemeDirUri,
			userIconsDir || undefined,
			customMappings,
			hideArrows,
		)

		if (!expectedTheme) {
			// console.log(`[${EXT_NAME}] Could not generate expected theme, regeneration needed`)
			return true
		}

		// Remove timestamp for comparison
		const currentThemeForComparison = { ...currentTheme }
		const expectedThemeForComparison = { ...expectedTheme }

		delete currentThemeForComparison._lastUpdated
		delete expectedThemeForComparison._lastUpdated

		// Compare the themes
		const currentThemeStr = JSON.stringify(currentThemeForComparison, null, 2)
		const expectedThemeStr = JSON.stringify(expectedThemeForComparison, null, 2)

		if (currentThemeStr !== expectedThemeStr) {
			// console.log(`[${EXT_NAME}] Current theme doesn't match expected theme, regeneration needed`)
			// console.log(`[${EXT_NAME}] Current theme size: ${currentThemeStr.length} chars`)
			// console.log(`[${EXT_NAME}] Expected theme size: ${expectedThemeStr.length} chars`)
			return true
		}

		// console.log(`[${EXT_NAME}] Current theme matches expected theme, no regeneration needed`)
		return false
	}
	catch (_error) {
		// console.log(`[${EXT_NAME}] Error checking theme regeneration need:`, _error)
		// If we can't determine, err on the side of regeneration
		return true
	}
}

export async function activate(context: ExtensionContext): Promise<void> { //>
	if (isActivated) {
		// console.log(`[${EXT_NAME}] Already activated, skipping...`)
		return
	}
	
	// console.log(`[${EXT_NAME}] Activating...`)
	isActivated = true

	const container = await createDIContainer(context)
	const iconActionsService = container.resolve('iconActionsService') as Cradle['iconActionsService']
	const uriAdapter = container.resolve('uriAdapter') as Cradle['uriAdapter']

	try {
		await ensureThemeAssets(context, container)
	}
	catch (_error) {
		// console.log(`[${EXT_NAME}] Error during theme assets setup, continuing...`, _error)
	}
	
	// Check if theme regeneration is needed on first load
	if (!isThemeInitialized) {
		// console.log(`[${EXT_NAME}] First load detected, checking if theme regeneration is needed...`)
		
		let needsRegeneration = false

		try {
			// Use the new comprehensive check that considers user settings
			needsRegeneration = await checkIfThemeNeedsRegeneration(context, container)
		}
		catch (_error) {
			// console.log(`[${EXT_NAME}] Error checking theme regeneration need, skipping regeneration...`, _error)
		}
		
		if (needsRegeneration) {
			try {
				await regenerateAndApplyTheme(context, container)
			}
			catch (_error) {
				// console.log(`[${EXT_NAME}] Error during theme regeneration, continuing...`, _error)
			}
			
			// Force VS Code to reload the icon theme on first load (only if theme is currently active)
			try {
				const workspaceService = container.resolve('workspace') as Cradle['workspace']
				const workbenchConfig = workspaceService.getConfiguration('workbench')
				const currentTheme = workbenchConfig.get('iconTheme')

				if (currentTheme === ICON_THEME_ID) {
					// console.log(`[${EXT_NAME}] Forcing theme refresh on first load...`)

					// Use a more direct refresh method - trigger file explorer refresh
					const commands = container.resolve('commands')

					await commands.executeCommand('workbench.files.action.refreshFilesExplorer')
					// Also temporarily switch themes for immediate visual update
					await workbenchConfig.update('iconTheme', 'vs-seti-file-icons', true)
					await new Promise(resolve => setTimeout(resolve, 25))
					await workbenchConfig.update('iconTheme', ICON_THEME_ID, true)
				}
			}
			catch (_error) {
				// console.log(`[${EXT_NAME}] Error during force refresh, continuing...`, _error)
			}
		}
		
		isThemeInitialized = true
		// console.log(`[${EXT_NAME}] Theme initialization completed`)
	}
	else {
		// console.log(`[${EXT_NAME}] Theme already initialized, skipping regeneration`)
	}
	
	try {
		await activateIconThemeIfNeeded(context, container)
	}
	catch (_error) {
		// console.log(`[${EXT_NAME}] Error during icon theme activation, continuing...`, _error)
	}

	const commands = container.resolve('commands')
	const window = container.resolve('window')
	const workspace = container.resolve('workspace')
	
	context.subscriptions.push(
		commands.registerCommand(COMMANDS.activateIconTheme, async () => {
			const workspaceService = container.resolve('workspace') as Cradle['workspace']
			const workbenchConfig = workspaceService.getConfiguration('workbench')

			await workbenchConfig.update('iconTheme', ICON_THEME_ID, true)
			await window.showInformationMessage(`"${ICON_THEME_ID}" icon theme activated.`)
		}),
		commands.registerCommand(COMMANDS.assignIcon, (uri?: Uri, uris?: Uri[]) => {
			const finalUris = uris && uris.length > 0 ? uris : (uri ? [uri] : [])
			const adaptedUris = finalUris.map(u => uriAdapter.create(u))

			iconActionsService.assignIconToResource(adaptedUris)
		}),
		commands.registerCommand(COMMANDS.revertIcon, (uri?: Uri, uris?: Uri[]) => {
			const finalUris = uris && uris.length > 0 ? uris : (uri ? [uri] : [])
			const adaptedUris = finalUris.map(u => uriAdapter.create(u))

			iconActionsService.revertIconAssignment(adaptedUris)
		}),
		commands.registerCommand(COMMANDS.toggleExplorerArrows, () => iconActionsService.toggleExplorerArrows()),
		commands.registerCommand(COMMANDS.showUserFileIconAssignments, () => iconActionsService.showUserIconAssignments('file')),
		commands.registerCommand(COMMANDS.showUserFolderIconAssignments, () => iconActionsService.showUserIconAssignments('folder')),
		commands.registerCommand(COMMANDS.refreshIconTheme, async () => {
			await regenerateAndApplyTheme(context, container)
			
			// Force VS Code to reload the icon theme immediately
			const workspaceService = container.resolve('workspace') as Cradle['workspace']
			const workbenchConfig = workspaceService.getConfiguration('workbench')
			const currentTheme = workbenchConfig.get('iconTheme')

			if (currentTheme === ICON_THEME_ID) {
				// Trigger file explorer refresh for immediate visual update
				await commands.executeCommand('workbench.files.action.refreshFilesExplorer')
				// Also temporarily switch themes for immediate visual update
				await workbenchConfig.update('iconTheme', 'vs-seti-file-icons', true)
				await new Promise(resolve => setTimeout(resolve, 25))
				await workbenchConfig.update('iconTheme', ICON_THEME_ID, true)
			}
			
			await window.showInformationMessage(`${dynamiconsConstants.featureName}: Icon theme manually refreshed.`)
		}),
		commands.registerCommand('dynamicons.refreshFileExplorer', async () => {
			try {
				await refreshFileExplorer(context, container)
				await window.showInformationMessage(`${dynamiconsConstants.featureName}: File explorer refreshed.`)
			}
			catch (error) {
				await window.showErrorMessage(`${dynamiconsConstants.featureName}: Error refreshing file explorer: ${error}`)
			}
		}),
		workspace.onDidChangeConfiguration(async (e: any) => {
			if (
				e.affectsConfiguration(`${CONFIG_PREFIX}.${CONFIG_KEYS.customIconMappings}`)
				|| e.affectsConfiguration(`${CONFIG_PREFIX}.${CONFIG_KEYS.userIconsDirectory}`)
				|| e.affectsConfiguration(`${CONFIG_PREFIX}.${CONFIG_KEYS.hideExplorerArrows}`)
				|| e.affectsConfiguration(`${CONFIG_PREFIX}.${CONFIG_KEYS.baseThemeFileName}`)
				|| e.affectsConfiguration(`${CONFIG_PREFIX}.${CONFIG_KEYS.generatedThemeFileName}`)
			) {
				await regenerateAndApplyTheme(context, container)
				
				// Immediately refresh the file explorer to show changes
				try {
					await commands.executeCommand('workbench.files.action.refreshFilesExplorer')
				}
				catch (_error) {
					// console.log(`[${EXT_NAME}] Error refreshing file explorer after config change:`, _error)
				}
			}
		}),
	)
} //<

export function deactivate(): void {
	isActivated = false
	isThemeInitialized = false
}
