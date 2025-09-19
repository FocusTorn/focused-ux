import type { IPoetryShellService, IPoetryShellCommand } from '../_interfaces/IPoetryShellService.js'
import type { IFileSystemAdapter } from '../_interfaces/IFileSystemAdapter.js'
import type { IPathAdapter } from '../_interfaces/IPathAdapter.js'
import { POETRY_SHELL_COMMAND } from '../_config/constants.js'

// These interfaces are defined in the _interfaces directory

export class PoetryShellService implements IPoetryShellService {

    constructor(
        private readonly fileSystem: IFileSystemAdapter,
        private readonly path: IPathAdapter,
    ) {}

    async enterPoetryShell(filePath?: string): Promise<IPoetryShellCommand> {
        let command: string

        if (filePath) {
            const stats = await this.fileSystem.stat(filePath)
            const pathToSend = stats.type === 'directory' ? filePath : this.path.dirname(filePath)

            command = `cd "${pathToSend}" && ${POETRY_SHELL_COMMAND}`
        }
        else {
            command = POETRY_SHELL_COMMAND
        }
		
        return {
            command,
            shouldShowTerminal: true,
        }
    }

}
