export interface IWindow {
	showInformationMessage: (message: string) => Promise<string | undefined>
	showErrorMessage: (message: string) => Promise<string | undefined>
	showWarningMessage: (message: string) => Promise<string | undefined>
	showTimedInformationMessage: (message: string) => Promise<void>
}
