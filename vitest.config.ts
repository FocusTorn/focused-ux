import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		projects: [
			{ root: 'libs/shared/vitest.config.ts' },
			{ root: 'libs/mockly' },
			{ root: 'packages/project-butler/core' },
			{ root: 'packages/project-butler/ext' },
			{ root: 'packages/note-hub/core' },
			{ root: 'packages/note-hub/ext' },
		],
	},
})
