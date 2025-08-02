import type { ExtensionContext, Uri } from 'vscode'
import * as vscode from 'vscode'
import type { AwilixContainer } from 'awilix'
import { createDIContainer } from './injection.js'
import type { Cradle } from './injection.js'
import { dynamiconsConstants } from '@fux/dynamicons-core'

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

async function getGeneratedThemePath(context: ExtensionContext, container: AwilixContainer): Promise<string> {
	const path = container.resolve('path')
	const config = vscode.workspace.getConfiguration(CONFIG_PREFIX)
	const generatedThemeFileName = config.get<string>(
		CONFIG_KEYS.generatedThemeFileName,
		DEFAULT_FILENAMES.generatedThemeFilenameDefault,
	)

	return path.join(context.extensionPath, ASSETS_PATHS.themesPath, generatedThemeFileName)
}

async function getBaseThemePath(context: ExtensionContext, container: AwilixContainer): Promise<string> {
	const path = container.resolve('path')
	const config = vscode.workspace.getConfiguration(CONFIG_PREFIX)
	const baseThemeFileName = config.get<string>(
		CONFIG_KEYS.baseThemeFileName,
		DEFAULT_FILENAMES.baseThemeFilenameDefault,
	)

	return path.join(context.extensionPath, ASSETS_PATHS.themesPath, baseThemeFileName)
}

async function ensureThemeAssets(context: ExtensionContext, container: AwilixContainer): Promise<void> {
	const fileSystem = container.resolve('fileSystem')
	const path = container.resolve('path')

	const themesDir = path.join(context.extensionPath, ASSETS_PATHS.themesPath)
	const baseThemePath = await getBaseThemePath(context, container)
	const generatedThemePath = await getGeneratedThemePath(context, container)

	try {
		await fileSystem.access(themesDir)
	}
	catch {
		await fileSystem.mkdir(themesDir, { recursive: true })
	}

	const defaultBaseManifest = {
		iconDefinitions: {
			_file: { iconPath: './icons/file.svg' },
		},
		file: '_file',
	}

	try {
		await fileSystem.access(baseThemePath)
	}
	catch {
		await fileSystem.writeFile(baseThemePath, JSON.stringify(defaultBaseManifest, null, 2))
		vscode.window.showInformationMessage(
			`${dynamiconsConstants.featureName}: Created default base theme at ${baseThemePath}. Consider generating a full one.`,
		)
	}

	// Ensure the generated theme file exists (will be checked and regenerated if needed later)
	try {
		await fileSystem.access(generatedThemePath)
	} catch (error) {
		// File doesn't exist, that's okay - it will be generated later
	}
}

async function regenerateAndApplyTheme(context: ExtensionContext, container: AwilixContainer): Promise<void> {
	if (isRegenerating) {
		console.log(`[${EXT_NAME}] Theme regeneration already in progress, skipping...`)
		return
	}
	

	isRegenerating = true
	
	try {
		const iconThemeGeneratorService = container.resolve('iconThemeGeneratorService')
		const workspaceService = container.resolve('workspace')
		const fileSystem = container.resolve('fileSystem')
		const path = container.resolve('path')

		const config = workspaceService.getConfiguration(CONFIG_PREFIX)
		const userIconsDir = config.get(CONFIG_KEYS.userIconsDirectory) as string | undefined
		const customMappings = config.get(CONFIG_KEYS.customIconMappings) as Record<string, string> | undefined
		const hideArrows = config.get(CONFIG_KEYS.hideExplorerArrows) as boolean | null | undefined



		const baseThemePath = await getBaseThemePath(context, container)
		const generatedThemePath = await getGeneratedThemePath(context, container)
		const generatedThemeDir = path.dirname(generatedThemePath)



		// Log current theme file contents before regeneration (only for comparison)
		let currentTheme: any = null
		try {
			// Check if the file exists and has content
			const stats = await fileSystem.stat(generatedThemePath)
			if (stats.size > 0) {
				const currentThemeContent = await fileSystem.readFile(generatedThemePath, 'utf8')
				currentTheme = JSON.parse(currentThemeContent)
			}
		} catch (error) {
			// Could not read current theme file, that's okay
		}

		const newManifest = await iconThemeGeneratorService.generateIconThemeManifest(
			baseThemePath,
			generatedThemeDir,
			userIconsDir || undefined,
			customMappings,
			hideArrows,
		)

		if (newManifest) {
			await iconThemeGeneratorService.writeIconThemeFile(newManifest, generatedThemePath)
			
			// Show only the specific items that were changed
			if (customMappings) {
				console.log(`[${EXT_NAME}] === ASSIGNED ITEMS SUMMARY ===`)
				let changedItemsCount = 0
				
				for (const [key, value] of Object.entries(customMappings)) {
					// Extract the actual name from the key (e.g., "folder:deploy" -> "deploy")
					const actualName = key.includes(':') ? key.split(':')[1] : key
					
					// Determine which section to check based on the key prefix
					let beforeInTheme = 'NOT FOUND'
					let afterInTheme = 'NOT FOUND'
					
					if (key.startsWith('folder:')) {
						beforeInTheme = currentTheme?.folderNames?.[actualName] || 'NOT FOUND'
						afterInTheme = newManifest.folderNames?.[actualName] || 'NOT FOUND'
					} else if (key.startsWith('file:')) {
						if (actualName.includes('.')) {
							beforeInTheme = currentTheme?.fileNames?.[actualName] || 'NOT FOUND'
							afterInTheme = newManifest.fileNames?.[actualName] || 'NOT FOUND'
						} else {
							beforeInTheme = currentTheme?.fileExtensions?.[actualName] || 'NOT FOUND'
							afterInTheme = newManifest.fileExtensions?.[actualName] || 'NOT FOUND'
						}
					}
					
					// Only show items that actually changed
					if (beforeInTheme !== afterInTheme) {
						console.log(`[${EXT_NAME}] ${actualName}: ${beforeInTheme} → ${afterInTheme}`)
						changedItemsCount++
					}
				}
				
				if (changedItemsCount === 0) {
					console.log(`[${EXT_NAME}] No items changed in theme file`)
				}
				
				console.log(`[${EXT_NAME}] === END ASSIGNED ITEMS ===`)
			}
			

			
					// Add a minimal delay to ensure VS Code has time to detect the file change
		await new Promise(resolve => setTimeout(resolve, 50))
		}
		else {
			vscode.window.showErrorMessage(`${dynamiconsConstants.featureName}: Failed to generate icon theme manifest.`)
		}
	}
	catch (error: any) {
		vscode.window.showErrorMessage(`${dynamiconsConstants.featureName}: Error regenerating theme: ${error.message}`)
	}
	finally {
		isRegenerating = false
	}
}

async function refreshFileExplorer(context: ExtensionContext, container: AwilixContainer): Promise<void> {
	const workspaceService = container.resolve('workspace')
	const workbenchConfig = workspaceService.getConfiguration('workbench')
	
	try {
		await workbenchConfig.update('settings.openDefaultSettings', true)
		await workbenchConfig.update('settings.openDefaultSettings', false)
	} catch (error) {
		throw error
	}
}

async function activateIconThemeIfNeeded(context: ExtensionContext, container: AwilixContainer): Promise<void> {
	const workspaceService = container.resolve('workspace')
	const fileSystem = container.resolve('fileSystem')

	const workbenchConfig = workspaceService.getConfiguration('workbench')
	const currentTheme = workbenchConfig.get('iconTheme') as string | undefined

	if (currentTheme !== ICON_THEME_ID) {
		const generatedThemePath = await getGeneratedThemePath(context, container)

		try {
			await fileSystem.access(generatedThemePath)

			const choice = await vscode.window.showInformationMessage(
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

export async function activate(context: ExtensionContext): Promise<void> {
	if (isActivated) {
		console.log(`[${EXT_NAME}] Already activated, skipping...`)
		return
	}
	
	console.log(`[${EXT_NAME}] Activating...`)
	isActivated = true

	const container = await createDIContainer(context)
	const iconActionsService = container.resolve('iconActionsService') as Cradle['iconActionsService']

	try {
		await ensureThemeAssets(context, container)
	} catch (error) {
		console.log(`[${EXT_NAME}] Error during theme assets setup, continuing...`, error)
	}
	
	// Check if theme regeneration is needed on first load
	if (!isThemeInitialized) {
		console.log(`[${EXT_NAME}] First load detected, checking if theme regeneration is needed...`)
		
		let needsRegeneration = false
		try {
			const fileSystem = container.resolve('fileSystem')
			const generatedThemePath = await getGeneratedThemePath(context, container)
			
			try {
				const stats = await fileSystem.stat(generatedThemePath)
				if (stats.size === 0) {
					console.log(`[${EXT_NAME}] Generated theme file is empty, regenerating...`)
					needsRegeneration = true
				} else {
					console.log(`[${EXT_NAME}] Generated theme file exists and has content (${stats.size} bytes)`)
				}
			} catch (error) {
				console.log(`[${EXT_NAME}] Generated theme file not found, regenerating...`)
				needsRegeneration = true
			}
		} catch (error) {
			console.log(`[${EXT_NAME}] Error checking theme file, skipping regeneration...`, error)
		}
		
		if (needsRegeneration) {
			try {
				await regenerateAndApplyTheme(context, container)
			} catch (error) {
				console.log(`[${EXT_NAME}] Error during theme regeneration, continuing...`, error)
			}
			
			// Force VS Code to reload the icon theme on first load (only if theme is currently active)
			try {
				const workspaceService = container.resolve('workspace') as Cradle['workspace']
				const workbenchConfig = workspaceService.getConfiguration('workbench')
				const currentTheme = workbenchConfig.get('iconTheme')
				if (currentTheme === ICON_THEME_ID) {
					console.log(`[${EXT_NAME}] Forcing theme refresh on first load...`)
					// Use a more direct refresh method - trigger file explorer refresh
					await vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer')
					// Also temporarily switch themes for immediate visual update
					await workbenchConfig.update('iconTheme', 'vs-seti-file-icons', true)
					await new Promise(resolve => setTimeout(resolve, 25))
					await workbenchConfig.update('iconTheme', ICON_THEME_ID, true)
				}
			} catch (error) {
				console.log(`[${EXT_NAME}] Error during force refresh, continuing...`, error)
			}
		}
		
		isThemeInitialized = true
		console.log(`[${EXT_NAME}] Theme initialization completed`)
	} else {
		console.log(`[${EXT_NAME}] Theme already initialized, skipping regeneration`)
	}
	
	try {
		await activateIconThemeIfNeeded(context, container)
	} catch (error) {
		console.log(`[${EXT_NAME}] Error during icon theme activation, continuing...`, error)
	}

	context.subscriptions.push(
		vscode.commands.registerCommand(COMMANDS.activateIconTheme, async () => {
			const workspaceService = container.resolve('workspace') as Cradle['workspace']
			const workbenchConfig = workspaceService.getConfiguration('workbench')

			await workbenchConfig.update('iconTheme', ICON_THEME_ID, true)
			vscode.window.showInformationMessage(`"${ICON_THEME_ID}" icon theme activated.`)
		}),
		vscode.commands.registerCommand(COMMANDS.assignIcon, (uri?: Uri, uris?: Uri[]) => {
			const finalUris = uris && uris.length > 0 ? uris : (uri ? [uri] : [])

			iconActionsService.assignIconToResource(finalUris)
		}),
		vscode.commands.registerCommand(COMMANDS.revertIcon, (uri?: Uri, uris?: Uri[]) => {
			const finalUris = uris && uris.length > 0 ? uris : (uri ? [uri] : [])

			iconActionsService.revertIconAssignment(finalUris)
		}),
		vscode.commands.registerCommand(COMMANDS.toggleExplorerArrows, () => iconActionsService.toggleExplorerArrows()),
		vscode.commands.registerCommand(COMMANDS.showUserFileIconAssignments, () => iconActionsService.showUserIconAssignments('file')),
		vscode.commands.registerCommand(COMMANDS.showUserFolderIconAssignments, () => iconActionsService.showUserIconAssignments('folder')),
		vscode.commands.registerCommand(COMMANDS.refreshIconTheme, async () => {
			await regenerateAndApplyTheme(context, container)
			
			// Force VS Code to reload the icon theme immediately
			const workspaceService = container.resolve('workspace') as Cradle['workspace']
			const workbenchConfig = workspaceService.getConfiguration('workbench')
			const currentTheme = workbenchConfig.get('iconTheme')
			if (currentTheme === ICON_THEME_ID) {
				// Trigger file explorer refresh for immediate visual update
				await vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer')
				// Also temporarily switch themes for immediate visual update
				await workbenchConfig.update('iconTheme', 'vs-seti-file-icons', true)
				await new Promise(resolve => setTimeout(resolve, 25))
				await workbenchConfig.update('iconTheme', ICON_THEME_ID, true)
			}
			
			vscode.window.showInformationMessage(`${dynamiconsConstants.featureName}: Icon theme manually refreshed.`)
		}),
		vscode.commands.registerCommand('dynamicons.refreshFileExplorer', async () => {
			try {
				await refreshFileExplorer(context, container)
				vscode.window.showInformationMessage(`${dynamiconsConstants.featureName}: File explorer refreshed.`)
			} catch (error) {
				vscode.window.showErrorMessage(`${dynamiconsConstants.featureName}: Error refreshing file explorer: ${error}`)
			}
		}),
		vscode.workspace.onDidChangeConfiguration(async (e) => {
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
					await vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer')
				} catch (error) {
					console.log(`[${EXT_NAME}] Error refreshing file explorer after config change:`, error)
				}
			}
		}),
	)
	

}

export function deactivate(): void {
	isActivated = false
	isThemeInitialized = false
}

