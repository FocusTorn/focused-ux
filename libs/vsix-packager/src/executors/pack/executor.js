const path = require('node:path')
const { pathToFileURL } = require('node:url')

module.exports = async function runExecutor(options, context) {
    try {
        const workspaceRoot = context.root || process.cwd()
        const isAbs = path.isAbsolute(options.targetPath)
        const extensionDir = isAbs ? options.targetPath : path.join(workspaceRoot, options.targetPath)
        console.log(`[vpack-exec] workspaceRoot=${workspaceRoot}`)
        console.log(`[vpack-exec] raw targetPath=${options.targetPath}`)
        console.log(`[vpack-exec] isAbsolute=${isAbs}`)
        console.log(`[vpack-exec] extensionDir=${extensionDir}`)
        const esmPath = path.join(workspaceRoot, 'libs/vsix-packager/dist/index.js')
        const mod = await import(pathToFileURL(esmPath).href)
        const packageExtension = mod.packageExtension || mod.default?.packageExtension || mod.default
        const { vsixPath } = packageExtension({ extensionDir, outputDir: options.outputPath || '', dev: !!options.dev })
        console.log(vsixPath)
        return { success: true }
    } catch (e) {
        console.error(e)
        return { success: false }
    }
}


