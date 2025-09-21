import { describe, it, expect } from 'vitest'

describe('ConfigurationService', () => {
	it('returns default when no workspace root', async () => {
		const fs = { readFile: async (_p: string) => '' }
		const proc = { getWorkspaceRoot: () => '' }
		const { ConfigurationService } = await import('../../src/services/Configuration.service.js')
		const svc = new ConfigurationService(fs as any, proc as any)

		expect(await svc.get('a.b', 42)).toBe(42)
	})

	it('loads yaml and returns nested value or default', async () => {
		const fs = { readFile: async (_p: string) => 'a:\n  b: 7' }
		const proc = { getWorkspaceRoot: () => '/root' }
		const { ConfigurationService } = await import('../../src/services/Configuration.service.js')
		const svc = new ConfigurationService(fs as any, proc as any)

		expect(await svc.get('a.b', 42)).toBe(7)
		expect(await svc.get('a.c', 42)).toBe(42)
	})

	it('returns default on fs/yaml errors', async () => {
		const fs = { readFile: async (_p: string) => { throw new Error('nope') } }
		const proc = { getWorkspaceRoot: () => '/root' }
		const { ConfigurationService } = await import('../../src/services/Configuration.service.js')
		const svc = new ConfigurationService(fs as any, proc as any)

		expect(await svc.get('x.y', 1)).toBe(1)
	})
})
