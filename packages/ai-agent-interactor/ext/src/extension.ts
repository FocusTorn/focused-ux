import type { ExtensionContext, Uri, UriHandler } from 'vscode'
import * as vscode from 'vscode'
import type { IAiAgentInteractorService } from '@fux/ai-agent-interactor-core'
import { createDIContainer } from './injection.js'

class AiAgentUriHandler implements UriHandler {

	constructor(private readonly interactorService: IAiAgentInteractorService) {}

	public async handleUri(uri: Uri): Promise<void> {
		if (uri.path !== '/transfer') {
			return
		}

		const params = new URLSearchParams(uri.query)
		const payload = params.get('data')

		if (!payload) {
			vscode.window.showErrorMessage('AI Agent: No data received in URI.')
			return
		}

		const data = this.interactorService.deserialize(payload)

		if (!data) {
			vscode.window.showErrorMessage('AI Agent: Invalid data format in URI.')
			return
		}

		const projectBase = vscode.workspace.getConfiguration('fux-ai-agent-interactor').get<string>('projectBase')

		if (!projectBase) {
			vscode.window.showErrorMessage('AI Agent: `projectBase` setting is not configured.')
			return
		}

		const fileUri = vscode.Uri.joinPath(vscode.Uri.file(projectBase), data.path)

		try {
			const document = await vscode.workspace.openTextDocument(fileUri)
			const editor = await vscode.window.showTextDocument(document)

			if (data.elementChain.length === 0) {
				const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length))

				await editor.edit((editBuilder) => {
					editBuilder.replace(fullRange, data.code)
				})
			}
			else {
				const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
					'vscode.executeDocumentSymbolProvider',
					document.uri,
				)

				const targetRange = findSymbolRange(symbols, data.elementChain)

				if (targetRange) {
					await editor.edit((editBuilder) => {
						editBuilder.replace(targetRange, data.code)
					})
				}
				else {
					vscode.window.showErrorMessage(`AI Agent: Could not find element path: ${data.elementChain.join(' ► ')}`)
					return
				}
			}

			await document.save()
			// Use a less intrusive notification
			vscode.window.setStatusBarMessage(`AI Agent: Updated ${data.path}`, 5000)
		}
		catch (error: any) {
			vscode.window.showErrorMessage(`AI Agent Error: ${error.message}`)
		}
	}

}

export function activate(context: ExtensionContext): void {
	const container = createDIContainer(context)
	const interactorService = container.resolve<IAiAgentInteractorService>('interactorService')
	const uriHandler = new AiAgentUriHandler(interactorService)

	context.subscriptions.push(vscode.window.registerUriHandler(uriHandler))
}

export function deactivate(): void {}

function findSymbolRange(symbols: vscode.DocumentSymbol[] | undefined, chain: string[]): vscode.Range | undefined {
	if (!symbols || symbols.length === 0 || chain.length === 0) {
		return undefined
	}

	const [current, ...rest] = chain

	for (const symbol of symbols) {
		if (symbol.name === current) {
			if (rest.length === 0) {
				return symbol.range
			}
			else {
				return findSymbolRange(symbol.children, rest)
			}
		}
	}
	return undefined
}
