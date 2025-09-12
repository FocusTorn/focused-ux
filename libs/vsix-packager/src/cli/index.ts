#!/usr/bin/env node
import { packageExtension } from '../index.js'

function printUsage(): void {
    console.log('Usage: vsix-packager <extensionDir> <outputDir> [--dev]')
}

async function main(): Promise<void> {
    // Increase max listeners to avoid warnings from Nx/child processes
    process.setMaxListeners(50)
    const args = process.argv.slice(2)
    if (args.length < 2) {
        printUsage()
        process.exit(1)
    }
    const [extensionDir, outputDir, maybeDev] = args
    const dev = maybeDev === '--dev'

    try {
        const { vsixPath } = packageExtension({ extensionDir, outputDir, dev })
        console.log(vsixPath)
    } catch (err) {
        console.error('Packaging failed:', err)
        process.exit(1)
    }
}

main()


