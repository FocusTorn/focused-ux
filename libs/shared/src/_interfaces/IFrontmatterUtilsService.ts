export interface IFrontmatterUtilsService {
	getFrontmatter: (filePath: string) => Promise<{ [key: string]: string } | undefined>
	getFrontmatter_validateFrontmatter: (content: string) => boolean
}
