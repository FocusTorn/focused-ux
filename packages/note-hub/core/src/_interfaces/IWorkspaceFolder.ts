import type { IUri } from './IUri.ts'

export interface IWorkspaceFolder {
	uri: IUri
	name: string
	index: number
}
