import type { IPackageJsonFormattingService, IPackageJsonConfig, IPackageJsonData } from '../_interfaces/IPackageJsonFormattingService.js'
import type { IFileSystemAdapter } from '../_interfaces/IFileSystemAdapter.js'
import type { IYamlAdapter } from '../_interfaces/IYamlAdapter.js'
import { CONFIG_FILE_NAME, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../_config/constants.js'

// These interfaces are defined in the _interfaces directory

export class PackageJsonFormattingService implements IPackageJsonFormattingService {

	constructor(
		private readonly fileSystem: IFileSystemAdapter,
		private readonly yaml: IYamlAdapter,
	) {}

	async formatPackageJson(packageJsonPath: string, workspaceRoot: string): Promise<void> {
		// Read the master order from .FocusedUX config
		const configPath = `${workspaceRoot}/${CONFIG_FILE_NAME}`
		let configContent: string

		try {
			configContent = await this.fileSystem.readFile(configPath)
		}
		catch (err: any) {
			throw new Error(`${ERROR_MESSAGES.CONFIG_FILE_NOT_FOUND}: ${err.message}`)
		}

		let config: IPackageJsonConfig

		try {
			config = this.yaml.load(configContent)
		}
		catch (err: any) {
			throw new Error(`${ERROR_MESSAGES.CONFIG_PARSE_ERROR}: ${err.message}`)
		}

		// Read from ProjectButler configuration
		const order = config?.ProjectButler?.['packageJson-order']

		if (!order || !Array.isArray(order)) {
			throw new Error('Configuration Error: \'ProjectButler.packageJson-order\' not found or invalid in \'.FocusedUX\'.')
		}

		// Ensure 'name' is always first
		const masterOrder = order.includes('name') ? order : ['name', ...order]

		// Read and parse the package.json file
		let packageContent: string

		try {
			packageContent = await this.fileSystem.readFile(packageJsonPath)
		}
		catch (err: any) {
			throw new Error(`${ERROR_MESSAGES.PACKAGE_JSON_NOT_FOUND}: ${err.message}`)
		}

		let packageData: IPackageJsonData
		try {
			packageData = JSON.parse(packageContent)
		}
		catch (err: any) {
			throw new Error(`${ERROR_MESSAGES.PACKAGE_JSON_PARSE_ERROR}: ${err.message}`)
		}
		const originalKeys = Object.keys(packageData)

		// Validate and collect unknown top-level keys
		const commentKeyRegex = /=.*=$/
		const unknownKeys: string[] = []

		for (const key of originalKeys) {
			if (commentKeyRegex.test(key)) {
				continue
			}

			if (!masterOrder.includes(key)) {
				unknownKeys.push(key)
			}
		}

		// Re-order the keys into a new object
		const orderedPackage: IPackageJsonData = {}

		// First, add all keys that are in the configuration order
		for (const key of masterOrder) {
			if (Object.prototype.hasOwnProperty.call(packageData, key)) {
				orderedPackage[key] = packageData[key]
			}
		}

		// Then, add any unknown keys at the end
		for (const key of unknownKeys) {
			orderedPackage[key] = packageData[key]
		}

		// Add back any comment-like keys
		for (const key of originalKeys) {
			if (commentKeyRegex.test(key)) {
				orderedPackage[key] = packageData[key]
			}
		}

		// Convert back to formatted JSON and write to file
		const newJsonContent = `${JSON.stringify(orderedPackage, null, 4)}\n`

		try {
			await this.fileSystem.writeFile(packageJsonPath, newJsonContent)
		}
		catch (err: any) {
			throw new Error(`Failed to write updated package.json: ${err.message}`)
		}
	}

	getUnknownKeys(packageData: IPackageJsonData, masterOrder: string[]): string[] {
		const commentKeyRegex = /=.*=$/
		const unknownKeys: string[] = []

		for (const key of Object.keys(packageData)) {
			if (commentKeyRegex.test(key)) {
				continue
			}

			if (!masterOrder.includes(key)) {
				unknownKeys.push(key)
			}
		}

		return unknownKeys
	}

}
