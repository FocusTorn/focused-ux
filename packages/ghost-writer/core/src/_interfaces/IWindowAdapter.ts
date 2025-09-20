export interface IWindowAdapter {
    errMsg: (message: string) => void
    showInformationMessage: (message: string) => any // Thenable<string | undefined>
    showTimedInformationMessage: (message: string) => any // Thenable<string | undefined>
    get activeTextEditor(): any // vscode.TextEditor | undefined
}
