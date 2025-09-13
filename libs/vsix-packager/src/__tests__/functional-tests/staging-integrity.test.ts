import { describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'
import { existsSync, statSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

describe('vsix-packager staging integrity', () => {
    const workspaceRoot = resolve(process.cwd())
    const extDir = 'packages/project-butler/ext'

    it('ensures dist and essential files exist in staging prior to vsce', () => {
        execSync('nx run @fux/project-butler-ext:build', { stdio: 'inherit' })
        execSync('nx run @fux/vsix-packager:cli', { stdio: 'inherit' })

        // Run packager once to force staging, success is enough
        execSync(`node libs/vsix-packager/dist/cli/index.js ${extDir} tmp/vsix_test_out`, { stdio: 'inherit' })

        const cfgPath = join(workspaceRoot, 'libs', 'vsix-packager', 'config.json')
        const cfg = JSON.parse(readFileSync(cfgPath, 'utf-8'))
        const deployBase = cfg?.pathing?.['deploy-output']?.path || join('tmp', 'deploy')
        const globPrefix = join(workspaceRoot, deployBase, 'fux-project-butler-')
        // Find the most recent staging dir matching the prefix
        const deployRoot = join(workspaceRoot, deployBase)
        const dirs = existsSync(deployRoot) ? readdirSync(deployRoot) : []
        const match = dirs.filter(d => d.startsWith('fux-project-butler-')).sort().pop()
        const stagingDir = match ? join(deployRoot, match) : globPrefix
        expect(existsSync(join(stagingDir, 'dist'))).toBe(true)
        expect(statSync(join(stagingDir, 'dist')).isDirectory()).toBe(true)
        expect(existsSync(join(stagingDir, 'package.json'))).toBe(true)
        // node_modules created
        expect(existsSync(join(stagingDir, 'node_modules'))).toBe(true)
    })
})






