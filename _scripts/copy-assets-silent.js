#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import process from 'node:process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Asset file extensions to suppress logging for
// const ASSET_EXTENSIONS = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.bmp', '.tiff']

// function isAssetFile(filePath) {
//     const ext = path.extname(filePath).toLowerCase()
//     return ASSET_EXTENSIONS.includes(ext)
// }

function copyDirectory(src, dest, fileList = []) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true })
    }

    const entries = fs.readdirSync(src, { withFileTypes: true })

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name)
        const destPath = path.join(dest, entry.name)

        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath, fileList)
        } else {
            fs.copyFileSync(srcPath, destPath)
            fileList.push(destPath)
        }
    }
    return fileList
}

// Get command line arguments
const args = process.argv.slice(2)
if (args.length !== 2) {
    console.error('Usage: node copy-assets-silent.js <source> <destination>')
    process.exit(1)
}

const [source, destination] = args
const packagePath = source.replace(/\\/g, '/').split('/assets')[0]

// Resolve paths relative to script location
const workspaceRoot = path.resolve(__dirname, '..')
const sourcePath = path.resolve(workspaceRoot, source)
const destPath = path.resolve(workspaceRoot, destination)

if (!fs.existsSync(sourcePath)) {
    console.error(`Source directory does not exist: ${sourcePath}`)
    process.exit(1)
}

// Copy and count files
const copiedFiles = copyDirectory(sourcePath, destPath, [])
const relDest = path.relative(workspaceRoot, destPath).replace(/\\/g, '/')

// Nx grey: \x1b[90m ... \x1b[0m
console.log(`Copying assets for ${packagePath}`)
console.log(`\x1b[90m→ ${relDest} (${copiedFiles.length} files)\x1b[0m`)
