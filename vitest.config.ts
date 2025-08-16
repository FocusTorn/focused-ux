import { defineConfig } from 'vitest/config'

export default defineConfig({
	// Shared alias to VS Code shim for all projects
	test: {
		projects: [
			{ root: 'libs/shared' },
			{ root: 'libs/mockly' },
			{ root: 'packages/project-butler/core' },
			{ root: 'packages/project-butler/ext' },
			{ root: 'packages/note-hub/core' },
			{ root: 'packages/note-hub/ext' },
		],
	},
})
