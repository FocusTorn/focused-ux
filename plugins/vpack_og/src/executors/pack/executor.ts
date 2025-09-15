import type { ExecutorContext } from '@nx/devkit'
import { join } from 'node:path'
import { packageExtension } from '../../../../libs/vsix-packager/dist/index.js'

export interface PackExecutorOptions {
	targetPath: string
	outputPath?: string
	dev?: boolean
}

export default async function runExecutor(options: PackExecutorOptions, context: ExecutorContext) {
	try {
		const workspaceRoot = context.root || process.cwd()
		const extensionDir = join(workspaceRoot, options.targetPath)
		const { vsixPath } = packageExtension({ extensionDir, outputDir: options.outputPath ?? '', dev: options.dev })

		// Print path so callers can capture it
		console.log(vsixPath)
		return { success: true }
	} catch (e) {
		console.error(e)
		return { success: false }
	}
}
