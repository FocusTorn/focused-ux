/**
 * An esbuild plugin to strip the "node:" prefix from imports,
 * allowing them to be resolved by polyfill plugins.
 */
const nodeAliasPlugin = {
    name: 'node-alias',
    setup(build) {
        // Intercept import paths that start with "node:"
        build.onResolve({ filter: /^node:/ }, (args) => {
            // Rewrite the path to remove the "node:" prefix.
            const newPath = args.path.substring(5)

            // Let esbuild resolve the new path. Do not mark as external.
            // This allows the next plugin in the chain (the polyfill) to handle it.
            return { path: newPath }
        })
    },
}

module.exports = nodeAliasPlugin
