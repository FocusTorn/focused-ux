import { defineConfig } from '@vscode/test-cli'

export default defineConfig({
    // Use the Insiders build of VS Code to avoid conflicts with the stable build.
    version: 'insiders',

    // The test workspace is a directory that contains a VS Code workspace.
    // It's opened before running the tests.
    workspaceFolder: './test/test-workspace',

    // Use a relative glob pattern. The test runner resolves this from the CWD.
    files: './out-tsc/suite/**/*.test.js',

    // A list of launch arguments passed to VS Code.
    launchArgs: [
        './test/test-workspace',
        // Use a dedicated user data directory for an isolated testing environment.
        '--user-data-dir',
        './.vscode-test/user-data',
        // Disable the workspace trust feature to prevent popups that can block tests.
        '--disable-workspace-trust',
        // Explicitly disable noisy built-in extensions.
        '--disable-extension',
        'ms-vsliveshare.vsliveshare',
        '--disable-extension',
        'ms-python.gather',
        // Load our extension for testing
        '--extensionDevelopmentPath',
        '.',
        // Use Clean profile for testing
        '--profile',
        'Clean',
    ],
})
