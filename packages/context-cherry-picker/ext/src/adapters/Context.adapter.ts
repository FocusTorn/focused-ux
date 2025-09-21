import * as vscode from 'vscode'
import type { IContext } from '@fux/context-cherry-picker-core'

export class ContextAdapter implements IContext {
    constructor(private context: vscode.ExtensionContext) {}

    get globalStorageUri(): string {
        return this.context.globalStorageUri.fsPath
    }

    get extensionUri(): string {
        return this.context.extensionUri.fsPath
    }

    get subscriptions(): { dispose: () => any }[] {
        return this.context.subscriptions
    }
}
