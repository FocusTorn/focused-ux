import { rollup } from 'rollup'
import typescript from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import copy from 'rollup-plugin-copy'
import { rmSync, mkdirSync } from 'fs'
import { join } from 'path'

async function build() {
    // Clean dist directory
    const distDir = join(process.cwd(), 'packages/project-butler/ext/dist')
    rmSync(distDir, { recursive: true, force: true })
    mkdirSync(distDir, { recursive: true })

    const bundle = await rollup({
        input: 'packages/project-butler/ext/src/extension.ts',
        external: ['vscode', 'awilix', 'js-yaml'],
        plugins: [
            nodeResolve({
                preferBuiltins: true,
            }),
            commonjs({
                include: ['node_modules/@fux/**/*', '../../node_modules/@fux/**/*'],
            }),
            typescript({
                tsconfig: 'packages/project-butler/ext/tsconfig.json',
                declaration: false,
                declarationMap: false,
                sourceMap: false,
                compilerOptions: {
                    module: 'ESNext',
                    moduleResolution: 'Node',
                },
            }),
            copy({
                targets: [
                    {
                        src: 'packages/project-butler/ext/assets/**/*',
                        dest: 'packages/project-butler/ext/dist/assets',
                    },
                ],
            }),
        ],
        onwarn(warning, warn) {
            if (
                warning.code === 'UNRESOLVED_IMPORT' &&
                (warning.source === 'awilix' || warning.source === 'js-yaml')
            ) {
                return
            }
            warn(warning)
        },
    })

    await bundle.write({
        file: 'packages/project-butler/ext/dist/extension.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
    })

    await bundle.close()
    console.log('Build completed successfully!')
}

build().catch(console.error)
