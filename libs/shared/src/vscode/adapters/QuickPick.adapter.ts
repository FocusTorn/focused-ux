import * as vscode from 'vscode'
import type { IQuickPick } from '../../_interfaces/IVSCode.js'

export class QuickPickAdapter implements IQuickPick {

	async showQuickPickSingle<T extends Record<string, any>, K extends keyof T>(
		items: T[],
		options: {
			placeHolder?: string
			matchOnDescription?: boolean
			matchOnDetail?: boolean
		},
		propertyKey: K,
	): Promise<T[K] | undefined> {
		const vscodeItems = items.map(item => ({
			label: item.label,
			description: item.description,
			iconPath: item.iconPath,
			data: item[propertyKey],
		}))

		const selected = await vscode.window.showQuickPick(vscodeItems, {
			placeHolder: options.placeHolder,
			matchOnDescription: options.matchOnDescription,
			matchOnDetail: options.matchOnDetail,
		})

		return selected?.data
	}

}
