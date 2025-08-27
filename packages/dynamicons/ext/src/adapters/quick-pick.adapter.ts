import type { IQuickPick, IQuickPickOptions } from '@fux/dynamicons-core'
import * as vscode from 'vscode'

export class QuickPickAdapter implements IQuickPick {

	async showQuickPickSingle<T, K extends keyof T>(
		items: T[],
		options: IQuickPickOptions,
		key: K,
	): Promise<T[K] | undefined> {
		const quickPickItems = items.map(item => ({
			label: (item as any).label || '',
			description: (item as any).description || '',
			detail: (item as any).detail || '',
			iconPath: (item as any).iconPath || undefined,
			data: item,
		}))

		const selected = await vscode.window.showQuickPick(quickPickItems, {
			placeHolder: options.placeHolder,
			matchOnDescription: options.matchOnDescription,
			matchOnDetail: options.matchOnDetail,
		})

		return selected ? selected.data[key] : undefined
	}

}
