export interface IWindow {
	activeTextEditorUri: string | undefined
	showErrorMessage: (message: string) => void
	showInformationMessage: ((message: string) => PromiseLike<string | undefined>) & (<T extends string>(
		message: string,
		modal: boolean,
		...items: T[]
	) => PromiseLike<T | undefined>)
	showWarningMessage: (message: string) => void
	withProgress: <T>(
		options: { title: string, cancellable: boolean },
		task: (progress: { report: (value: { message: string }) => void }) => Promise<T>,
	) => PromiseLike<T>
}
