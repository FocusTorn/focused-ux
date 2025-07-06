import type { IProjectButlerService } from '@fux/project-butler-dc-core'
import type { Uri } from 'vscode'
import * as vscode from 'vscode'
import { hotswap } from './hotswap.js'

export class ProjectButlerModule {
	constructor(private readonly projectButlerService: IProjectButlerService) {}

	public handleUpdateTerminalPath(uri?: Uri): Promise<void> {
		return this.projectButlerService.updateTerminalPath(uri?.fsPath)
	}

	public handleCreateBackup(uri?: Uri): Promise<void> {
		return this.projectButlerService.createBackup(uri?.fsPath)
	}

	public handleEnterPoetryShell(uri?: Uri): Promise<void> {
		return this.projectButlerService.enterPoetryShell(uri?.fsPath)
	}

	public handleFormatPackageJson(uri?: Uri): Promise<void> {
		return this.projectButlerService.formatPackageJson(uri?.fsPath)
	}

	public handleHotswap(uri?: Uri): Promise<void> {
		if (!uri) {
			vscode.window.showErrorMessage('Hotswap command must be run from a VSIX file.')
			return Promise.resolve()
		}
		// Hotswap is pure VSCode logic, so we keep it in the ext layer.
		return hotswap(uri)
	}
}