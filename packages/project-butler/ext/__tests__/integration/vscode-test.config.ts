import * as path from 'path'

export const testConfig = {
  // The folder containing the Extension Manifest package.json
  extensionDevelopmentPath: path.resolve(__dirname, '../../'),
  
  // The path to the extension test script
  extensionTestsPath: path.resolve(__dirname, './suite/index'),
  
  // VS Code launch arguments
  launchArgs: [
    '--disable-extensions', // Disable other extensions
    '--disable-workspace-trust', // Disable workspace trust prompts
    '--disable-telemetry', // Disable telemetry
    '--disable-updates', // Disable updates
    '--skip-welcome', // Skip welcome page
    '--skip-release-notes', // Skip release notes
    '--disable-features=VSCodeWebNode', // Disable web node features
    '--disable-authentication-providers', // Disable authentication providers (GitHub, etc.)
    '--disable-git', // Disable git integration
    '--user-data-dir', path.resolve(__dirname, './test-user-data'), // Use separate user data directory
    '--extensions-dir', path.resolve(__dirname, './test-extensions'), // Use separate extensions directory
  ],
  
  // Test workspace settings
  workspaceFolder: path.resolve(__dirname, './test-workspace'),
  
  // Timeout settings
  timeout: 30000, // 30 seconds timeout for tests
}
