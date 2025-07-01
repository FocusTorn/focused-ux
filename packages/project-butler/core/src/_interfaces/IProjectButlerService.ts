import type { Uri } from 'vscode'

export interface IProjectButlerService {
	// Terminal Butler Methods
	updateTerminalPath: (uri: Uri) => Promise<void>
	enterPoetryShell: (uri?: Uri) => Promise<void>
	formatPackageJson: (uri: Uri) => Promise<void>

	// Chrono Copy Methods
	createBackup: (fileUri: Uri) => Promise<void>
}