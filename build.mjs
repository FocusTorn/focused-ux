// packages/my-extension/build.mjs
import * as esbuild from 'esbuild'
import { pnpPlugin } from '@yarnpkg/esbuild-plugin-pnp' // For pnpm/yarn support

// Check if we are in watch mode
const isWatch = process.argv.includes('--watch')

// A simple logging plugin for esbuild
const logPlugin = { //>
    name: 'log-plugin',
    setup(build) {
        let startTime
        build.onStart(() => {
            startTime = Date.now()
            console.log('Build started...')
        })
        build.onEnd((result) => {
            if (result.errors.length > 0) {
                console.error(`Build failed in ${Date.now() - startTime}ms`, result.errors)
            } else {
                console.log(`✅ Build successful in ${Date.now() - startTime}ms`)
            }
        })
    },
} //<

// esbuild configuration
const config = {
    entryPoints: ['src/extension.ts'],
    bundle: true,
    outfile: 'dist/extension.js',
    external: ['vscode'], // Exclude the 'vscode' module, it's provided by the host
    format: 'cjs', // Output CommonJS format, required by VSCode extensions
    platform: 'node', // Target the Node.js platform
    target: 'es2022', // Match your tsconfig.json target
    sourcemap: true, // Generate source maps for easy debugging
    logLevel: 'info', // 'info' is a good default
    plugins: [
        pnpPlugin(), // Helps esbuild resolve packages in a pnpm monorepo
        logPlugin, // Our custom logging plugin
    ],
}

// --- Main Execution ---

async function build() {
    try {
        if (isWatch) {
            // In watch mode, we use esbuild's context API
            const context = await esbuild.context(config)
            await context.watch()
            console.log('👀 Watching for changes...')
        } else {
            // For a single production build
            await esbuild.build(config)
        }
    } catch (error) {
        console.error('An unexpected error occurred:', error)
        process.exit(1)
    }
}

// Run the build
build()
