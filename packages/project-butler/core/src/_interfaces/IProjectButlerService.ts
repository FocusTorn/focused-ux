export interface IProjectButlerService {
	updateTerminalPath: (uri?: string) => Promise<void>
	createBackup: (uri?: string) => Promise<void>
	enterPoetryShell: (uri?: string) => Promise<void>
	formatPackageJson: (uri?: string) => Promise<void>
}
