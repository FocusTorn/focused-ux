import { describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'

describe('vsix-packager dependency contract', () => {
    const workspaceRoot = resolve(process.cwd())
    const extDir = 'packages/dynamicons/ext'
    const outDir = 'vsix_packages_test'
    const outAbs = join(workspaceRoot, outDir)

    it('packages with external runtime deps staged (strip-json-comments present)', () => {
        // Build extension first to ensure dist exists
        execSync('nx run @fux/dynamicons-ext:build', { stdio: 'inherit' })
        // Build CLI
        execSync('nx run @fux/vsix-packager:cli', { stdio: 'inherit' })
        // Clean output
        if (existsSync(outAbs)) rmSync(outAbs, { recursive: true, force: true })
        // Run packaging
        execSync(`node libs/vsix-packager/dist/cli/index.js ${extDir} ${outDir}`, { stdio: 'inherit' })

        // Find output file path by convention
        const pkgJson = require(join(workspaceRoot, extDir, 'package.json'))
        const vsixBase = pkgJson.name.startsWith('fux-') ? pkgJson.name.slice(4) : pkgJson.name
        const expectedVsix = join(outAbs, `${vsixBase}-${pkgJson.version}.vsix`)
        expect(existsSync(expectedVsix)).toBe(true)
    })
})


