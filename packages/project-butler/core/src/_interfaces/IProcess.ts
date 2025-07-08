export interface IProcess {
	exec(
		command: string,
		options: { cwd: string },
		callback: (error: Error | null, stdout: string, stderr: string) => void,
	): void
	getWorkspaceRoot(): string | undefined
}