import * as vscode from 'vscode'

export class ThemeIconAdapter {
	create(id: string, color?: vscode.ThemeColor): vscode.ThemeIcon {
		return color ? new vscode.ThemeIcon(id, color) : new vscode.ThemeIcon(id)
	}
}
