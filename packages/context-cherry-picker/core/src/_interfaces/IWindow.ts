// ESLint & Imports -->>

//--------------------------------------------------------------------------------------------------------------<<

export interface IWindow {
	showInformationMessage: (message: string) => void
	showWarningMessage: (message: string, modal: boolean, ...items: string[]) => Promise<string | undefined>
	showErrorMessage: (message: string) => void
	showInputBox: (options: { prompt: string }) => Promise<string | undefined>
	setClipboard: (text: string) => Promise<void>
	setStatusBarMessage: (message: string, durationInMs: number) => void
	showDropdownMessage: (message: string, durationInMs: number) => void
	showDescriptionMessage: (message: string, durationInMs: number) => void
}
