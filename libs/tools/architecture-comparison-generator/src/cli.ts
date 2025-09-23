#!/usr/bin/env node

/**
 * CLI Wrapper for Architecture Comparison Generator
 * 
 * This is a simplified CLI interface that can be called from Cursor commands
 */

import { ArchitectureComparisonGenerator } from './index.js';

// Parse command line arguments
const args = process.argv.slice(2);
const packageGroup = args[0];

if (!packageGroup) {
    console.log(`
🏗️  Architecture Comparison Generator

Usage: /Generate-Architecture-Comparison <package-group> [options]

Package Groups:
  all-core     - All core packages (packages/*/core)
  all-ext      - All extension packages (packages/*/ext)  
  all-libs     - All library packages (libs/*)
  all-tools    - All tool packages (libs/tools/*)
  all-shared   - All shared packages (libs/shared)
  all-packages - All packages in the workspace
  custom:<pattern> - Custom package pattern (e.g., custom:packages/ghost-writer/*)

Options:
  --dimensions <count> - Number of architectural dimensions (default: 12)
  --output <path>      - Custom output path (default: docs/analysis/)
  --no-dpc            - Skip DPC analysis
  --format <format>   - Output format: markdown, json, html (default: markdown)

Examples:
  /Generate-Architecture-Comparison all-core
  /Generate-Architecture-Comparison all-libs --dimensions 8
  /Generate-Architecture-Comparison custom:packages/ghost-writer/* --output docs/ghost-writer/
  /Generate-Architecture-Comparison all-packages --format json
`);
    process.exit(1);
}

// Parse options
const options = {
    packageGroup,
    dimensions: 12,
    output: 'docs/analysis/',
    includeDpc: true,
    format: 'markdown' as const
};

// Parse additional arguments
for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--dimensions=')) {
        options.dimensions = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--output=')) {
        options.output = arg.split('=')[1];
    } else if (arg === '--no-dpc') {
        options.includeDpc = false;
    } else if (arg.startsWith('--format=')) {
        options.format = arg.split('=')[1] as 'markdown' | 'json' | 'html';
    }
}

// Run the generator
async function main() {
    try {
        console.log(`🚀 Starting architecture comparison generation...`);
        console.log(`📦 Package Group: ${packageGroup}`);
        console.log(`📊 Dimensions: ${options.dimensions}`);
        console.log(`📁 Output: ${options.output}`);
        console.log(`🔬 DPC Analysis: ${options.includeDpc ? 'Enabled' : 'Disabled'}`);
        console.log(`📄 Format: ${options.format}`);
        console.log('');

        const generator = new ArchitectureComparisonGenerator(options);
        await generator.generate();
        
        console.log('');
        console.log('🎉 Architecture comparison generation completed successfully!');
        console.log(`📂 Check the output directory: ${options.output}`);
        
    } catch (error) {
        console.error('❌ Error generating architecture comparison:', error.message);
        console.error('');
        console.error('💡 Troubleshooting tips:');
        console.error('   - Ensure you are in the workspace root directory');
        console.error('   - Check that the package group pattern is correct');
        console.error('   - Verify that packages exist and have valid package.json files');
        console.error('   - Make sure you have the required permissions to write to the output directory');
        process.exit(1);
    }
}

main();
