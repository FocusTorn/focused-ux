import { exec } from 'node:child_process'
import type { IProcess } from '../../_interfaces/IProcess.js'
import type { IWorkspace } from '../../_interfaces/IVSCode.js'

export class ProcessAdapter implements IProcess {

	constructor(private workspace: IWorkspace) {}

	public exec(
		command: string,
		options: { cwd: string },
		callback: (error: Error | null, stdout: string, stderr: string) => void,
	): void {
		exec(command, options, callback)
	}

	public getWorkspaceRoot(): string | undefined {
		return this.workspace.workspaceFolders?.[0]?.uri.fsPath
	}

}
