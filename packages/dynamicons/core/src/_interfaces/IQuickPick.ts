import type { QuickPickOptions } from 'vscode'

export interface IQuickPick {
	showQuickPickSingle<T, K extends keyof T>(
		items: T[],
		options: IQuickPickOptions,
		key: K
	): Promise<T[K] | undefined>
}

export interface IQuickPickOptions {
	placeHolder?: string
	matchOnDescription?: boolean
	matchOnDetail?: boolean
}

export interface ICoreQuickPickItem {
	label: string
	description?: string
	iconPath?: string
	iconNameInDefinitions: string
}
