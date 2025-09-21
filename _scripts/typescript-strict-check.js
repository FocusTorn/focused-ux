#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * TypeScript Strict Checker Script
 * Performs strict type checking on specified file patterns without requiring a tsconfig file
 */

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node typescript-strict-check.js <file-pattern> [additional-patterns...]');
    console.error('Example: node typescript-strict-check.js "packages/ghost-writer/core/**/*.ts"');
    process.exit(1);
  }

  // Base TypeScript compiler options for strict checking
  const baseOptions = [
    '--noEmit',
    '--strict',
    '--target', 'es2022',
    '--moduleResolution', 'node',
    '--esModuleInterop',
    '--allowSyntheticDefaultImports',
    '--skipLibCheck',
    '--forceConsistentCasingInFileNames',
    '--noImplicitAny',
    '--noImplicitReturns',
    '--noImplicitThis',
    '--noUnusedLocals',
    '--noUnusedParameters',
    '--exactOptionalPropertyTypes'
  ];

  // Add include patterns for each argument
  const includeOptions = args.flatMap(pattern => ['--include', pattern]);

  const command = ['tsc', ...baseOptions, ...includeOptions].join(' ');

  console.log(`Running: ${command}`);
  console.log('');

  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('\n✅ Type checking passed!');
  } catch (error) {
    console.log('\n❌ Type checking failed!');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
