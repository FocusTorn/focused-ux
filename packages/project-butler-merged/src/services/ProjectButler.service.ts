import type { Uri } from 'vscode'
import type {
	IWindow,
	ICommonUtilsService,
	IShellUtilsService,
	IFileUtilsService,
	IWorkspaceUtilsService,
	IPathUtilsService,
} from '@fux/shared-services'
import type { IProjectButlerService } from '../_interfaces/IProjectButlerService.js'
import type { stat as fspStatType } from 'node:fs/promises'

export class ProjectButlerService implements IProjectButlerService {

	private readonly _iFspStat: typeof fspStatType

	constructor(
		private readonly iWindow: IWindow,
		private readonly commonUtils: ICommonUtilsService,
		private readonly shellUtils: IShellUtilsService,
		private readonly fileUtils: IFileUtilsService,
		private readonly workspaceUtils: IWorkspaceUtilsService,
		private readonly pathUtils: IPathUtilsService,
		iFspStat: typeof fspStatType,
	) {
		this._iFspStat = iFspStat
		console.log('[ProjectButlerService] Instantiated.')
	}

	//===[ Terminal Butler Logic ]==============================================================================

	public async updateTerminalPath(uri: Uri): Promise<void> { //>
		console.log(`[ProjectButlerService] updateTerminalPath called with: ${uri.fsPath}`)
		try {
			const stats = await this._iFspStat(uri.fsPath)
			const pathToSend = stats.isDirectory() ? uri.fsPath : this.pathUtils.iPathDirname(uri.fsPath)

			console.log(`[ProjectButlerService] Path to CD into: ${pathToSend}`)

			const cdCommand = await this.shellUtils.getCDCommand(pathToSend)

			console.log(`[ProjectButlerService] Generated CD command: "${cdCommand}"`)

			if (cdCommand) {
				const terminal = this.iWindow.activeTerminal || this.iWindow.createTerminal()

				console.log(`[ProjectButlerService] Sending command to terminal: ${terminal.name}`)
				terminal.sendText(cdCommand)
				terminal.show()
			}
			else {
				console.error('[ProjectButlerService] Could not determine command to change directory.')
				this.iWindow.showErrorMessage('Could not determine command to change directory.')
			}
		}
		catch (error: any) {
			this.commonUtils.errMsg(`Error getting path information for ${uri.fsPath}`, error)
		}
	} //<

	public async enterPoetryShell(uri?: Uri): Promise<void> { //>
		console.log(`[ProjectButlerService] enterPoetryShell called. URI: ${uri?.fsPath ?? 'none'}`)
		try {
			const terminal = this.iWindow.createTerminal('Poetry Shell')
			let pathToSend: string | undefined

			if (uri) {
				const stats = await this._iFspStat(uri.fsPath)

				pathToSend = stats.isDirectory() ? uri.fsPath : this.pathUtils.iPathDirname(uri.fsPath)
				console.log(`[ProjectButlerService] Path for poetry shell: ${pathToSend}`)
			}

			const cdCommand = await this.shellUtils.getCDCommand(pathToSend, true)

			console.log(`[ProjectButlerService] Generated poetry command: "${cdCommand}"`)

			if (cdCommand) {
				terminal.sendText(cdCommand)
			}
			else {
				console.log('[ProjectButlerService] No path, sending "poetry shell" directly.')
				terminal.sendText('poetry shell')
			}
			terminal.show()
		}
		catch (error) {
			this.commonUtils.errMsg('Failed to enter Poetry shell.', error)
		}
	} //<

	public async formatPackageJson(uri: Uri): Promise<void> { //>
		console.log(`[ProjectButlerService] formatPackageJson called with: ${uri.fsPath}`)
		try {
			const workspaceInfo = this.workspaceUtils.getWorkspaceInfo()
			const workspaceRoot = workspaceInfo.primaryUri?.fsPath

			console.log(`[ProjectButlerService] Workspace root: ${workspaceRoot}`)

			if (!workspaceRoot) {
				console.error('[ProjectButlerService] Could not find workspace root.')
				this.iWindow.showErrorMessage('Could not find workspace root. Cannot format package.json.')
				return
			}

			const scriptPath = this.pathUtils.iPathJoin(
				workspaceRoot,
				'_scripts',
				'js',
				'format-package-json.js',
			)

			console.log(`[ProjectButlerService] Script path: ${scriptPath}`)
			console.log(`[ProjectButlerService] Executing: node "${scriptPath}" "${uri.fsPath}"`)

			await this.shellUtils.executeCommand('node', [scriptPath, uri.fsPath], workspaceRoot)
			console.log('[ProjectButlerService] format-package-json.js script executed.')
		}
		catch (error) {
			this.commonUtils.errMsg('Failed to execute package.json formatting script.', error)
		}
	} //<

	//===[ Chrono Copy Logic ]==================================================================================

	public async createBackup(uri: Uri): Promise<void> { //>
		console.log(`[ProjectButlerService] createBackup called with: ${uri.fsPath}`)
		await this.fileUtils.createFileBackup(uri)
	} //<

}
