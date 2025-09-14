import { describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'
import { existsSync, statSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

describe('vsix-packager staging integrity', () => {
	const workspaceRoot = resolve(process.cwd())
	// const extDir = 'packages/project-butler/ext'

	it('ensures dist and essential files exist in staging prior to vsce', () => {
		// Run packager once via Nx target to force staging
		execSync(`nx run @fux/project-butler-ext:package`, { stdio: 'inherit' })

		const cfgPath = join(workspaceRoot, 'libs', 'vsix-packager', 'config.json')
		const cfg = JSON.parse(readFileSync(cfgPath, 'utf-8'))
		const deployBase = cfg?.pathing?.['deploy-output']?.path || join('tmp', 'deploy')
		const deployRoot = join(workspaceRoot, deployBase)
		// Prefer fixed overwrite dir if present, else last one
		const fixed = join(deployRoot, 'fux-project-butler-local')
		let stagingDir = fixed
		if (!existsSync(stagingDir)) {
			const dirs = existsSync(deployRoot) ? readdirSync(deployRoot) : []
			const match = dirs.filter(d =>
				d.startsWith('fux-project-butler-')).sort().pop()
			stagingDir = match ? join(deployRoot, match) : fixed
		}
		expect(existsSync(join(stagingDir, 'dist'))).toBe(true)
		expect(statSync(join(stagingDir, 'dist')).isDirectory()).toBe(true)
		expect(existsSync(join(stagingDir, 'package.json'))).toBe(true)
		// node_modules created
		expect(existsSync(join(stagingDir, 'node_modules'))).toBe(true)

		// .vscodeignore must include include rules and not exclude dist/node_modules
		const ignorePath = join(stagingDir, '.vscodeignore')
		const ignoreTxt = readFileSync(ignorePath, 'utf-8')
		expect(ignoreTxt.includes('!node_modules/**')).toBe(true)
		expect(ignoreTxt.includes('!dist/**')).toBe(true)
		// Should not have raw exclude patterns for these
		expect(ignoreTxt.split(/\r?\n/).some(l =>
			l.trim() === 'node_modules/')).toBe(false)
		expect(ignoreTxt.split(/\r?\n/).some(l =>
			l.trim() === 'dist/')).toBe(false)
	})
})






