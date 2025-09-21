import * as vscode from 'vscode'
import type { IWorkspace } from '@fux/context-cherry-picker-core'

export class WorkspaceAdapter implements IWorkspace {
    get workspaceFolders(): readonly vscode.WorkspaceFolder[] | undefined {
        return vscode.workspace.workspaceFolders
    }

    get workspaceFile(): vscode.Uri | undefined {
        return vscode.workspace.workspaceFile
    }

    get name(): string | undefined {
        return vscode.workspace.name
    }

    getWorkspaceFolder(uri: vscode.Uri): vscode.WorkspaceFolder | undefined {
        return vscode.workspace.getWorkspaceFolder(uri)
    }

    async findFiles(
        include: vscode.GlobPattern,
        exclude?: vscode.GlobPattern | null,
        maxResults?: number
    ): Promise<vscode.Uri[]> {
        return await vscode.workspace.findFiles(include, exclude, maxResults)
    }

    async openTextDocument(uri: vscode.Uri): Promise<vscode.TextDocument> {
        return await vscode.workspace.openTextDocument(uri)
    }

    async readFile(uri: vscode.Uri): Promise<Uint8Array> {
        return await vscode.workspace.fs.readFile(uri)
    }

    async writeFile(uri: vscode.Uri, content: Uint8Array): Promise<void> {
        await vscode.workspace.fs.writeFile(uri, content)
    }

    async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
        return await vscode.workspace.fs.stat(uri)
    }

    async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
        return await vscode.workspace.fs.readDirectory(uri)
    }

    async createDirectory(uri: vscode.Uri): Promise<void> {
        await vscode.workspace.fs.createDirectory(uri)
    }

    async delete(uri: vscode.Uri, options?: { recursive?: boolean; useTrash?: boolean }): Promise<void> {
        await vscode.workspace.fs.delete(uri, options)
    }

    async rename(source: vscode.Uri, target: vscode.Uri, options?: { overwrite?: boolean }): Promise<void> {
        await vscode.workspace.fs.rename(source, target, options)
    }

    async copy(source: vscode.Uri, target: vscode.Uri, options?: { overwrite?: boolean }): Promise<void> {
        await vscode.workspace.fs.copy(source, target, options)
    }
}
