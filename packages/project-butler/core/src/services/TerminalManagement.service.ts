import type { ITerminalManagementService, ITerminalCommand } from '../_interfaces/ITerminalManagementService.js'
import type { IFileSystemAdapter } from '../_interfaces/IFileSystemAdapter.js'
import type { IPathAdapter } from '../_interfaces/IPathAdapter.js'
import { TERMINAL_COMMAND_PREFIX, TERMINAL_PATH_QUOTE_CHAR } from '../_config/constants.js'

// These interfaces are defined in the _interfaces directory

export class TerminalManagementService implements ITerminalManagementService {

	constructor(
		private readonly fileSystem: IFileSystemAdapter,
		private readonly path: IPathAdapter,
	) {}

	async updateTerminalPath(filePath: string): Promise<ITerminalCommand> {
		const stats = await this.fileSystem.stat(filePath)
		const pathToSend = stats.type === 'directory' ? filePath : this.path.dirname(filePath)
		const cdCommand = `${TERMINAL_COMMAND_PREFIX} ${TERMINAL_PATH_QUOTE_CHAR}${pathToSend}${TERMINAL_PATH_QUOTE_CHAR}`
		
		return {
			command: cdCommand,
			shouldShowTerminal: true,
		}
	}

}
