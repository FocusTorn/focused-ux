import * as vscode from 'vscode'

/**
 * Displays an information message that automatically dismisses after a specified duration.
 * @param message The message to show.
 * @param duration The duration in milliseconds to display the message.
 */
export async function showTimedInformationMessage(message: string, duration: number): Promise<void> {
	await vscode.window.withProgress(
		{
			location: vscode.ProgressLocation.Notification,
			title: message,
			cancellable: false,
		},
		async () => {
			await new Promise(resolve => setTimeout(resolve, duration))
		},
	)
}
