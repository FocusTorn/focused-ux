import { vi } from 'vitest'
import { Buffer } from 'node:buffer'
import * as vscode from 'vscode'
import { 
    setupExtensionTestEnvironment, 
    resetExtensionMocks,
    setupVSCodeMocks as setupGlobalVSCodeMocks,
    type ExtensionTestMocks as GlobalExtensionTestMocks 
} from '@ms-ext'

// ============================================================================
// TEST HELPERS
// ============================================================================

// Extended Extension test environment interface that adds project-specific mocks
export interface ExtensionTestMocks extends GlobalExtensionTestMocks {
    // Additional project-specific mocks can be added here if needed
} //<

export function setupTestEnvironment(): ExtensionTestMocks { //>
    // Start with global extension test environment
    const globalMocks = setupExtensionTestEnvironment()
    
    // Return the global mocks as our extended interface
    // (no additional project-specific mocks needed for now)
    return globalMocks as ExtensionTestMocks
} //<

export function resetAllMocks(mocks: ExtensionTestMocks): void { //>
    // Use global extension reset function
    resetExtensionMocks(mocks)
} //<

export function setupVSCodeMocks(mocks: ExtensionTestMocks): void { //>
    // Use global extension setup function
    setupGlobalVSCodeMocks(mocks)
} //<

export function createMockExtensionContext(): vscode.ExtensionContext { //>
    return {
        subscriptions: [],
        workspaceState: {} as any,
        globalState: {} as any,
        extensionPath: '/test/extension',
        globalStoragePath: '/test/global',
        logPath: '/test/log',
        extensionUri: { fsPath: '/test/extension' } as any,
        storageUri: { fsPath: '/test/storage' } as any,
        globalStorageUri: { fsPath: '/test/global' } as any,
        logUri: { fsPath: '/test/log' } as any,
        extensionMode: 1,
        environmentVariableCollection: {} as any,
        secrets: {} as any,
        asAbsolutePath: vi.fn(),
        storagePath: '/test/storage',
        extension: {} as any,
        languageModelAccessInformation: {} as any,
    }
} //<

export function createMockUri(path: string): vscode.Uri { //>
    return {
        fsPath: path,
        scheme: 'file',
        authority: '',
        path,
        query: '',
        fragment: '',
        with: vi.fn(),
        toJSON: vi.fn(),
    } as any
} //<
