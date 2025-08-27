import { createVscodeTestConfig } from '@fux/vscode-test-cli-config'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default createVscodeTestConfig({
    packageName: 'fux-project-butler',
    extensionDevelopmentPath: __dirname,
    workspaceFolder: './__tests__/integration/test-workspace',
    files: './__tests__/_out-tsc/**/*.test.js',
    setupFiles: './__tests__/_out-tsc/index.js',
})

// import { defineConfig } from '@vscode/test-cli'
// import * as path from 'node:path'
// import { fileURLToPath } from 'node:url'

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)

// const extensionDevelopmentPath = __dirname

// export default defineConfig({
//     // Use the Insiders build of VS Code to avoid conflicts with the stable build.
//     version: 'insiders',

//     // The test workspace is a directory that contains a VS Code workspace.
//     // It's opened before running the tests.
//     workspaceFolder: './test/test-workspace',

//     // Use a relative glob pattern. The test runner resolves this from the CWD.
//     files: './out-tsc/suite/**/*.test.js',

//     // Setup files to run before tests
//     setupFiles: ['./out-tsc/suite/index.js'],

//     // Environment variables for the extension host
//     env: {
//         VSCODE_TEST: '1'
//     },

//     // A list of launch arguments passed to VS Code.
//     launchArgs: [
//         // Use a dedicated user data directory for an isolated testing environment.
//         '--user-data-dir',
//         './.vscode-test/user-data',

//         // Disable all extensions except for the one being tested.
//         // This is the key to a clean and stable test environment.
//         '--disable-extensions',

//         // Disable the workspace trust feature to prevent popups that can block tests.
//         '--disable-workspace-trust',

//         // Explicitly disable noisy built-in extensions.
//         // Explicitly disable all non-essential extensions for a clean test run.
//         '--disable-extension',
//         'ms-vsliveshare.vsliveshare',
//         '--disable-extension',
//         'ms-python.python',
//         '--disable-extension',
//         'ms-python.gather',
//         '--disable-extension',
//         'vscode.git',
//         '--disable-extension',
//         'vscode.github-authentication',
//         '--disable-extension',
//         'GitHub.copilot',
//         '--disable-extension',
//         'GitHub.copilot-chat',

//         // Load our extension for testing
//         '--extensionDevelopmentPath',
//         extensionDevelopmentPath,

//         // Use Clean profile for testing
//         // '--profile',
//         // 'Clean',
//     ],
// })
