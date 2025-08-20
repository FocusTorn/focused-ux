import { Position as VSCodePosition } from 'vscode'

export class PositionAdapter {
  create(line: number, character: number): VSCodePosition {
    return new VSCodePosition(line, character)
  }
} 