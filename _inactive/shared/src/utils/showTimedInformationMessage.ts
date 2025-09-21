export interface IProgressWindow {
	withProgress: <T>(
		options: { title: string, cancellable: boolean },
		task: (progress: { report: (value: { message: string }) => void }) => Promise<T>,
	) => Promise<T>
}

export async function showTimedInformationMessage(
	window: IProgressWindow,
	message: string,
	durationMs: number,
): Promise<void> {
	await window.withProgress(
		{
			title: message,
			cancellable: false,
		},
		async () => {
			await new Promise(resolve => setTimeout(resolve, durationMs))
		},
	)
}
