import { Uri, window as VsCodeWindow } from 'vscode'
import type { QuickPickItem, QuickPickOptions, QuickPickItemKind } from 'vscode'
import type { IQuickPick, ICoreQuickPickItem } from '@fux/dynamicons-core'

// Type guard to check if an item is a core quick pick item and not a separator
function isCoreQuickPickItem(item: any): item is ICoreQuickPickItem {
	return item && typeof item.iconPath === 'string' && !('kind' in item)
}

export class QuickPickAdapter implements IQuickPick {

	public async showQuickPickSingle<T extends ICoreQuickPickItem, K extends keyof T>(
		items: (T | { label: string, kind: typeof QuickPickItemKind.Separator })[],
		options: Pick<QuickPickOptions, 'placeHolder' | 'ignoreFocusOut' | 'matchOnDescription' | 'matchOnDetail'>,
		returnKey: K,
	): Promise<T[K] | undefined> {
		return new Promise<T[K] | undefined>((resolve) => {
			let accepted = false
			const quickPick = VsCodeWindow.createQuickPick<QuickPickItem & { original: T | { kind: any } }>()

			quickPick.items = items.map((item) => {
				if (isCoreQuickPickItem(item)) {
					return {
						...item,
						iconPath: Uri.file(item.iconPath),
						original: item,
					}
				}
				// It's a separator
				return { ...item, original: item }
			})

			quickPick.placeholder = options.placeHolder
			quickPick.ignoreFocusOut = options.ignoreFocusOut === undefined ? true : options.ignoreFocusOut
			quickPick.matchOnDescription = options.matchOnDescription || false
			quickPick.matchOnDetail = options.matchOnDetail || false
			quickPick.canSelectMany = false

			quickPick.onDidAccept(() => {
				accepted = true

				const selectedItem = quickPick.selectedItems[0]

				quickPick.hide()
				quickPick.dispose()
				if (selectedItem && 'original' in selectedItem && !('kind' in selectedItem.original)) {
					const originalItem = selectedItem.original as T

					resolve(originalItem[returnKey])
				}
				else {
					resolve(undefined)
				}
			})

			quickPick.onDidHide(() => {
				if (!accepted) {
					resolve(undefined)
				}
				quickPick.dispose()
			})
			quickPick.show()
		})
	}

}
