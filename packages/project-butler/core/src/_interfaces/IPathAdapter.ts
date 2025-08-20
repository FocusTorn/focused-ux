export interface IPathAdapter {
	dirname(path: string): string
	basename(path: string): string
	join(...paths: string[]): string
} 