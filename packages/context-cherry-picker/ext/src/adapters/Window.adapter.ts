import * as vscode from 'vscode'
import type { IWindow } from '@fux/context-cherry-picker-core'

export class WindowAdapter implements IWindow {
    async showInformationMessage(message: string): Promise<void> {
        await vscode.window.showInformationMessage(message)
    }

    async showWarningMessage(message: string): Promise<void> {
        await vscode.window.showWarningMessage(message)
    }

    async showErrorMessage(message: string): Promise<void> {
        await vscode.window.showErrorMessage(message)
    }

    async showQuickPick<T extends vscode.QuickPickItem>(
        items: T[] | Thenable<T[]>,
        options?: vscode.QuickPickOptions
    ): Promise<T | undefined> {
        return await vscode.window.showQuickPick(items, options)
    }

    async showInputBox(options?: vscode.InputBoxOptions): Promise<string | undefined> {
        return await vscode.window.showInputBox(options)
    }
}
