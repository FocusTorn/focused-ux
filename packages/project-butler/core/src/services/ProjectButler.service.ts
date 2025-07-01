import { inject, injectable } from 'tsyringe'
import type { Uri } from 'vscode'
import type {
	IWindow,
	ICommonUtilsService,
	IShellUtilsService,
	IFileUtilsService,
	IWorkspaceUtilsService,
} from '@fux/shared-services'
import type { IProjectButlerService } from '../_interfaces/IProjectButlerService.js'
import type * as nodePath from 'node:path'
import type { access as fspAccessType, copyFile as fspCopyFileType, stat as fspStatType } from 'node:fs/promises'
import { load as loadYaml } from 'js-yaml'

@injectable()
export class ProjectButlerService implements IProjectButlerService {
	constructor(
		@inject('IWindow') private readonly window: IWindow,
		@inject('ICommonUtilsService') private readonly commonUtils: ICommonUtilsService,
		@inject('IShellUtilsService') private readonly shellUtils: IShellUtilsService,
		@inject('IFileUtilsService') private readonly fileUtils: IFileUtilsService,
		@inject('IWorkspaceUtilsService') private readonly workspaceUtils: IWorkspaceUtilsService,
		@inject('iFspStat') private readonly fspStat: typeof fspStatType,
		@inject('iPathDirname') private readonly pathDirname: typeof nodePath.dirname,
		@inject('iPathJoin') private readonly pathJoin: typeof nodePath.join,
		@inject('iPathBasename') private readonly pathBasename: typeof nodePath.basename,
		@inject('iFspAccess') private readonly fspAccess: typeof fspAccessType,
		@inject('iFspCopyFile') private readonly fspCopyFile: typeof fspCopyFileType,
	) {}

	//===[ Terminal Butler Logic ]==============================================================================

	public async updateTerminalPath(uri: Uri): Promise<void> {
		try {
			const stats = await this.fspStat(uri.fsPath)
			const pathToSend = stats.isDirectory() ? uri.fsPath : this.pathDirname(uri.fsPath)
			const cdCommand = await this.shellUtils.getCDCommand(pathToSend)

			if (cdCommand) {
				const terminal = this.window.activeTerminal || this.window.createTerminal()

				terminal.sendText(cdCommand)
				terminal.show()
			}
			else {
				this.window.showErrorMessage('Could not determine command to change directory.')
			}
		}
		catch (error: any) {
			this.commonUtils.errMsg(`Error getting path information for ${uri.fsPath}`, error)
		}
	}

	public async enterPoetryShell(uri?: Uri): Promise<void> {
		try {
			const terminal = this.window.createTerminal('Poetry Shell')
			let pathToSend: string | undefined

			if (uri) {
				const stats = await this.fspStat(uri.fsPath)

				pathToSend = stats.isDirectory() ? uri.fsPath : this.pathDirname(uri.fsPath)
			}

			const cdCommand = await this.shellUtils.getCDCommand(pathToSend, true)

			if (cdCommand) {
				terminal.sendText(cdCommand)
			}
			else {
				// If no path, just try to enter poetry shell in current dir
				terminal.sendText('poetry shell')
			}
			terminal.show()
		}
		catch (error) {
			this.commonUtils.errMsg('Failed to enter Poetry shell.', error)
		}
	}

	public async formatPackageJson(uri: Uri): Promise<void> {
		try {
			const workspaceInfo = this.workspaceUtils.getWorkspaceInfo()
			const workspaceRoot = workspaceInfo.primaryUri?.fsPath

			if (!workspaceRoot) {
				this.window.showErrorMessage('Could not find workspace root. Cannot format package.json.')
				return
			}

			const configPath = this.pathJoin(workspaceRoot, '.FocusedUX')
			const masterOrder = await this.getMasterOrder(configPath)

			const packageContent = await this.fileUtils.readFile(uri.fsPath)
			const packageData = JSON.parse(packageContent)
			const originalKeys = Object.keys(packageData)

			const commentKeyRegex = /=.*=$/

			for (const key of originalKeys) {
				if (commentKeyRegex.test(key)) {
					continue
				}

				if (!masterOrder.includes(key)) {
					throw new Error(
						`Validation Failed: Found top-level key '${key}' in '${uri.fsPath}' which is not in the allowed ordering list defined in .FocusedUX.`,
					)
				}
			}

			const orderedPackage: Record<string, any> = {}

			for (const key of masterOrder) {
				if (Object.prototype.hasOwnProperty.call(packageData, key)) {
					orderedPackage[key] = packageData[key]
				}
			}

			for (const key of originalKeys) {
				if (commentKeyRegex.test(key)) {
					orderedPackage[key] = packageData[key]
				}
			}

			const newJsonContent = `${JSON.stringify(orderedPackage, null, 4)}\n`

			await this.fileUtils.writeFile(uri.fsPath, newJsonContent)

			const relativePath = uri.fsPath.replace(workspaceRoot, '').replace(/^[\\/]/, '')

			this.window.showInformationMessage(`Successfully formatted ${relativePath}.`)
		}
		catch (error) {
			this.commonUtils.errMsg('Failed to format package.json.', error)
		}
	}

	private async getMasterOrder(configPath: string): Promise<string[]> {
		let configFileContent

		try {
			configFileContent = await this.fileUtils.readFile(configPath)
		}
		catch (_err) {
			throw new Error(`Configuration Error: Could not read '.FocusedUX' file at '${configPath}'.`)
		}

		let config

		try {
			config = loadYaml(configFileContent) as any
		}
		catch (_err) {
			throw new Error('Configuration Error: Failed to parse YAML from \'.FocusedUX\'.')
		}

		const order = config?.TerminalButler?.['packageJson-order']

		if (!order) {
			throw new Error(
				'Configuration Error: Key path \'TerminalButler.packageJson-order\' not found in \'.FocusedUX\'.',
			)
		}

		if (!Array.isArray(order)) {
			throw new TypeError(
				'Configuration Error: \'TerminalButler.packageJson-order\' must be an array in \'.FocusedUX\'.',
			)
		}

		if (!order.includes('name')) {
			order.unshift('name')
		}

		return order
	}

	//===[ Chrono Copy Logic ]==================================================================================

	public async createBackup(fileUri: Uri): Promise<void> {
		try {
			const sourcePath = fileUri.fsPath
			const baseName = this.pathBasename(sourcePath)
			const directory = this.pathDirname(sourcePath)
			let backupNumber = 1
			let backupFileName = `${baseName}.bak`
			let destinationPath = this.pathJoin(directory, backupFileName)

			while (true) {
				try {
					await this.fspAccess(destinationPath)
					backupNumber++
					backupFileName = `${baseName}.bak${backupNumber}`
					destinationPath = this.pathJoin(directory, backupFileName)
				}
				catch {
					// File doesn't exist, we can use this path
					break
				}
			}

			await this.fspCopyFile(sourcePath, destinationPath)
			this.window.showInformationMessage(`Backup created: ${backupFileName}`)
		}
		catch (error) {
			this.commonUtils.errMsg(`Error creating backup for ${fileUri.fsPath}`, error)
		}
	}
}