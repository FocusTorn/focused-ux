"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mochaHooks = void 0;
const tslib_1 = require("tslib");
const vscode = tslib_1.__importStar(require("vscode"));
// Import all integration test suites
require("./extension.test.js");
require("./backup.test.js");
require("./package-json-formatting.test.js");
require("./terminal-management.test.js");
require("./poetry-shell.test.js");
/**
 * Mocha root hooks to manage the integration test suite's lifecycle.
 */
exports.mochaHooks = {
    /**
     * Runs once before all tests.
     */
    async beforeAll() {
        console.log('--- Global setup: Activating extension ---');
        const ext = vscode.extensions.getExtension('NewRealityDesigns.fux-project-butler');
        if (ext && !ext.isActive) {
            await ext.activate();
        }
        console.log('--- Extension activated ---');
    },
    /**
     * Runs once after all tests.
     */
    async afterAll() {
        console.log('--- Global teardown: Closing editors ---');
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        console.log('--- Teardown complete ---');
        // A small delay to ensure VS Code processes can settle before the test runner exits.
        await new Promise(resolve => setTimeout(resolve, 500));
    }
};
//# sourceMappingURL=index.js.map