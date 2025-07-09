import type { IConfigurationService } from '../_interfaces/IConfigurationService.js'
import type { IFileSystem } from '../_interfaces/IFileSystem.js'
import type { IProcess } from '../_interfaces/IProcess.js'
import * as path from 'node:path'
import * as yaml from 'js-yaml'

export class ConfigurationService implements IConfigurationService {
	constructor(
		private readonly fileSystem: IFileSystem,
		private readonly process: IProcess,
	) {}

	public async get<T>(keyPath: string, defaultValue: T): Promise<T> {
		const workspaceRoot = this.process.getWorkspaceRoot()
		if (!workspaceRoot) {
			return defaultValue
		}

		const configPath = path.join(workspaceRoot, '.FocusedUX')
		try {
			const fileContent = await this.fileSystem.readFile(configPath)
			const config = yaml.load(fileContent) as any

			// Navigate the object using the dot-separated key path
			const value = keyPath.split('.').reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : undefined, config)

			return value === undefined ? defaultValue : (value as T)
		}
		catch (_e) {
			// File not found, parsing error, etc.
			return defaultValue
		}
	}
}