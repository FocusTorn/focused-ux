// ESLint & Imports -->>

//= NODE JS ===================================================================================================
import * as yaml from 'js-yaml'
import type { ReadStream } from 'node:fs'

//= IMPLEMENTATION TYPES ======================================================================================
import type { IFrontmatterUtilsService } from '../_interfaces/IFrontmatterUtilsService.js'
import type { IFileSystem } from '../_interfaces/IFileSystem.js'

//--------------------------------------------------------------------------------------------------------------<<

export class FrontmatterUtilsService implements IFrontmatterUtilsService {

	constructor(
		private readonly iFileSystem: IFileSystem,
	) {}

	public async addFrontmatter(filePath: string, frontmatter: Record<string, any>): Promise<void> {
		const content = await this.iFileSystem.readFile(filePath)
		const contentStr = content.toString()
		
		const yamlStr = yaml.dump(frontmatter)
		const newContent = `---\n${yamlStr}---\n${contentStr}`
		
		await this.iFileSystem.writeFile(filePath, newContent)
	}

	public async getFrontmatter(filePath: string): Promise<{ [key: string]: string } | undefined> {
		try {
			const content = await this.iFileSystem.readFile(filePath)
			const contentStr = content.toString()
			
			// Match frontmatter pattern - handle both standard and empty cases
			let match = contentStr.match(/^---\n([\s\S]*?)\n---\n/)

			if (!match) {
				// Try to match empty frontmatter case: ---\n---\n
				match = contentStr.match(/^---\n---\n/)
				if (match) {
					return {}
				}
			}
			
			if (match) {
				const yamlStr = match[1]

				if (yamlStr && yamlStr.trim() === '') {
					// Empty frontmatter
					return {}
				}

				const parsed = yaml.load(yamlStr) as Record<string, any>
				// Convert to string values as expected by interface
				const result: { [key: string]: string } = {}

				for (const [key, value] of Object.entries(parsed)) {
					if (value instanceof Date) {
						// Format dates as ISO strings to maintain consistency
						result[key] = value.toISOString().split('T')[0] // YYYY-MM-DD format
					}
					else if (Array.isArray(value)) {
						// Convert arrays to comma-separated strings
						result[key] = value.join(',')
					}
					else {
						result[key] = String(value)
					}
				}
				return result
			}
			return undefined
		}
		catch (_error) {
			return undefined
		}
	}

	public async getFrontmatter_extractContent(fileStream: ReadStream): Promise<string | undefined> {
		return new Promise((resolve) => {
			let content = ''

			fileStream.on('data', (chunk) => {
				content += chunk.toString()
			})
			fileStream.on('end', () => {
				const match = content.match(/^---\n([\s\S]*?)\n---\n/)

				if (match) {
					resolve(match[1])
				}
				else {
					resolve(undefined)
				}
			})
			fileStream.on('error', () => {
				resolve(undefined)
			})
		})
	}

	public getFrontmatter_parseContent(frontmatterContent: string): { [key: string]: string } {
		try {
			const parsed = yaml.load(frontmatterContent) as Record<string, any>
			const result: { [key: string]: string } = {}

			for (const [key, value] of Object.entries(parsed)) {
				if (value instanceof Date) {
					result[key] = value.toISOString().split('T')[0] // YYYY-MM-DD format
				}
				else if (Array.isArray(value)) {
					result[key] = value.join(',')
				}
				else {
					result[key] = String(value)
				}
			}
			return result
		}
		catch {
			return {}
		}
	}

	public getFrontmatter_validateFrontmatter(content: string): boolean {
		try {
			const match = content.match(/^---\n([\s\S]*?)\n---\n/)

			if (match) {
				yaml.load(match[1])
				return true
			}
			return false
		}
		catch {
			return false
		}
	}

}
