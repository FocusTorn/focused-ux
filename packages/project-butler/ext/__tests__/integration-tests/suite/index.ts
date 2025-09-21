import * as vscode from 'vscode'

/**
 * Mocha root hooks to manage the integration test suite's lifecycle.
 */
export const mochaHooks = {
    /**
	 * Runs once before all tests.
	 */
    async beforeAll() {
        console.log('--- Global setup: Activating extension ---')

        const ext = vscode.extensions.getExtension('NewRealityDesigns.fux-project-butler')

        if (ext && !ext.isActive) {
            await ext.activate()
        }
        console.log('--- Extension activated ---')
    },

    /**
	 * Runs once after all tests.
	 */
    async afterAll() {
        console.log('--- Global teardown: Closing editors ---')
        await vscode.commands.executeCommand('workbench.action.closeAllEditors')
        
        // Force close any remaining windows
        await vscode.commands.executeCommand('workbench.action.closeAllGroups')
        
        // Clear any active text editors
        const activeEditor = vscode.window.activeTextEditor
        if (activeEditor) {
            await vscode.window.showTextDocument(activeEditor.document, { preview: false })
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
        }
        
        console.log('--- Teardown complete ---')
        // A longer delay to ensure VS Code processes can settle before the test runner exits.
        await new Promise(resolve =>
            setTimeout(resolve, 2000))
    },
}


