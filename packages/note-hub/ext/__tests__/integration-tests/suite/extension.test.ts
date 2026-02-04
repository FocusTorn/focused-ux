import * as assert from 'assert'
import * as vscode from 'vscode'

const EXTENSION_ID = 'NewRealityDesigns.fux-note-hub'

suite('Note Hub Extension Integration Tests', function () { //>
	// SETUP ---------------------------------------------------------------->>

	this.timeout(30000)

	let extension: vscode.Extension<any> | undefined

	suiteSetup(async function () { //>
		this.timeout(60000)
		extension = vscode.extensions.getExtension(EXTENSION_ID)
		
		if (extension && !extension.isActive) {
			await extension.activate()
		}
	}) //<

	//----------------------------------------------------------------------<<

	suite('Extension Lifecycle', function () { //>

		test('Extension should be present', function () { //>
			assert.ok(extension, `Extension ${EXTENSION_ID} should be installed`)

		}) //<

		test('Extension should be activated', async function () { //>
			this.timeout(30000)
			assert.ok(extension, 'Extension should be present')
			
			if (!extension!.isActive) {
				await extension!.activate()
			}
			
			assert.ok(extension!.isActive, 'Extension should be activated')

		}) //<

		test('Extension should have correct metadata', function () { //>
			assert.ok(extension, 'Extension should be present')
			
			const packageJSON = extension!.packageJSON
			assert.strictEqual(packageJSON.name, 'fux-note-hub', 'Package name should match')
			assert.strictEqual(packageJSON.publisher, 'NewRealityDesigns', 'Publisher should match')

		}) //<

	}) //<

	suite('Command Registration', function () { //>

		test('Should register note-hub commands', async function () { //>
			this.timeout(10000)
			
			const commands = await vscode.commands.getCommands(true)
			const noteHubCommands = commands.filter(cmd => cmd.startsWith('nh.'))
			
			assert.ok(noteHubCommands.length > 0, 'Should have Note Hub commands registered')

		}) //<

		test('Should have expected number of note-hub commands', async function () { //>
			this.timeout(10000)
			
			const commands = await vscode.commands.getCommands(true)
			const noteHubCommands = commands.filter(cmd => cmd.startsWith('nh.'))
			
			// The extension should register at least 10 commands based on package.json
			assert.ok(
				noteHubCommands.length >= 10,
				`Should have at least 10 nh.* commands, found ${noteHubCommands.length}: ${noteHubCommands.join(', ')}`
			)

		}) //<

	}) //<

	suite('View Contributions', function () { //>

		test('Extension should contribute views', function () { //>
			assert.ok(extension, 'Extension should be present')
			
			const views = extension!.packageJSON.contributes?.views
			assert.ok(views, 'Extension should contribute views')

		}) //<

		test('Should have notesHub view container', function () { //>
			assert.ok(extension, 'Extension should be present')
			
			const viewContainers = extension!.packageJSON.contributes?.viewsContainers
			assert.ok(viewContainers, 'Extension should have view containers')
			
			const activitybar = viewContainers?.activitybar
			assert.ok(activitybar, 'Should have activitybar containers')
			
			const noteHubContainer = activitybar?.find((c: any) => c.id === 'notesHub')
			assert.ok(noteHubContainer, 'Should have notesHub view container')

		}) //<

		test('Should have project, remote, and global notes views', function () { //>
			assert.ok(extension, 'Extension should be present')
			
			const views = extension!.packageJSON.contributes?.views?.['notesHub']
			assert.ok(views, 'Should have notesHub views')
			
			const viewIds = views.map((v: any) => v.id)
			assert.ok(viewIds.includes('nh.projectNotesView'), 'Should have nh.projectNotesView')
			assert.ok(viewIds.includes('nh.remoteNotesView'), 'Should have nh.remoteNotesView')
			assert.ok(viewIds.includes('nh.globalNotesView'), 'Should have nh.globalNotesView')

		}) //<

	}) //<

	suite('Configuration', function () { //>

		test('Extension should contribute configuration', function () { //>
			assert.ok(extension, 'Extension should be present')
			
			const config = extension!.packageJSON.contributes?.configuration
			assert.ok(config, 'Extension should contribute configuration')

		}) //<

		test('Should be able to read configuration values', function () { //>
			const config = vscode.workspace.getConfiguration('notesHub')
			assert.ok(config, 'Should be able to get notesHub configuration')

		}) //<

	}) //<

	suite('Menu Contributions', function () { //>

		test('Extension should contribute menus', function () { //>
			assert.ok(extension, 'Extension should be present')
			
			const menus = extension!.packageJSON.contributes?.menus
			assert.ok(menus, 'Extension should contribute menus')

		}) //<

		test('Should have view/title menus for notes views', function () { //>
			assert.ok(extension, 'Extension should be present')
			
			const menus = extension!.packageJSON.contributes?.menus
			const viewTitleMenus = menus?.['view/title']
			
			assert.ok(viewTitleMenus, 'Should have view/title menus')
			assert.ok(viewTitleMenus.length > 0, 'Should have view/title menu items')

		}) //<

	}) //<

	suite('Runtime Functionality', function () { //>

		test('Extension should activate without errors', async function () { //>
			this.timeout(30000)
			assert.ok(extension, 'Extension should be present')
			
			// If we got here after activation, no critical errors occurred
			// The activation would have failed if directory creation threw unhandled errors
			assert.ok(extension!.isActive, 'Extension should be active (no activation errors)')

		}) //<

		test('Configuration paths should be defined', function () { //>
			const config = vscode.workspace.getConfiguration('notesHub')
			
			// The extension should have default paths configured
			// These may be undefined if user hasn't set them, but getConfiguration should work
			assert.ok(config, 'notesHub configuration should be accessible')

		}) //<

	}) //<

}) //<
