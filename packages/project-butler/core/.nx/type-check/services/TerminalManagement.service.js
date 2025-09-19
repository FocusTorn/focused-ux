import { TERMINAL_COMMAND_PREFIX, TERMINAL_PATH_QUOTE_CHAR } from "../_config/constants.js"
class TerminalManagementService {

    constructor(fileSystem, path) {
        this.fileSystem = fileSystem
        this.path = path
    }
    async updateTerminalPath(filePath) {
        const stats = await this.fileSystem.stat(filePath)
        const pathToSend = stats.type === "directory" ? filePath : this.path.dirname(filePath)
        const cdCommand = `${TERMINAL_COMMAND_PREFIX} ${TERMINAL_PATH_QUOTE_CHAR}${pathToSend}${TERMINAL_PATH_QUOTE_CHAR}`

        return {
            command: cdCommand,
            shouldShowTerminal: true
        }
    }

}
export {
    TerminalManagementService
}
