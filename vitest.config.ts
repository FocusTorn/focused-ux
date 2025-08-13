import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
	// Shared alias to VS Code shim for all projects
	resolve: { alias: { vscode: path.resolve(__dirname, 'vscode-test-adapter.ts') } },
	test: {
		projects: [
			{ root: 'libs/shared' },
			{ root: 'packages/ghost-writer/ext' },
			{ root: 'packages/project-butler/ext' },
			{ root: 'packages/note-hub/ext' },
		],
	},
})
