export interface ITerminal {
	sendText(text: string): void
	show(): void
}

export interface ITerminalProvider {
	activeTerminal: ITerminal | undefined
	createTerminal(name: string): ITerminal
}