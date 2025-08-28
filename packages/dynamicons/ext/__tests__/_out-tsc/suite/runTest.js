"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path = tslib_1.__importStar(require("path"));
const test_electron_1 = require("@vscode/test-electron");
async function main() {
    try {
        // The folder containing the Extension Manifest package.json
        const extensionDevelopmentPath = path.resolve(__dirname, '../../../');
        // The path to test runner
        const extensionTestsPath = path.resolve(__dirname, './suite');
        const vscodeExecutablePath = await (0, test_electron_1.downloadAndUnzipVSCode)('1.85.0');
        const cliPath = (0, test_electron_1.resolveCliPathFromVSCodeExecutablePath)(vscodeExecutablePath);
        const [cli, ...args] = (0, test_electron_1.resolveCliArgsFromVSCodeExecutablePath)(vscodeExecutablePath);
        // Use cp.spawn / cp.exec for custom setup
        // const cp = require('child_process');
        // await new Promise((resolve, reject) => {
        //   cp.spawn(cli, [...args, '--install-extension', '<EXTENSION-ID-OR-PATH-TO-VSIX>'], { 
        //     cwd: extensionDevelopmentPath, 
        //     stdio: 'inherit' 
        //   }).on('error', reject).on('close', resolve);
        // });
        // Download VS Code, unzip it and run the integration test
        await (0, test_electron_1.runTests)({
            vscodeExecutablePath,
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: [
                '--disable-extensions',
                '--disable-workspace-trust',
                '--disable-telemetry',
                '--disable-updates',
                '--disable-crash-reporter',
                '--disable-background-timer-throttling',
                '--disable-renderer-backgrounding',
                '--disable-backgrounding-occluded-windows',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection',
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });
    }
    catch (err) {
        console.error('Failed to run tests');
        process.exit(1);
    }
}
main();
//# sourceMappingURL=runTest.js.map