import type { IFrontmatterUtilsService, IFileSystem } from '@fux/note-hub-core'

import * as yaml from 'js-yaml'

export class FrontmatterUtilsAdapter implements IFrontmatterUtilsService {

	constructor(private fileSystem: IFileSystem) {}

	async addFrontmatter(filePath: string, frontmatter: Record<string, any>): Promise<void> {
		const content = await this.fileSystem.readFile(filePath)
		const contentStr = content.toString()
        
		const yamlStr = yaml.dump(frontmatter)
		const newContent = `---\n${yamlStr}---\n${contentStr}`
        
		await this.fileSystem.writeFile(filePath, newContent)
	}

	async getFrontmatter(filePath: string): Promise<{ [key: string]: string } | undefined> {
		try {
			const content = await this.fileSystem.readFile(filePath)
			const contentStr = content.toString()
            
			const match = contentStr.match(/^---\n([\s\S]*?)\n---\n/)

			if (match) {
				const yamlStr = match[1]
				const parsed = yaml.load(yamlStr) as Record<string, any>
				// Convert to string values as expected by interface
				const result: { [key: string]: string } = {}

				for (const [key, value] of Object.entries(parsed)) {
					result[key] = String(value)
				}
				return result
			}
			return undefined
		}
		catch (_error) {
			return undefined
		}
	}

	getFrontmatter_validateFrontmatter(content: string): boolean {
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
