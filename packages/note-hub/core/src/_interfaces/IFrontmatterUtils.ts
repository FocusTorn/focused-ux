export interface IFrontmatterUtilsService {
	addFrontmatter: (filePath: string, frontmatter: Record<string, any>) => Promise<void>
	getFrontmatter: (filePath: string) => Promise<{ [key: string]: string } | undefined>
	getFrontmatter_validateFrontmatter: (content: string) => boolean
}
