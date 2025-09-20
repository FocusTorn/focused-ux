import * as vscode from 'vscode'
import type { IPositionAdapter } from '@fux/ghost-writer-core'

export class PositionAdapter implements IPositionAdapter {

    create(line: number, character: number): vscode.Position {
        return new vscode.Position(line, character)
    }

}
