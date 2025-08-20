import { IPoetryShellService, IPoetryShellCommand } from '../_interfaces/IPoetryShellService'
import { IFileSystemAdapter } from '../_interfaces/IFileSystemAdapter'
import { IPathAdapter } from '../_interfaces/IPathAdapter'

// These interfaces are defined in the _interfaces directory

export class PoetryShellService implements IPoetryShellService {
	constructor(
		private readonly fileSystem: IFileSystemAdapter,
		private readonly path: IPathAdapter
	) {}

	async enterPoetryShell(filePath?: string): Promise<IPoetryShellCommand> {
		let command: string

		if (filePath) {
			const stats = await this.fileSystem.stat(filePath)
			const pathToSend = stats.type === 'directory' ? filePath : this.path.dirname(filePath)
			command = `cd "${pathToSend}" && poetry shell`
		} else {
			command = 'poetry shell'
		}
		
		return {
			command,
			shouldShowTerminal: true
		}
	}
} 