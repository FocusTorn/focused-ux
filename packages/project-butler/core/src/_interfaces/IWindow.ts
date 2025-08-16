export interface IWindow {
	activeTextEditorUri: string | undefined
	showErrorMessage: (message: string) => void
	showTimedInformationMessage: (message: string, duration?: number) => void
}
