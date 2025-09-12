import type { ExtensionContext } from 'vscode'
import { Uri } from 'vscode'
import {
	dynamiconsConstants,
	IconActionsService,
	IconThemeGeneratorService,
	ConfigurationService,
	IconDiscoveryService,
	IconPickerService,
} from '@fux/dynamicons-core'

import {
	WindowAdapter,
	CommandsAdapter,
	WorkspaceAdapter,
	ContextAdapter,
	PathAdapter,
	FileSystemAdapter,
	QuickPickAdapter,
	CommonUtilsAdapter,
	UriAdapter,
} from './adapters/index.js'
import { AssetPathResolver } from './utils/asset-path-resolver.js'

const EXT_NAME = 'dynamicons'
const CONFIG_PREFIX = dynamiconsConstants.configPrefix
const COMMANDS = dynamiconsConstants.commands
const ICON_THEME_ID = dynamiconsConstants.iconThemeId
const CONFIG_KEYS = dynamiconsConstants.configKeys
const DEFAULT_FILENAMES = dynamiconsConstants.defaults

// Prevent multiple activations
let isActivated = false
let isRegenerating = false
let isThemeInitialized = false

async function getGeneratedThemePath(context: ExtensionContext, workspace: any): Promise<Uri> {
	const config = workspace.getConfiguration(CONFIG_PREFIX) as { get: <T>(key: string, defaultValue?: T) => T | undefined }
	const generatedThemeFileName = config.get<string>(
		CONFIG_KEYS.generatedThemeFileName,
		DEFAULT_FILENAMES.generatedThemeFilenameDefault,
	)

	// Use asset path resolver to get the theme path from the assets package
	const themePath = AssetPathResolver.getThemePath(generatedThemeFileName || '')
	const fullUri = Uri.file(themePath)
	
	if (!fullUri || fullUri.fsPath.trim() === '') {
		throw new Error('Generated theme URI is empty or invalid')
	}
	
	return fullUri
}

async function getBaseThemePath(context: ExtensionContext, workspace: any): Promise<Uri> {
	const config = workspace.getConfiguration(CONFIG_PREFIX) as { get: <T>(key: string, defaultValue?: T) => T | undefined }
	const baseThemeFileName = config.get<string>(
		CONFIG_KEYS.baseThemeFileName,
		DEFAULT_FILENAMES.baseThemeFilenameDefault,
	)

	// Use asset path resolver to get the theme path from the assets package
	const themePath = AssetPathResolver.getThemePath(baseThemeFileName || '')
	const fullUri = Uri.file(themePath)
	
	if (!fullUri || fullUri.fsPath.trim() === '') {
		throw new Error('Base theme URI is empty or invalid')
	}
	
	return fullUri
}

async function ensureThemeAssets(context: ExtensionContext, fileSystem: any, uriAdapter: any, window: any): Promise<void> {
	// With direct imports from assets package, we don't need to ensure local assets
	// The assets are available directly from the @fux/dynamicons-assets package
	// This function is kept for compatibility but no longer needs to create local assets
	
	const baseThemeUri = await getBaseThemePath(context, new WorkspaceAdapter())
	const generatedThemeUri = await getGeneratedThemePath(context, new WorkspaceAdapter())

	// Check if base theme exists in assets package
	try {
		await fileSystem.access(baseThemeUri)
	}
	catch {
		// If base theme doesn't exist in assets package, create a default one
		const defaultBaseManifest = {
			iconDefinitions: {
				_file: { iconPath: './icons/file.svg' },
			},
			file: '_file',
		}

		await fileSystem.writeFile(baseThemeUri, `${JSON.stringify(defaultBaseManifest, null, 4)}\n`)

		await window.showInformationMessage(
			`${dynamiconsConstants.featureName}: Created default base theme at ${baseThemeUri.fsPath}. Consider generating a full one.`,
		)
	}

	// Generated theme will be created by the theme generation process
	try {
		await fileSystem.access(generatedThemeUri)
	}
	catch (_error) {
		// File doesn't exist, that's okay - it will be generated later
	}
}

async function regenerateAndApplyTheme(
	context: ExtensionContext,
	iconThemeGeneratorService: any,
	workspaceService: any,
	fileSystem: any,
	uriAdapter: any,
	window: any,
): Promise<void> {
	if (isRegenerating) {
		return
	}

	isRegenerating = true
	
	try {
		const config = workspaceService.getConfiguration(CONFIG_PREFIX) as { get: <T>(key: string, defaultValue?: T) => T | undefined }
		const userIconsDir = config.get(CONFIG_KEYS.userIconsDirectory) as string | undefined
		const customMappings = config.get(CONFIG_KEYS.customIconMappings) as Record<string, string> | undefined
		const hideArrows = config.get(CONFIG_KEYS.hideExplorerArrows) as boolean | null | undefined

		const baseThemeUri = await getBaseThemePath(context, workspaceService)
		const generatedThemeUri = await getGeneratedThemePath(context, workspaceService)
		const generatedThemeDirUri = uriAdapter.dirname(generatedThemeUri)

		// Log current theme file contents before regeneration (only for comparison)
		let _currentTheme: any = null

		try {
			// Check if the file exists and has content
			const stats = await fileSystem.stat(generatedThemeUri)

			if (stats.size > 0) {
				const currentThemeContent = await fileSystem.readFile(generatedThemeUri, 'utf8')

				_currentTheme = JSON.parse(currentThemeContent)
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
			await iconThemeGeneratorService.writeIconThemeFile(newManifest, generatedThemeUri)
			
			// Add a minimal delay to ensure VS Code has time to detect the file change
			await new Promise(resolve => setTimeout(resolve, 50))
		}
		else {
			await window.showErrorMessage(`${dynamiconsConstants.featureName}: Failed to generate icon theme manifest.`)
		}
	}
	catch (error: any) {
		await window.showErrorMessage(`${dynamiconsConstants.featureName}: Error regenerating theme: ${error.message}`)
	}
	finally {
		isRegenerating = false
	}
}

async function refreshFileExplorer(workspaceService: any): Promise<void> {
	const workbenchConfig = workspaceService.getConfiguration('workbench')
	
	await workbenchConfig.update('settings.openDefaultSettings', true)
	await workbenchConfig.update('settings.openDefaultSettings', false)
}

async function activateIconThemeIfNeeded(context: ExtensionContext, workspaceService: any, fileSystem: any, window: any): Promise<void> {
	const workbenchConfig = workspaceService.getConfiguration('workbench')
	const currentTheme = workbenchConfig.get('iconTheme') as string | undefined

	if (currentTheme !== ICON_THEME_ID) {
		const generatedThemeUri = await getGeneratedThemePath(context, workspaceService)

		try {
			await fileSystem.access(generatedThemeUri)

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

async function checkIfThemeNeedsRegeneration(
	context: ExtensionContext,
	workspaceService: any,
	fileSystem: any,
	iconThemeGeneratorService: any,
	uriAdapter: any,
): Promise<boolean> {
	const config = workspaceService.getConfiguration(CONFIG_PREFIX) as { get: <T>(key: string, defaultValue?: T) => T | undefined }
	const userIconsDir = config.get(CONFIG_KEYS.userIconsDirectory) as string | undefined
	const customMappings = config.get(CONFIG_KEYS.customIconMappings) as Record<string, string> | undefined
	const hideArrows = config.get(CONFIG_KEYS.hideExplorerArrows) as boolean | null | undefined

	// Check if any settings exist that would affect theme generation
	const hasRelevantSettings = userIconsDir || (customMappings && Object.keys(customMappings).length > 0) || hideArrows !== null

	if (!hasRelevantSettings) {
		return false
	}

	try {
		const generatedThemeUri = await getGeneratedThemePath(context, workspaceService)
		const baseThemeUri = await getBaseThemePath(context, workspaceService)
		const generatedThemeDirUri = uriAdapter.dirname(generatedThemeUri)

		// Check if generated theme file exists
		try {
			await fileSystem.access(generatedThemeUri)
		}
		catch {
			return true
		}

		// Read current generated theme
		let currentTheme: any = null

		try {
			const currentThemeContent = await fileSystem.readFile(generatedThemeUri, 'utf8')

			currentTheme = JSON.parse(currentThemeContent)
		}
		catch (_error) {
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
			return true
		}

		return false
	}
	catch (_error) {
		// If we can't determine, err on the side of regeneration
		return true
	}
}

export async function activate(context: ExtensionContext): Promise<void> {
	if (isActivated) {
		return
	}
	
	isActivated = true

	// Create adapters
	const windowAdapter = new WindowAdapter()
	const commandsAdapter = new CommandsAdapter()
	const workspaceAdapter = new WorkspaceAdapter()
	const contextAdapter = new ContextAdapter(context)
	const pathAdapter = new PathAdapter()
	const fileSystemAdapter = new FileSystemAdapter()
	const quickPickAdapter = new QuickPickAdapter()
	const uriAdapter = new UriAdapter()
	const commonUtilsAdapter = new CommonUtilsAdapter(windowAdapter)

	// Create core services
	const iconThemeGeneratorService = new IconThemeGeneratorService(
		fileSystemAdapter,
		pathAdapter,
		commonUtilsAdapter,
		uriAdapter,
	)

	// Create missing dependencies for IconActionsService
	const configService = new ConfigurationService(workspaceAdapter, commonUtilsAdapter)
	const iconDiscoveryService = new IconDiscoveryService(
		fileSystemAdapter,
		pathAdapter,
		commonUtilsAdapter,
		contextAdapter.extensionPath,
		uriAdapter,
	)
	const iconPickerService = new IconPickerService(
		windowAdapter,
		quickPickAdapter,
		fileSystemAdapter,
		commonUtilsAdapter,
		iconDiscoveryService,
		configService,
		uriAdapter,
	)

	const iconActionsService = new IconActionsService(
		contextAdapter,
		windowAdapter,
		commandsAdapter,
		pathAdapter,
		commonUtilsAdapter,
		fileSystemAdapter,
		iconThemeGeneratorService,
		configService,
		iconPickerService,
		uriAdapter,
	)

	try {
		await ensureThemeAssets(context, fileSystemAdapter, uriAdapter, windowAdapter)
	}
	catch (_error) {
		// Continue if theme assets setup fails
	}
	
	// Check if theme regeneration is needed on first load
	if (!isThemeInitialized) {
		let needsRegeneration = false

		try {
			needsRegeneration = await checkIfThemeNeedsRegeneration(
				context,
				workspaceAdapter,
				fileSystemAdapter,
				iconThemeGeneratorService,
				uriAdapter,
			)
		}
		catch (_error) {
			// Continue if check fails
		}
		
		if (needsRegeneration) {
			try {
				await regenerateAndApplyTheme(
					context,
					iconThemeGeneratorService,
					workspaceAdapter,
					fileSystemAdapter,
					uriAdapter,
					windowAdapter,
				)
			}
			catch (_error) {
				// Continue if regeneration fails
			}
			
			// Force VS Code to reload the icon theme on first load (only if theme is currently active)
			try {
				const workbenchConfig = workspaceAdapter.getConfiguration('workbench')
				const currentTheme = workbenchConfig.get('iconTheme')

				if (currentTheme === ICON_THEME_ID) {
					// Temporarily switch themes for immediate visual update
					await workbenchConfig.update('iconTheme', 'vs-seti-file-icons', true)
					await new Promise(resolve => setTimeout(resolve, 25))
					await workbenchConfig.update('iconTheme', ICON_THEME_ID, true)
				}
			}
			catch (_error) {
				// Continue if refresh fails
			}
		}
		
		isThemeInitialized = true
	}
	
	try {
		await activateIconThemeIfNeeded(context, workspaceAdapter, fileSystemAdapter, windowAdapter)
	}
	catch (_error) {
		// Continue if activation fails
	}

	// Register commands
	context.subscriptions.push(
		commandsAdapter.registerCommand(COMMANDS.activateIconTheme, async () => {
			const workbenchConfig = workspaceAdapter.getConfiguration('workbench')

			await workbenchConfig.update('iconTheme', ICON_THEME_ID, true)
			await windowAdapter.showInformationMessage(`"${ICON_THEME_ID}" icon theme activated.`)
		}),
		commandsAdapter.registerCommand(COMMANDS.assignIcon, async (uri?: Uri, uris?: Uri[]) => {
			const finalUris = uris && uris.length > 0 ? uris : (uri ? [uri] : [])
			const adaptedUris = finalUris.map(u => uriAdapter.create(u))

			await iconActionsService.assignIconToResource(adaptedUris, workspaceAdapter)
		}),
		commandsAdapter.registerCommand(COMMANDS.revertIcon, async (uri?: Uri, uris?: Uri[]) => {
			const finalUris = uris && uris.length > 0 ? uris : (uri ? [uri] : [])
			const adaptedUris = finalUris.map(u => uriAdapter.create(u))

			await iconActionsService.revertIconAssignment(adaptedUris, workspaceAdapter)
		}),
		commandsAdapter.registerCommand(COMMANDS.toggleExplorerArrows, async () => await iconActionsService.toggleExplorerArrows(workspaceAdapter)),
		commandsAdapter.registerCommand(COMMANDS.showUserFileIconAssignments, () => iconActionsService.showUserIconAssignments('file')),
		commandsAdapter.registerCommand(COMMANDS.showUserFolderIconAssignments, () => iconActionsService.showUserIconAssignments('folder')),
		commandsAdapter.registerCommand(COMMANDS.refreshIconTheme, async () => {
			await regenerateAndApplyTheme(
				context,
				iconThemeGeneratorService,
				workspaceAdapter,
				fileSystemAdapter,
				uriAdapter,
				windowAdapter,
			)
			
			// Force VS Code to reload the icon theme immediately
			const workbenchConfig = workspaceAdapter.getConfiguration('workbench')
			const currentTheme = workbenchConfig.get('iconTheme')

			if (currentTheme === ICON_THEME_ID) {
				// Temporarily switch themes for immediate visual update
				await workbenchConfig.update('iconTheme', 'vs-seti-file-icons', true)
				await new Promise(resolve => setTimeout(resolve, 25))
				await workbenchConfig.update('iconTheme', ICON_THEME_ID, true)
			}
			
			await windowAdapter.showInformationMessage(`${dynamiconsConstants.featureName}: Icon theme manually refreshed.`)
		}),
		commandsAdapter.registerCommand('dynamicons.refreshFileExplorer', async () => {
			try {
				await refreshFileExplorer(workspaceAdapter)
				await windowAdapter.showInformationMessage(`${dynamiconsConstants.featureName}: File explorer refreshed.`)
			}
			catch (error) {
				await windowAdapter.showErrorMessage(`${dynamiconsConstants.featureName}: Error refreshing file explorer: ${error}`)
			}
		}),
		// Configuration change listener - automatically regenerate theme when settings change
		workspaceAdapter.onDidChangeConfiguration(async (e: any) => {
			if (
				e.affectsConfiguration(`${CONFIG_PREFIX}.${CONFIG_KEYS.customIconMappings}`)
				|| e.affectsConfiguration(`${CONFIG_PREFIX}.${CONFIG_KEYS.userIconsDirectory}`)
				|| e.affectsConfiguration(`${CONFIG_PREFIX}.${CONFIG_KEYS.hideExplorerArrows}`)
				|| e.affectsConfiguration(`${CONFIG_PREFIX}.${CONFIG_KEYS.baseThemeFileName}`)
				|| e.affectsConfiguration(`${CONFIG_PREFIX}.${CONFIG_KEYS.generatedThemeFileName}`)
			) {
				await regenerateAndApplyTheme(
					context,
					iconThemeGeneratorService,
					workspaceAdapter,
					fileSystemAdapter,
					uriAdapter,
					windowAdapter,
				)
			}
		}),
	)
}

export function deactivate(): void {
	isActivated = false
	isThemeInitialized = false
}
