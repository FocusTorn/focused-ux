export interface ITerminalManagementService {
	/**
	 * Update terminal path to the current file or folder location
	 * @param filePath - Path to the file or folder
	 * @returns Promise that resolves when terminal path is updated
	 */
	updateTerminalPath: (filePath: string) => Promise<ITerminalCommand>
}

export interface ITerminalCommand {
	command: string
	shouldShowTerminal: boolean
}
