import type { ISavedStateItem } from './ISavedStateItem.js'

export interface IStorageService {
	saveState: (name: string, checkedItems: Array<{ uriString: string, checkboxState: number }>) => Promise<void>
	loadState: (id: string) => Promise<Array<{ uriString: string, checkboxState: number }> | undefined>
	loadAllSavedStates: () => Promise<ISavedStateItem[]>
	deleteState: (id: string) => Promise<void>
}
