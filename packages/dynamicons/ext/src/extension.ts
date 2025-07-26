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

	try {
		await fileSystem.access(generatedThemePath)
	}
	catch {
		await regenerateAndApplyTheme(context, container)
	}
}

async function regenerateAndApplyTheme(context: ExtensionContext, container: AwilixContainer): Promise<void> {
	const iconThemeGeneratorService = container.resolve('iconThemeGeneratorService')
	const workspaceService = container.resolve('workspace')
	const path = container.resolve('path')

	const config = workspaceService.getConfiguration(CONFIG_PREFIX)
	const userIconsDir = config.get(CONFIG_KEYS.userIconsDirectory) as string | undefined
	const customMappings = config.get(CONFIG_KEYS.customIconMappings) as Record<string, string> | undefined
	const hideArrows = config.get(CONFIG_KEYS.hideExplorerArrows) as boolean | null | undefined

	const baseThemePath = await getBaseThemePath(context, container)
	const generatedThemePath = await getGeneratedThemePath(context, container)
	const generatedThemeDir = path.dirname(generatedThemePath)

	try {
		const newManifest = await iconThemeGeneratorService.generateIconThemeManifest(
			baseThemePath,
			generatedThemeDir,
			userIconsDir || undefined,
			customMappings,
			hideArrows,
		)

		if (newManifest) {
			await iconThemeGeneratorService.writeIconThemeFile(newManifest, generatedThemePath)
			console.log(`[${EXT_NAME}] Theme file regenerated successfully. The VS Code event loop will handle the UI refresh.`)
		}
		else {
			vscode.window.showErrorMessage(`${dynamiconsConstants.featureName}: Failed to generate icon theme manifest.`)
		}
	}
	catch (error: any) {
		vscode.window.showErrorMessage(`${dynamiconsConstants.featureName}: Error regenerating theme: ${error.message}`)
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
	console.log(`[${EXT_NAME}] Activating...`)

	const container = await createDIContainer(context)
	const iconActionsService = container.resolve('iconActionsService') as Cradle['iconActionsService']

	await ensureThemeAssets(context, container)
	await activateIconThemeIfNeeded(context, container)

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
			vscode.window.showInformationMessage(`${dynamiconsConstants.featureName}: Icon theme manually refreshed.`)
		}),
		vscode.workspace.onDidChangeConfiguration(async (e) => {
			if (
				e.affectsConfiguration(`${CONFIG_PREFIX}.${CONFIG_KEYS.customIconMappings}`)
				|| e.affectsConfiguration(`${CONFIG_PREFIX}.${CONFIG_KEYS.userIconsDirectory}`)
				|| e.affectsConfiguration(`${CONFIG_PREFIX}.${CONFIG_KEYS.hideExplorerArrows}`)
				|| e.affectsConfiguration(`${CONFIG_PREFIX}.${CONFIG_KEYS.baseThemeFileName}`)
				|| e.affectsConfiguration(`${CONFIG_PREFIX}.${CONFIG_KEYS.generatedThemeFileName}`)
			) {
				console.log(`[${EXT_NAME}] Configuration changed, regenerating theme...`)
				await regenerateAndApplyTheme(context, container)
			}
		}),
	)
}

export function deactivate(): void {
	console.log(`[${EXT_NAME}] Deactivated.`)
}
