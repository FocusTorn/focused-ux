import { ITerminalManagementService, ITerminalCommand } from '../_interfaces/ITerminalManagementService'
import { IFileSystemAdapter } from '../_interfaces/IFileSystemAdapter'
import { IPathAdapter } from '../_interfaces/IPathAdapter'

// These interfaces are defined in the _interfaces directory

export class TerminalManagementService implements ITerminalManagementService {
	constructor(
		private readonly fileSystem: IFileSystemAdapter,
		private readonly path: IPathAdapter
	) {}

	async updateTerminalPath(filePath: string): Promise<ITerminalCommand> {
		const stats = await this.fileSystem.stat(filePath)
		const pathToSend = stats.type === 'directory' ? filePath : this.path.dirname(filePath)
		const cdCommand = `cd "${pathToSend}"`
		
		return {
			command: cdCommand,
			shouldShowTerminal: true
		}
	}
} 