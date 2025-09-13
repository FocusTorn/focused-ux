import { describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'
import { existsSync, rmSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createGunzip } from 'node:zlib'
import { pipeline } from 'node:stream'
import { promisify } from 'node:util'
import { createReadStream } from 'node:fs'

const pipe = promisify(pipeline)

describe('vsix-packager vsix contents', () => {
    const workspaceRoot = resolve(process.cwd())
    const extDir = 'packages/project-butler/ext'
    const outDir = 'vsix_packages_test'
    const outAbs = join(workspaceRoot, outDir)

    it('creates a VSIX file', async () => {
        execSync('nx run @fux/project-butler-ext:build', { stdio: 'inherit' })
        execSync('nx run @fux/vsix-packager:cli', { stdio: 'inherit' })
        if (existsSync(outAbs)) rmSync(outAbs, { recursive: true, force: true })
        execSync(`node libs/vsix-packager/dist/cli/index.js ${extDir} ${outDir}`, { stdio: 'inherit' })

        const pkgJson = JSON.parse(readFileSync(join(workspaceRoot, extDir, 'package.json'), 'utf-8'))
        const vsixBase = pkgJson.name.startsWith('fux-') ? pkgJson.name.slice(4) : pkgJson.name
        const expectedVsix = join(outAbs, `${vsixBase}-${pkgJson.version}.vsix`)
        expect(existsSync(expectedVsix)).toBe(true)
    })
})






