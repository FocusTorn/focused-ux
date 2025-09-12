import { describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

describe('vsix-packager staging integrity', () => {
    const workspaceRoot = resolve(process.cwd())
    const extDir = 'packages/dynamicons/ext'

    it('ensures dist and essential files exist in staging prior to vsce', () => {
        execSync('nx run @fux/dynamicons-ext:build', { stdio: 'inherit' })
        execSync('nx run @fux/vsix-packager:cli', { stdio: 'inherit' })

        // Run packager once to force staging, success is enough
        execSync(`node libs/vsix-packager/dist/cli/index.js ${extDir} tmp/vsix_test_out`, { stdio: 'inherit' })

        const stagingDir = join(workspaceRoot, 'tmp', 'deploy', 'fux-dynamicons')
        expect(existsSync(join(stagingDir, 'dist'))).toBe(true)
        expect(statSync(join(stagingDir, 'dist')).isDirectory()).toBe(true)
        expect(existsSync(join(stagingDir, 'package.json'))).toBe(true)
        // node_modules created
        expect(existsSync(join(stagingDir, 'node_modules'))).toBe(true)
    })
})


