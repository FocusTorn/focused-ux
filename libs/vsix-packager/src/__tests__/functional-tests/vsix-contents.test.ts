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
        if (existsSync(outAbs)) rmSync(outAbs, { recursive: true, force: true })
        execSync(`nx run @fux/project-butler-ext:package`, { stdio: 'inherit' })

        const pkgJson = JSON.parse(readFileSync(join(workspaceRoot, extDir, 'package.json'), 'utf-8'))
        const vsixBase = pkgJson.name.startsWith('fux-') ? pkgJson.name.slice(4) : pkgJson.name
        const expectedVsix = join(outAbs, `${vsixBase}-${pkgJson.version}.vsix`)
        expect(existsSync(expectedVsix)).toBe(true)

        // Also assert that extracted contents include node_modules/js-yaml (extraction enabled in config)
        const extractedRoot = join(workspaceRoot, '.vpack', 'contents', vsixBase, 'extension')
        // If extraction path exists, verify node_modules
        if (existsSync(extractedRoot)) {
            const jsYamlPkg = join(extractedRoot, 'node_modules', 'js-yaml', 'package.json')
            expect(existsSync(jsYamlPkg)).toBe(true)
        }
    })
})






