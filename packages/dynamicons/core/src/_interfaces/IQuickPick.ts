import type { QuickPickOptions } from 'vscode'
import type { ICoreQuickPickItem } from './ICoreQuickPickItem.js'

export interface IQuickPick {
	showQuickPickSingle: <T extends ICoreQuickPickItem, K extends keyof T>(
		items: T[],
		options: Pick<QuickPickOptions, 'placeHolder' | 'ignoreFocusOut' | 'matchOnDescription' | 'matchOnDetail'>,
		returnKey: K,
	) => Promise<T[K] | undefined>
}
