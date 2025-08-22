import * as vscode from 'vscode'

export class UriAdapter {
	file(path: string): vscode.Uri {
		return vscode.Uri.file(path)
	}

	create(uri: any): vscode.Uri {
		return uri
	}

	joinPath(base: vscode.Uri, ...pathSegments: string[]): vscode.Uri {
		return vscode.Uri.joinPath(base, ...pathSegments)
	}

	dirname(uri: vscode.Uri): string {
		return vscode.Uri.file(uri.fsPath).path.split('/').slice(0, -1).join('/') || '/'
	}
} 