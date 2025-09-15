const path = require('node:path')

/** @type {(options: any, context: any) => Promise<{success: boolean}>} */
module.exports = async function runExecutor(options, context) {
  try {
    const workspaceRoot = context.root || process.cwd()
    const extensionDir = path.join(workspaceRoot, options.targetPath)

    // Dynamically import ESM-built library after build completes
    const distEntryUrl = new URL('file://' + path.join(workspaceRoot, 'libs/vsix-packager/dist/index.js'))
    const esm = await import(distEntryUrl.href)
    const { packageExtension } = esm

    const { vsixPath } = packageExtension({ extensionDir, outputDir: options.outputPath || '', dev: !!options.dev })
    console.log(vsixPath)
    return { success: true }
  } catch (e) {
    console.error(e)
    return { success: false }
  }
}


