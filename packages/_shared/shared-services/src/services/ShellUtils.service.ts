// ESLint & Imports -->>

//= NODE JS ===================================================================================================
import * as cp from 'node:child_process'

//= IMPLEMENTATION TYPES ======================================================================================
import type { IShellUtilsService, IWindow, ICommonUtilsService } from '../interfaces.js'

//--------------------------------------------------------------------------------------------------------------<<

export class ShellUtilsService implements IShellUtilsService {

	constructor(
		private readonly iWindow: IWindow,
		private readonly commonUtils: ICommonUtilsService,
	) {}

	public async executeCommand( //>
		command: string,
		args: string[] = [],
		cwd?: string,
	): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			const spawnedProcess = cp.spawn(command, args, { cwd, shell: true })

			spawnedProcess.on('error', (error: Error) => {
				reject(error)
			})

			spawnedProcess.on('close', (code: number | null) => {
				if (code !== 0) {
					reject(new Error(`Command "${command}" exited with code ${code}`))
				}
				else {
					resolve()
				}
			})
		})
	} //<

	public async getCDCommand( //>
		path: string | undefined,
		enterPoetryShell = false,
	): Promise<string | undefined> {
		let commandStr: string | undefined

		if (path) {
			// The `cd` command is the most universally supported for changing directories.
			// This universal approach is more robust than guessing the shell type from a
			// terminal's name, which is unreliable and fails if no terminal is active.
			commandStr = `cd "${path}"`
		}

		if (enterPoetryShell) {
			let poetryCommand = 'poetry shell'

			try {
				// Verify poetry is installed to provide a better error message.
				cp.execSync('poetry --version', { stdio: 'ignore' })
			}
			catch (error) {
				console.warn('[ShellUtilsService] Poetry check failed:', error)
				this.iWindow.showWarningMessage(
					'Poetry command not found or failed. Cannot activate Poetry shell.',
				)
				// If poetry isn't available, we can't create the poetry part of the command.
				poetryCommand = ''
			}

			if (poetryCommand) {
				// Combine with `cd` command if it exists, otherwise just use the poetry command.
				commandStr = commandStr ? `${commandStr} && ${poetryCommand}` : poetryCommand
			}
		}

		return commandStr
	} //<
    
}
