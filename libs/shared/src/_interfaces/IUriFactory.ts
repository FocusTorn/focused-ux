import type { IUri } from './IVSCode.js'

export interface IUriFactory {
	file(path: string): IUri
	create(uri: any): IUri
	joinPath(base: IUri, ...paths: string[]): IUri
	dirname(uri: IUri): IUri
} 