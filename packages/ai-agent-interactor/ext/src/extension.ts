import type { ExtensionContext, Uri, UriHandler, IRange, IDocumentSymbol, ITextDocument, ITextEditor, IWindow, ICommands, IWorkspace } from '@fux/shared'
import { 
	UriAdapter, 
	RangeAdapter, 
	DocumentSymbolAdapter, 
	TextDocumentAdapter, 
	TextEditorAdapter,
	UriHandlerAdapter,
	WindowAdapter,
	CommandsAdapter,
	WorkspaceAdapter
} from '@fux/shared'
import type { IAiAgentInteractorService } from '@fux/ai-agent-interactor-core'
import { createDIContainer } from './injection.js'

class AiAgentUriHandler implements UriHandler {
	private windowAdapter: IWindow
	private commandsAdapter: ICommands
	private workspaceAdapter: IWorkspace

	constructor(
		private readonly interactorService: IAiAgentInteractorService,
		windowAdapter: IWindow,
		commandsAdapter: ICommands,
		workspaceAdapter: IWorkspace
	) {
		this.windowAdapter = windowAdapter
		this.commandsAdapter = commandsAdapter
		this.workspaceAdapter = workspaceAdapter
	}

	public async handleUri(uri: Uri): Promise<void> {
		if (uri.path !== '/transfer') {
			return
		}

		const params = new URLSearchParams(uri.query)
		const payload = params.get('data')

		if (!payload) {
			this.windowAdapter.showErrorMessage('AI Agent: No data received in URI.')
			return
		}

		const data = this.interactorService.deserialize(payload)

		if (!data) {
			this.windowAdapter.showErrorMessage('AI Agent: Invalid data format in URI.')
			return
		}

		const config = this.workspaceAdapter.getConfiguration('fux-ai-agent-interactor')
		const projectBase = config.get<string>('projectBase')

		if (!projectBase) {
			this.windowAdapter.showErrorMessage('AI Agent: `projectBase` setting is not configured.')
			return
		}

		const baseUri = UriAdapter.file(projectBase)
		const fileUri = UriAdapter.joinPath(baseUri, data.path)

		try {
			const document = await this.workspaceAdapter.openTextDocument(fileUri)
			const editor = await this.windowAdapter.showTextDocument(document)

			if (data.elementChain.length === 0) {
				const startPos = document.positionAt(0)
				const endPos = document.positionAt(document.getText().length)
				const fullRange = RangeAdapter.create(startPos.create(0, 0), endPos.create(0, 0))

				await editor.edit((editBuilder) => {
					editBuilder.replace(fullRange, data.code)
				})
			}
			else {
				const symbols = await this.commandsAdapter.executeCommand<IDocumentSymbol[]>(
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
					this.windowAdapter.showErrorMessage(`AI Agent: Could not find element path: ${data.elementChain.join(' ► ')}`)
					return
				}
			}

			await document.save()
			// Use a less intrusive notification
			this.windowAdapter.setStatusBarMessage(`AI Agent: Updated ${data.path}`, 5000)
		}
		catch (error: any) {
			this.windowAdapter.showErrorMessage(`AI Agent Error: ${error.message}`)
		}
	}

}

export async function activate(context: ExtensionContext): Promise<void> {
	const container = await createDIContainer(context)
	const interactorService = container.resolve<IAiAgentInteractorService>('interactorService')
	
	// Create adapters
	const windowAdapter = new WindowAdapter(container.resolve('configurationService'))
	const commandsAdapter = new CommandsAdapter()
	const workspaceAdapter = new WorkspaceAdapter()
	
	const uriHandler = new AiAgentUriHandler(interactorService, windowAdapter, commandsAdapter, workspaceAdapter)
	const vscodeUriHandler = UriHandlerAdapter.create(uriHandler)

	context.subscriptions.push(windowAdapter.registerUriHandler(vscodeUriHandler))
}

export function deactivate(): void {}

function findSymbolRange(symbols: IDocumentSymbol[] | undefined, chain: string[]): IRange | undefined {
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
