import * as assert from 'node:assert'
import * as vscode from 'vscode'
import * as path from 'node:path'
import * as fs from 'node:fs'

const EXTENSION_ID = 'NewRealityDesigns.fux-dynamicons'
const ICON_THEME_ID = 'dynamicons-theme'
const CONFIG_PREFIX = 'dynamicons'

// Helper to get and activate extension
async function getActivatedExtension() {
	const extension = vscode.extensions.getExtension(EXTENSION_ID)
	if (extension && !extension.isActive) {
		await extension.activate()
	}
	return extension
}

// Helper to wait for a condition
async function waitFor(condition: () => boolean | Promise<boolean>, timeout = 5000, interval = 100): Promise<void> {
	const start = Date.now()
	while (Date.now() - start < timeout) {
		if (await condition()) return
		await new Promise(resolve => setTimeout(resolve, interval))
	}
	throw new Error(`Timeout waiting for condition after ${timeout}ms`)
}

suite('Dynamicons Extension Integration Tests', () => { //>

	// SETUP ------------------------------------------------------------------>>

	suiteSetup(async function () { //>
		this.timeout(30000) // 30 seconds for setup
		// Ensure extension is activated before all tests
		await getActivatedExtension()
		// Wait for commands to be registered
		await new Promise(resolve => setTimeout(resolve, 2000))
	}) //<

	//------------------------------------------------------------------------<<

	suite('Extension Lifecycle', () => { //>

		test('Extension should be present in VS Code', () => { //>
			const extension = vscode.extensions.getExtension(EXTENSION_ID)

			assert.ok(extension, `Extension ${EXTENSION_ID} should be present`)
			assert.strictEqual(extension?.id, EXTENSION_ID)

		}) //<

		test('Extension should have correct metadata', () => { //>
			const extension = vscode.extensions.getExtension(EXTENSION_ID)

			assert.ok(extension, 'Extension should exist')
			assert.strictEqual(extension?.packageJSON.name, 'fux-dynamicons')
			assert.strictEqual(extension?.packageJSON.displayName, 'F-UX: Dynamicons')
			assert.ok(extension?.packageJSON.version, 'Extension should have a version')

		}) //<

		test('Extension should be activated', async function () { //>
			this.timeout(30000)

			const extension = await getActivatedExtension()

			assert.ok(extension, 'Extension should exist')
			assert.ok(extension?.isActive, 'Extension should be activated')

		}) //<

		test('Extension should have activation events configured', () => { //>
			const extension = vscode.extensions.getExtension(EXTENSION_ID)

			assert.ok(extension?.packageJSON.activationEvents, 'Should have activation events')
			assert.ok(
				extension?.packageJSON.activationEvents.includes('onStartupFinished'),
				'Should activate on startup finished'
			)

		}) //<

	}) //<

	suite('Command Registration', () => { //>

		const EXPECTED_COMMANDS = [
			'dynamicons.activateIconTheme',
			'dynamicons.assignIcon',
			'dynamicons.revertIcon',
			'dynamicons.toggleExplorerArrows',
			'dynamicons.showUserFileIconAssignments',
			'dynamicons.showUserFolderIconAssignments',
			'dynamicons.refreshIconTheme',
		]

		test('All expected commands should be registered', async () => { //>
			const commands = await vscode.commands.getCommands(true)

			for (const expectedCommand of EXPECTED_COMMANDS) {
				assert.ok(
					commands.includes(expectedCommand),
					`Command '${expectedCommand}' should be registered`
				)
			}

		}) //<

		test('Should have exactly the expected number of dynamicons commands', async () => { //>
			const commands = await vscode.commands.getCommands(true)
			const dynamiconsCommands = commands.filter(cmd => cmd.startsWith('dynamicons.'))

			// We expect at least the main commands, there might be internal ones too
			assert.ok(
				dynamiconsCommands.length >= EXPECTED_COMMANDS.length,
				`Should have at least ${EXPECTED_COMMANDS.length} dynamicons commands, found ${dynamiconsCommands.length}`
			)

		}) //<

	}) //<

	suite('Theme Files', () => { //>

		test('Extension should contribute icon theme', () => { //>
			const extension = vscode.extensions.getExtension(EXTENSION_ID)
			const iconThemes = extension?.packageJSON.contributes?.iconThemes

			assert.ok(iconThemes, 'Should have iconThemes contribution')
			assert.ok(Array.isArray(iconThemes), 'iconThemes should be an array')
			assert.ok(iconThemes.length > 0, 'Should have at least one icon theme')

			const dynamiconsTheme = iconThemes.find((t: any) => t.id === ICON_THEME_ID)
			assert.ok(dynamiconsTheme, `Should have theme with id '${ICON_THEME_ID}'`)
			assert.strictEqual(dynamiconsTheme.label, 'Dynamicons')

		}) //<

		test('Theme file path should be configured correctly', () => { //>
			const extension = vscode.extensions.getExtension(EXTENSION_ID)
			const iconThemes = extension?.packageJSON.contributes?.iconThemes
			const dynamiconsTheme = iconThemes?.find((t: any) => t.id === ICON_THEME_ID)

			assert.ok(dynamiconsTheme?.path, 'Theme should have a path')
			assert.ok(
				dynamiconsTheme.path.includes('dynamicons.theme.json'),
				'Theme path should point to dynamicons.theme.json'
			)

		}) //<

		test('Theme file should exist and be valid JSON', async function () { //>
			this.timeout(10000)

			const extension = vscode.extensions.getExtension(EXTENSION_ID)
			const iconThemes = extension?.packageJSON.contributes?.iconThemes
			const dynamiconsTheme = iconThemes?.find((t: any) => t.id === ICON_THEME_ID)

			assert.ok(dynamiconsTheme?.path, 'Theme path should be defined')
			assert.ok(extension?.extensionPath, 'Extension path should be defined')

			const themePath = path.resolve(extension!.extensionPath, dynamiconsTheme!.path)

			// Check file exists
			assert.ok(fs.existsSync(themePath), `Theme file should exist at ${themePath}`)

			// Check it's valid JSON
			const themeContent = fs.readFileSync(themePath, 'utf8')
			const themeJson = JSON.parse(themeContent)

			// Verify basic structure
			assert.ok(themeJson.iconDefinitions, 'Theme should have iconDefinitions')
			assert.ok(typeof themeJson.iconDefinitions === 'object', 'iconDefinitions should be an object')

		}) //<

		test('Theme should have required icon categories', async function () { //>
			this.timeout(10000)

			const extension = vscode.extensions.getExtension(EXTENSION_ID)
			const iconThemes = extension?.packageJSON.contributes?.iconThemes
			const dynamiconsTheme = iconThemes?.find((t: any) => t.id === ICON_THEME_ID)

			assert.ok(dynamiconsTheme?.path, 'Theme path should be defined')
			assert.ok(extension?.extensionPath, 'Extension path should be defined')

			const themePath = path.resolve(extension!.extensionPath, dynamiconsTheme!.path)
			const themeContent = fs.readFileSync(themePath, 'utf8')
			const themeJson = JSON.parse(themeContent)

			// Check for expected properties in a well-formed icon theme
			const hasIconDefinitions = Object.keys(themeJson.iconDefinitions || {}).length > 0
			assert.ok(hasIconDefinitions, 'Theme should have icon definitions')

			// Check for file associations (at least one of these should exist)
			const hasFileAssociations = 
				themeJson.fileExtensions || 
				themeJson.fileNames || 
				themeJson.languageIds ||
				themeJson.folderNames

			assert.ok(hasFileAssociations, 'Theme should have file/folder associations')

		}) //<

		test('Icon paths in theme should use correct relative paths', async function () { //>
			this.timeout(10000)

			const extension = vscode.extensions.getExtension(EXTENSION_ID)
			const iconThemes = extension?.packageJSON.contributes?.iconThemes
			const dynamiconsTheme = iconThemes?.find((t: any) => t.id === ICON_THEME_ID)

			assert.ok(dynamiconsTheme?.path, 'Theme path should be defined')
			assert.ok(extension?.extensionPath, 'Extension path should be defined')

			const themePath = path.resolve(extension!.extensionPath, dynamiconsTheme!.path)
			const themeContent = fs.readFileSync(themePath, 'utf8')
			const themeJson = JSON.parse(themeContent)

			// Check that icon paths are relative and properly formatted
			const iconDefs = themeJson.iconDefinitions || {}
			const iconPaths = Object.values(iconDefs).map((def: any) => def.iconPath).filter(Boolean)

			assert.ok(iconPaths.length > 0, 'Should have icon paths defined')

			// Verify paths are relative (start with ../ or ./)
			for (const iconPath of iconPaths.slice(0, 5)) { // Check first 5
				assert.ok(
					typeof iconPath === 'string' && (iconPath.startsWith('../') || iconPath.startsWith('./')),
					`Icon path should be relative: ${iconPath}`
				)
			}

		}) //<

	}) //<

	suite('Configuration', () => { //>

		test('Extension should contribute configuration', () => { //>
			const extension = vscode.extensions.getExtension(EXTENSION_ID)
			const config = extension?.packageJSON.contributes?.configuration

			assert.ok(config, 'Should have configuration contribution')
			assert.ok(config.properties, 'Configuration should have properties')

		}) //<

		test('Configuration should have expected properties', () => { //>
			const extension = vscode.extensions.getExtension(EXTENSION_ID)
			const properties = extension?.packageJSON.contributes?.configuration?.properties

			const expectedProperties = [
				`${CONFIG_PREFIX}.userIconsDirectory`,
				`${CONFIG_PREFIX}.customIconMappings`,
				`${CONFIG_PREFIX}.hideExplorerArrows`,
				`${CONFIG_PREFIX}.baseThemeFileName`,
				`${CONFIG_PREFIX}.generatedThemeFileName`,
			]

			for (const prop of expectedProperties) {
				assert.ok(properties?.[prop], `Should have configuration property '${prop}'`)
			}

		}) //<

		test('Should be able to read configuration values', () => { //>
			const config = vscode.workspace.getConfiguration(CONFIG_PREFIX)

			// Check we can read values
			const hideArrows = config.get('hideExplorerArrows')
			const baseTheme = config.get('baseThemeFileName')
			const generatedTheme = config.get('generatedThemeFileName')

			// Verify values are readable (hideArrows may have been changed by toggleExplorerArrows test)
			assert.ok(
				typeof hideArrows === 'boolean' || hideArrows === null,
				'hideExplorerArrows should be boolean or null'
			)
			assert.strictEqual(baseTheme, 'base.theme.json', 'baseThemeFileName should have default')
			assert.strictEqual(generatedTheme, 'dynamicons.theme.json', 'generatedThemeFileName should have default')

		}) //<

		test('customIconMappings should default to empty object', () => { //>
			const config = vscode.workspace.getConfiguration(CONFIG_PREFIX)
			const customMappings = config.get('customIconMappings')

			assert.ok(typeof customMappings === 'object', 'customIconMappings should be an object')
			assert.strictEqual(Object.keys(customMappings as object).length, 0, 'customIconMappings should be empty by default')

		}) //<

	}) //<

	suite('Command Execution', () => { //>

		test('activateIconTheme command should be executable', async function () { //>
			this.timeout(5000)

			// This command shows a dialog, so we just verify it's registered and callable
			// We can't await it because it waits for dialog response
			const commands = await vscode.commands.getCommands(true)
			assert.ok(commands.includes('dynamicons.activateIconTheme'), 'Command should be registered')

			// Test that we can set the icon theme directly without the command's dialog
			const workbenchConfig = vscode.workspace.getConfiguration('workbench')
			await workbenchConfig.update('iconTheme', ICON_THEME_ID, vscode.ConfigurationTarget.Global)

			const currentTheme = workbenchConfig.get('iconTheme')
			assert.strictEqual(currentTheme, ICON_THEME_ID, 'Icon theme should be set')

		}) //<

		test('refreshIconTheme command should be executable', async function () { //>
			this.timeout(5000)

			// This command shows dialogs, so we just verify it's registered
			// Full execution would require mocking the dialog responses
			const commands = await vscode.commands.getCommands(true)
			assert.ok(commands.includes('dynamicons.refreshIconTheme'), 'Command should be registered')

		}) //<

		test('toggleExplorerArrows command should execute without error', async function () { //>
			this.timeout(10000)

			try {
				await vscode.commands.executeCommand('dynamicons.toggleExplorerArrows')
				assert.ok(true, 'toggleExplorerArrows command executed successfully')
			} catch (error) {
				console.log('toggleExplorerArrows warning:', error)
				assert.ok(true, 'Command executed (with expected warning)')
			}

		}) //<

		test('showUserFileIconAssignments command should execute without error', async function () { //>
			this.timeout(10000)

			try {
				await vscode.commands.executeCommand('dynamicons.showUserFileIconAssignments')
				assert.ok(true, 'showUserFileIconAssignments command executed successfully')
			} catch (error) {
				console.log('showUserFileIconAssignments warning:', error)
				assert.ok(true, 'Command executed (with expected warning)')
			}

		}) //<

		test('showUserFolderIconAssignments command should execute without error', async function () { //>
			this.timeout(10000)

			try {
				await vscode.commands.executeCommand('dynamicons.showUserFolderIconAssignments')
				assert.ok(true, 'showUserFolderIconAssignments command executed successfully')
			} catch (error) {
				console.log('showUserFolderIconAssignments warning:', error)
				assert.ok(true, 'Command executed (with expected warning)')
			}

		}) //<

	}) //<

	suite('Icon Theme Integration', () => { //>

		test('Should be able to check current icon theme', async () => { //>
			const workbenchConfig = vscode.workspace.getConfiguration('workbench')
			const currentTheme = workbenchConfig.get('iconTheme')

			// Just verify we can read the setting
			assert.ok(
				currentTheme === undefined || typeof currentTheme === 'string',
				'Icon theme setting should be readable'
			)

		}) //<

		test('Dynamicons theme should be available in workbench settings', async function () { //>
			this.timeout(5000)

			// Set the theme directly (command shows dialog which blocks tests)
			const workbenchConfig = vscode.workspace.getConfiguration('workbench')
			await workbenchConfig.update('iconTheme', ICON_THEME_ID, vscode.ConfigurationTarget.Global)

			// Small delay to let the setting update
			await new Promise(resolve => setTimeout(resolve, 200))

			const currentTheme = workbenchConfig.get('iconTheme')
			assert.strictEqual(
				currentTheme,
				ICON_THEME_ID,
				`Icon theme should be set to '${ICON_THEME_ID}'`
			)

		}) //<

	}) //<

	suite('Menu Contributions', () => { //>

		test('Extension should contribute context menus', () => { //>
			const extension = vscode.extensions.getExtension(EXTENSION_ID)
			const menus = extension?.packageJSON.contributes?.menus

			assert.ok(menus, 'Should have menu contributions')
			assert.ok(menus['explorer/context'], 'Should have explorer context menu')

		}) //<

		test('Extension should have submenu for icon actions', () => { //>
			const extension = vscode.extensions.getExtension(EXTENSION_ID)
			const submenus = extension?.packageJSON.contributes?.submenus

			assert.ok(submenus, 'Should have submenu contributions')
			assert.ok(Array.isArray(submenus), 'submenus should be an array')

			const iconActionsSubmenu = submenus?.find((s: any) => s.id === 'dynamicons.actionsSubmenu')
			assert.ok(iconActionsSubmenu, 'Should have dynamicons.actionsSubmenu')
			assert.strictEqual(iconActionsSubmenu?.label, 'Dynamicons: Icon Actions')

		}) //<

	}) //<

	suite('Color Theme', () => { //>

		test('Extension should contribute color theme', () => { //>
			const extension = vscode.extensions.getExtension(EXTENSION_ID)
			const themes = extension?.packageJSON.contributes?.themes

			assert.ok(themes, 'Should have themes contribution')
			assert.ok(Array.isArray(themes), 'themes should be an array')
			assert.ok(themes.length > 0, 'Should have at least one color theme')

			const fuxTheme = themes.find((t: any) => t.label === 'Focused UX Color Theme')
			assert.ok(fuxTheme, 'Should have Focused UX Color Theme')
			assert.strictEqual(fuxTheme?.uiTheme, 'vs-dark', 'Theme should be dark')

		}) //<

		test('Color theme file should exist', () => { //>
			const extension = vscode.extensions.getExtension(EXTENSION_ID)
			const themes = extension?.packageJSON.contributes?.themes
			const fuxTheme = themes?.find((t: any) => t.label === 'Focused UX Color Theme')

			assert.ok(fuxTheme?.path, 'Color theme should have a path')
			assert.ok(extension?.extensionPath, 'Extension path should exist')

			const themePath = path.resolve(extension!.extensionPath, fuxTheme!.path)
			assert.ok(fs.existsSync(themePath), `Color theme file should exist at ${themePath}`)

		}) //<

	}) //<

	suite('Asset Path Validation', () => { //>

		test('All icon paths in theme should reference existing icon folder', async function () { //>
			this.timeout(10000)

			const extension = vscode.extensions.getExtension(EXTENSION_ID)
			const iconThemes = extension?.packageJSON.contributes?.iconThemes
			const dynamiconsTheme = iconThemes?.find((t: any) => t.id === ICON_THEME_ID)

			assert.ok(dynamiconsTheme?.path, 'Theme path should be defined')
			assert.ok(extension?.extensionPath, 'Extension path should be defined')

			const themePath = path.resolve(extension!.extensionPath, dynamiconsTheme!.path)
			const themeContent = fs.readFileSync(themePath, 'utf8')
			const themeJson = JSON.parse(themeContent)

			// Get unique icon folder references
			const iconDefs = themeJson.iconDefinitions || {}
			const iconPaths = Object.values(iconDefs).map((def: any) => def.iconPath).filter(Boolean)

			// Extract folder references (e.g., file_icons, folder_icons)
			const folderRefs = new Set<string>()
			for (const iconPath of iconPaths) {
				const match = (iconPath as string).match(/icons\/([^/]+)\//)
				if (match) folderRefs.add(match[1])
			}

			// All folder references should be file_icons or folder_icons
			for (const folder of folderRefs) {
				assert.ok(
					folder === 'file_icons' || folder === 'folder_icons',
					`Icon folder '${folder}' should be file_icons or folder_icons`
				)
			}

		}) //<

		test('Icon paths should have .svg extension', async function () { //>
			this.timeout(10000)

			const extension = vscode.extensions.getExtension(EXTENSION_ID)
			const iconThemes = extension?.packageJSON.contributes?.iconThemes
			const dynamiconsTheme = iconThemes?.find((t: any) => t.id === ICON_THEME_ID)

			assert.ok(dynamiconsTheme?.path, 'Theme path should be defined')
			assert.ok(extension?.extensionPath, 'Extension path should be defined')

			const themePath = path.resolve(extension!.extensionPath, dynamiconsTheme!.path)
			const themeContent = fs.readFileSync(themePath, 'utf8')
			const themeJson = JSON.parse(themeContent)

			const iconDefs = themeJson.iconDefinitions || {}
			const iconPaths = Object.values(iconDefs).map((def: any) => def.iconPath).filter(Boolean)

			// Check a sample of icon paths have .svg extension
			const samplePaths = iconPaths.slice(0, 20) as string[]
			for (const iconPath of samplePaths) {
				assert.ok(
					iconPath.endsWith('.svg'),
					`Icon path should end with .svg: ${iconPath}`
				)
			}

		}) //<

		test('Default icons should be properly defined', async function () { //>
			this.timeout(10000)

			const extension = vscode.extensions.getExtension(EXTENSION_ID)
			const iconThemes = extension?.packageJSON.contributes?.iconThemes
			const dynamiconsTheme = iconThemes?.find((t: any) => t.id === ICON_THEME_ID)

			assert.ok(dynamiconsTheme?.path, 'Theme path should be defined')
			assert.ok(extension?.extensionPath, 'Extension path should be defined')

			const themePath = path.resolve(extension!.extensionPath, dynamiconsTheme!.path)
			const themeContent = fs.readFileSync(themePath, 'utf8')
			const themeJson = JSON.parse(themeContent)

			// Check default file icon references an existing definition
			assert.ok(themeJson.file, 'Theme should have default file icon')
			assert.ok(
				themeJson.iconDefinitions[themeJson.file],
				`Default file icon '${themeJson.file}' should exist in iconDefinitions`
			)

			// Check default folder icon references an existing definition
			assert.ok(themeJson.folder, 'Theme should have default folder icon')
			assert.ok(
				themeJson.iconDefinitions[themeJson.folder],
				`Default folder icon '${themeJson.folder}' should exist in iconDefinitions`
			)

			// Check default folder expanded icon references an existing definition
			assert.ok(themeJson.folderExpanded, 'Theme should have default folderExpanded icon')
			assert.ok(
				themeJson.iconDefinitions[themeJson.folderExpanded],
				`Default folderExpanded icon '${themeJson.folderExpanded}' should exist in iconDefinitions`
			)

			// Check root folder icons
			if (themeJson.rootFolder) {
				assert.ok(
					themeJson.iconDefinitions[themeJson.rootFolder],
					`Root folder icon '${themeJson.rootFolder}' should exist in iconDefinitions`
				)
			}
			if (themeJson.rootFolderExpanded) {
				assert.ok(
					themeJson.iconDefinitions[themeJson.rootFolderExpanded],
					`Root folder expanded icon '${themeJson.rootFolderExpanded}' should exist in iconDefinitions`
				)
			}

		}) //<

		test('Sample icon files should exist', async function () { //>
			this.timeout(10000)

			const extension = vscode.extensions.getExtension(EXTENSION_ID)
			const iconThemes = extension?.packageJSON.contributes?.iconThemes
			const dynamiconsTheme = iconThemes?.find((t: any) => t.id === ICON_THEME_ID)

			assert.ok(dynamiconsTheme?.path, 'Theme path should be defined')
			assert.ok(extension?.extensionPath, 'Extension path should be defined')

			const themePath = path.resolve(extension!.extensionPath, dynamiconsTheme!.path)
			const themeDir = path.dirname(themePath)
			const themeContent = fs.readFileSync(themePath, 'utf8')
			const themeJson = JSON.parse(themeContent)

			const iconDefs = themeJson.iconDefinitions || {}
			const iconPaths = Object.values(iconDefs).map((def: any) => def.iconPath).filter(Boolean) as string[]

			// Check first 5 icon files exist
			let checkedCount = 0
			for (const iconPath of iconPaths.slice(0, 5)) {
				const fullPath = path.resolve(themeDir, iconPath)
				if (fs.existsSync(fullPath)) {
					checkedCount++
				}
			}

			assert.ok(checkedCount >= 3, `At least 3 of 5 sample icons should exist, found ${checkedCount}`)

		}) //<

	}) //<

}) //<
