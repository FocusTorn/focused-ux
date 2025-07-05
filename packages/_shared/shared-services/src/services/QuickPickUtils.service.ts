// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { QuickPickItem, QuickPickOptions } from 'vscode'

//= IMPLEMENTATION TYPES ======================================================================================
import type { IQuickPickUtilsService, IWindow } from '../interfaces.js'

//--------------------------------------------------------------------------------------------------------------<<

export class QuickPickUtilsService implements IQuickPickUtilsService {

	constructor(
		private readonly iWindow: IWindow,
	) {}

	public async showQuickPickSingle<T extends QuickPickItem, K extends keyof T>( //>
		items: T[],
		options: QuickPickOptions,
		defaultKey?: K,
	): Promise<T[K] | undefined> {
		return new Promise<T[K] | undefined>((resolve) => {
			let accepted = false
			const quickPick = this.iWindow.createQuickPick<T>()

			quickPick.items = items
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
				if (selectedItem) {
					resolve(defaultKey ? selectedItem[defaultKey] : (selectedItem as unknown as T[K]))
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
	} //<

} // <
