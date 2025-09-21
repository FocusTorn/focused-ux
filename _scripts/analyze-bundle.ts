#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = new URL('.', import.meta.url).pathname;

interface AnalysisOptions {
  projectName?: string;
  outputDir?: string;
  open?: boolean;
  metadataFile?: string;
}

function getProjectNames(): string[] {
  const packagesDir = join(process.cwd(), 'packages');
  const libsDir = join(process.cwd(), 'libs');
  
  const projects: string[] = [];
  
  // Get packages
  if (existsSync(packagesDir)) {
    const packageDirs = readdirSync(packagesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const pkgDir of packageDirs) {
      const pkgPath = join(packagesDir, pkgDir);
      const subDirs = readdirSync(pkgPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      for (const subDir of subDirs) {
        projects.push(`${pkgDir}-${subDir}`);
      }
    }
  }
  
  // Get libs
  if (existsSync(libsDir)) {
    const libDirs = readdirSync(libsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    projects.push(...libDirs);
  }
  
  return projects.sort();
}

function findMetadataFile(projectName: string): string | null {
  // Try different possible locations for metadata file
  const possiblePaths = [
    join(process.cwd(), 'packages', ...projectName.split('-'), 'dist', 'meta.json'),
    join(process.cwd(), 'libs', projectName, 'dist', 'meta.json'),
    join(process.cwd(), 'dist', projectName, 'meta.json'),
  ];
  
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path;
    }
  }
  
  return null;
}

function analyzeBundle(options: AnalysisOptions): void {
  const { projectName, outputDir = 'bundle-analysis', open = false, metadataFile } = options;
  
  if (!projectName && !metadataFile) {
    console.error('❌ Error: Please provide either --project <projectName> or --metadata <path>');
    console.log('\nAvailable projects:');
    const projects = getProjectNames();
    projects.forEach(project => console.log(`  - ${project}`));
    process.exit(1);
  }
  
  let metadataPath = metadataFile;
  
  if (projectName && !metadataPath) {
    metadataPath = findMetadataFile(projectName);
    
    if (!metadataPath) {
      console.error(`❌ Error: Could not find metadata file for project "${projectName}"`);
      console.log('\nMake sure the project has been built with esbuild and metadata generation enabled.');
      console.log('Try running: nx build <projectName>');
      process.exit(1);
    }
  }
  
  if (!metadataPath) {
    console.error('❌ Error: No metadata file found');
    process.exit(1);
  }
  
  if (!existsSync(metadataPath)) {
    console.error(`❌ Error: Metadata file not found: ${metadataPath}`);
    process.exit(1);
  }
  
  // Create output directory
  const outputPath = join(process.cwd(), outputDir);
  if (!existsSync(outputPath)) {
    try {
      execSync(`mkdir -p "${outputPath}"`, { stdio: 'inherit' });
    } catch (error) {
      console.error(`❌ Error creating output directory: ${outputPath}`);
      process.exit(1);
    }
  }
  
  // Generate analysis filename
  const projectNameForFile = projectName || 'unknown';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const analysisFile = join(outputPath, `${projectNameForFile}-bundle-analysis-${timestamp}.html`);
  
  console.log(`🔍 Analyzing bundle for: ${projectName || 'custom metadata'}`);
  console.log(`📁 Metadata file: ${metadataPath}`);
  console.log(`📊 Output file: ${analysisFile}`);
  
  try {
    // Run esbuild-visualizer
    const command = `npx esbuild-visualizer --metadata "${metadataPath}" --filename "${analysisFile}"`;
    console.log(`\n🚀 Running: ${command}\n`);
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log(`\n✅ Bundle analysis complete!`);
    console.log(`📊 Analysis saved to: ${analysisFile}`);
    
    if (open) {
      console.log(`🌐 Opening analysis in browser...`);
      try {
        execSync(`start "${analysisFile}"`, { stdio: 'inherit' });
      } catch (error) {
        console.log(`⚠️  Could not open browser automatically. Please open the file manually.`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error running esbuild-visualizer:`, error);
    process.exit(1);
  }
}

function parseArgs(): AnalysisOptions {
  const args = process.argv.slice(2);
  const options: AnalysisOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--project':
      case '-p':
        options.projectName = args[++i];
        break;
      case '--metadata':
      case '-m':
        options.metadataFile = args[++i];
        break;
      case '--output':
      case '-o':
        options.outputDir = args[++i];
        break;
      case '--open':
        options.open = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
      default:
        if (!arg.startsWith('-')) {
          // Treat as project name if no --project flag was used
          if (!options.projectName && !options.metadataFile) {
            options.projectName = arg;
          }
        }
    }
  }
  
  return options;
}

function showHelp(): void {
  console.log(`
🔍 Bundle Analysis Tool

Usage:
  pnpm analyze [options]
  pnpm analyze <projectName> [options]
  pnpm analyze:project <projectName> [options]

Options:
  --project, -p <name>     Project name to analyze
  --metadata, -m <path>    Path to metadata file (alternative to --project)
  --output, -o <dir>       Output directory (default: bundle-analysis)
  --open                   Open analysis in browser after generation
  --help, -h               Show this help message

Examples:
  pnpm analyze --project ghost-writer-core
  pnpm analyze ghost-writer-core --open
  pnpm analyze --metadata ./packages/ghost-writer/core/dist/meta.json
  pnpm analyze:project note-hub-ext --output ./analysis-reports

Available projects:
${getProjectNames().map(project => `  - ${project}`).join('\n')}
`);
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs();
  analyzeBundle(options);
} 