export interface IPositionAdapter {
    create: (line: number, character: number) => any // vscode.Position
}
