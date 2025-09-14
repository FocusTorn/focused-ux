import { describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'

describe('vsix-packager dependency contract', () => {
	const workspaceRoot = resolve(process.cwd())
	const extDir = 'packages/project-butler/ext'
	const outDir = 'vsix_packages_test'
	const outAbs = join(workspaceRoot, outDir)

	it('packages with external runtime deps staged (strip-json-comments present)', () => {
		// Clean output
		if (existsSync(outAbs)) rmSync(outAbs, { recursive: true, force: true })
		// Run packaging via Nx target (dependsOn ensures builds)
		execSync(`nx run @fux/project-butler-ext:package`, { stdio: 'inherit' })

		// Find output file path by convention
		const pkgJson = require(join(workspaceRoot, extDir, 'package.json'))
		const vsixBase = pkgJson.name.startsWith('fux-') ? pkgJson.name.slice(4) : pkgJson.name
		const expectedVsix = join(outAbs, `${vsixBase}-${pkgJson.version}.vsix`)
		expect(existsSync(expectedVsix)).toBe(true)
	})
})






