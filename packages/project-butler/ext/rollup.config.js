import { defineConfig } from 'rollup'
import typescript from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import copy from 'rollup-plugin-copy'

export default defineConfig({
    input: 'packages/project-butler/ext/src/extension.ts',
    output: {
        file: 'packages/project-butler/ext/dist/extension.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
    },
    external: [
        'vscode',
        'awilix',
        'js-yaml',
    ],
    plugins: [
        nodeResolve({
            preferBuiltins: true,
        }),
        commonjs({
            // Transform workspace dependencies
            include: ['node_modules/@fux/**/*', '../../node_modules/@fux/**/*'],
        }),
        typescript({
            tsconfig: 'packages/project-butler/ext/tsconfig.json',
            declaration: false,
            declarationMap: false,
            sourceMap: false,
            compilerOptions: {
                module: 'ESNext',
                moduleResolution: 'Node'
            }
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
        // Suppress warnings about external modules
        if (
            warning.code === 'UNRESOLVED_IMPORT' &&
            (warning.source === 'awilix' || warning.source === 'js-yaml')
        ) {
            return
        }
        warn(warning)
    },
})
