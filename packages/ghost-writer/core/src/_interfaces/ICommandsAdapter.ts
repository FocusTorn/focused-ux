export interface ICommandsAdapter {
    registerCommand: (
        command: string,
        callback: (...args: any[]) => any,
        thisArg?: any,
    ) => any // vscode.Disposable
}
