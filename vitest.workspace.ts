import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
	'packages/ghost-writer/core/vitest.config.ts',
	'packages/ghost-writer/ext/vitest.config.ts',
	'packages/project-butler/core/vitest.config.ts',
	'packages/project-butler/ext/vitest.config.ts',
])