import { POETRY_SHELL_COMMAND } from "../_config/constants.js"
class PoetryShellService {

    constructor(fileSystem, path) {
        this.fileSystem = fileSystem
        this.path = path
    }
    async enterPoetryShell(filePath) {
        let command

        if (filePath) {
            const stats = await this.fileSystem.stat(filePath)
            const pathToSend = stats.type === "directory" ? filePath : this.path.dirname(filePath)

            command = `cd "${pathToSend}" && ${POETRY_SHELL_COMMAND}`
        } else {
            command = POETRY_SHELL_COMMAND
        }
        return {
            command,
            shouldShowTerminal: true
        }
    }

}
export {
    PoetryShellService
}
