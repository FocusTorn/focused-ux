import * as vscode from 'vscode'
import type { ITreeItemFactory } from '@fux/context-cherry-picker-core'

export class TreeItemFactoryAdapter implements ITreeItemFactory {
    getCheckboxStateUnchecked(): number {
        return vscode.TreeItemCheckboxState.Unchecked
    }

    getCheckboxStateChecked(): number {
        return vscode.TreeItemCheckboxState.Checked
    }

    getCollapsibleStateNone(): number {
        return vscode.TreeItemCollapsibleState.None
    }

    getCollapsibleStateCollapsed(): number {
        return vscode.TreeItemCollapsibleState.Collapsed
    }

    getCollapsibleStateExpanded(): number {
        return vscode.TreeItemCollapsibleState.Expanded
    }
}
