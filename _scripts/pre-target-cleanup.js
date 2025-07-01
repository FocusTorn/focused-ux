import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import process from 'node:process'
import stripJsonComments from 'strip-json-comments'

async function main() {
    const projectRoot = process.argv[2]
    if (!projectRoot) {
        console.error(
            'Error: Project root path not provided as an argument. This script must be run via Nx.'
        )
        process.exit(1)
    }

    const commandToRun = process.argv.slice(3).join(' ')
    if (!commandToRun) {
        console.error('Error: No command provided to the wrapper script.')
        process.exit(1)
    }

    const packageJsonPath = join(projectRoot, 'package.json')
    let originalContent

    try {
        originalContent = readFileSync(packageJsonPath, 'utf-8')
    } catch (e) {
        console.error(`Error reading package.json at ${packageJsonPath}`, e)
        process.exit(1)
    }

    try {
        // Strip comments and write back a clean version
        const strippedContent = stripJsonComments(originalContent)
        const packageJson = JSON.parse(strippedContent)
        writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4))
        console.log(`[Cleanup] Stripped comments from ${projectRoot}/package.json`)

        // Execute the actual command
        const child = spawn(commandToRun, [], {
            stdio: 'inherit',
            shell: true,
            cwd: projectRoot,
        })

        const exitCode = await new Promise((resolve) => {
            child.on('close', resolve)
        })

        process.exit(exitCode)
    } catch (error) {
        console.error('An error occurred during the target execution:', error)
        process.exit(1)
    } finally {
        // Restore the original package.json
        if (originalContent) {
            writeFileSync(packageJsonPath, originalContent)
            console.log(`[Cleanup] Restored original ${projectRoot}/package.json`)
        }
    }
}

main()
