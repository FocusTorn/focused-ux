const EXT_ID_PREFIX = 'fux-project-butler-dc'

export const constants = {
	extension: {
		name: 'F-UX: Project Butler',
		id: EXT_ID_PREFIX,
	},
	commands: {
		updateTerminalPath: `${EXT_ID_PREFIX}.updateTerminalPath`,
		createBackup: `${EXT_ID_PREFIX}.createBackup`,
		enterPoetryShell: `${EXT_ID_PREFIX}.enterPoetryShell`,
		formatPackageJson: `${EXT_ID_PREFIX}.formatPackageJson`,
		hotswap: `${EXT_ID_PREFIX}.hotswap`,
	},
} as const
