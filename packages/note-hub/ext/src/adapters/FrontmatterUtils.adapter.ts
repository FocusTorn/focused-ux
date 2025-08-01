import type { IFrontmatterUtilsService, IFileSystem } from '@fux/shared'
import * as yaml from 'js-yaml'

export class FrontmatterUtilsAdapter implements IFrontmatterUtilsService {

	constructor(private readonly iFileSystem: IFileSystem) {}

	public getFrontmatter_validateFrontmatter(content: string): boolean {
		const match = content.match(/^---\s*\n([\s\S]+?)\n---\s*\n/)

		return !!match
	}

	public async getFrontmatter(filePath: string): Promise<{ [key: string]: string } | undefined> {
		try {
			const content = await this.iFileSystem.readFile(filePath)
			const match = content.match(/^---\s*\n([\s\S]+?)\n---\s*\n/)

			if (match && match[1]) {
				return yaml.load(match[1]) as { [key: string]: string }
			}
		}
		catch (_error) {
			// Silently fail if file not found or other read error
		}
		return undefined
	}

}
