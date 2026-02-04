import * as vscode from 'vscode'

export class ThemeColorAdapter {
	create(id: string): vscode.ThemeColor {
		return new vscode.ThemeColor(id)
	}
}
