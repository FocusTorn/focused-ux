export interface IFrontmatterUtilsService {
  getFrontmatter: (filePath: string) => Promise<{ [key: string]: string } | undefined>;
} 