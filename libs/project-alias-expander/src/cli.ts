#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import stripJsonComments from 'strip-json-comments'

const __filename = fileURLToPath(import.meta.url)
// When built, the CLI is in dist/cli.js, so we need to go up one level to reach the package root
const PACKAGE_ROOT = path.resolve(path.dirname(__filename), '..')

type TargetsMap = Record<string, string>

type AliasValue = string | { name: string, suffix?: 'core' | 'ext', full?: boolean }

type FeatureTarget = {
    'run-from': 'core' | 'ext'
    'run-target': string
}

interface AliasConfig {
    'package-targets'?: TargetsMap
    'feature-targets'?: Record<string, FeatureTarget>
    'not-nx-targets'?: Record<string, string>
    'expandables'?: Record<string, string>
    'packages': Record<string, AliasValue>
}

function loadAliasConfig(): AliasConfig {
    // The config.json is in the package root directory
    const configPath = path.join(PACKAGE_ROOT, 'config.json')
    
    if (!fs.existsSync(configPath)) {
        console.error(`Config file not found at: ${configPath}`)
        process.exit(1)
    }
    
    const raw = fs.readFileSync(configPath, 'utf-8')

    return JSON.parse(stripJsonComments(raw))
}

function resolveProjectForAlias(value: AliasValue): { project: string, full: boolean } {
    if (typeof value === 'string') {
        const proj = value.startsWith('@fux/') ? value : `@fux/${value}`

        return { project: proj, full: false }
    }

    const pkg = value.name
    const project = value.suffix ? `@fux/${pkg}-${value.suffix}` : `@fux/${pkg}`

    return { project, full: value.full === true }
}

function resolveProjectForAliasWithTarget(value: AliasValue, target: string): { project: string, full: boolean } {
    // Special handling for integration tests: automatically target ext packages
    if (target === 'test:integration' && typeof value === 'object' && value.name) {
        const project = `@fux/${value.name}-ext`

        return { project, full: value.full === true }
    }

    return resolveProjectForAlias(value)
}

function resolveProjectForFeatureTarget(value: AliasValue, featureTarget: FeatureTarget): { project: string, full: boolean } {
    if (typeof value === 'string') {
        // For string values, we can't determine the feature target
        return resolveProjectForAlias(value)
    }

    const project = `@fux/${value.name}-${featureTarget['run-from']}`
    return { project, full: value.full === true }
}

function expandTargetShortcuts(args: string[], targets: TargetsMap, featureTargets?: Record<string, FeatureTarget>, isFull?: boolean): { args: string[], wasFeatureTarget: boolean } {
    if (args.length === 0)
        return { args, wasFeatureTarget: false }

    const t0 = args[0].toLowerCase()

    // Check feature-targets first if this is a full package
    if (isFull && featureTargets && featureTargets[t0]) {
        const featureTarget = featureTargets[t0]
        return { args: [featureTarget['run-target'], ...args.slice(1)], wasFeatureTarget: true }
    }

    // Fall back to regular package-targets
    if (targets[t0]) {
        const expandedTokens = targets[t0]
            .split(' ')
            .map(t =>
                t.trim())
            .filter(t =>
                t.length > 0)

        return { args: [...expandedTokens, ...args.slice(1)], wasFeatureTarget: false }
    }
    return { args, wasFeatureTarget: false }
}

function expandFlags(args: string[], expandables: Record<string, string> = {}): string[] {
    const expanded: string[] = []

    for (const a of args) {
        if (a.startsWith('--')) {
            expanded.push(a)
            continue
        }
        if (a.startsWith('-') && a.length > 1) {
            const token = a.slice(1)

            // exact multi-key mapping: e.g., -stream
            if (expandables[token]) {
                expanded.push(`--${expandables[token]}`)
                continue
            }

            // split short bundle like -fs or -sf
            const shorts = token.split('')

            for (const s of shorts) {
                const mapped = expandables[s]

                if (mapped)
                    expanded.push(`--${mapped}`)
                else expanded.push(`-${s}`)
            }
            continue
        }
        expanded.push(a)
    }
    return expanded
}

function normalizeFullSemantics(isFull: boolean, target: string): string {
    if (!isFull)
        return target

    const map: Record<string, string> = {
        l: 'lint:deps',
        lint: 'lint:deps',
        test: 'test:full',
        validate: 'validate:deps',
    }

    return map[target] ?? target
}

function runNx(argv: string[]): number {
    if (process.env.PAE_ECHO === '1') {
        console.log(`NX_CALL -> ${argv.join(' ')}`)
        return 0
    }

    const res = spawnSync('nx', argv, { stdio: 'inherit', shell: process.platform === 'win32' })

    return res.status ?? 1
}

function runCommand(command: string, args: string[]): number {
    if (process.env.PAE_ECHO === '1') {
        console.log(`COMMAND_CALL -> ${command} ${args.join(' ')}`)
        return 0
    }

    const res = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })

    return res.status ?? 1
}

function runMany(runType: 'ext' | 'core' | 'all', targets: string[], flags: string[], config: AliasConfig): number {
    const projects: string[] = []
    const suffix = runType === 'all' ? null : `-${runType}`

    for (const key of Object.keys(config.packages)) {
        const v = config.packages[key]
        const { project } = resolveProjectForAlias(v)

        if (runType === 'all') {
            projects.push(project)
        }
        else if (project.endsWith(suffix!)) {
            projects.push(project)
        }
    }
    
    if (projects.length === 0) {
        console.error(`No projects found for '${runType}'.`)
        return 1
    }

    const par = String(projects.length)
    const target = targets[0]

    // Auto-inject --output-style=stream for test:full, validate:deps, and lint:deps targets
    let enhancedFlags = [...flags]

    if ((target === 'test:full' || target === 'validate:deps' || target === 'lint:deps')
	  && !enhancedFlags.some(flag =>
	      flag === '--stream' || flag === '--output-style=stream' || flag.startsWith('--output='))) {
        enhancedFlags = ['--output-style=stream', ...enhancedFlags]
    }

    // Auto-inject --parallel=false for validate:deps to get cleaner sequential output
    if (target === 'validate:deps' && !enhancedFlags.some(flag =>
        flag === '--parallel=false' || flag === '--parallel=true')) {
        enhancedFlags = ['--parallel=false', ...enhancedFlags]
    }

    return runNx(['run-many', `--target=${target}`, `--projects=${projects.join(',')}`, `--parallel=${par}`, ...enhancedFlags, ...targets.slice(1)])
}

function installAliases() {
    const config = loadAliasConfig()
    const aliases = Object.keys(config.packages)
    const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v')
	
    if (isVerbose) {
        console.log('Generating PowerShell module...')
        console.log(`Found ${aliases.length} aliases: ${aliases.join(', ')}`)
    }
	
    // Generate PowerShell module content
    const moduleContent = `# PAE Global Aliases - Auto-generated PowerShell Module
# Generated from config.json - DO NOT EDIT MANUALLY

function Invoke-PaeAlias {
    param([Parameter(Mandatory = $true)][string]$Alias, [string[]]$Arguments = @())
    
    # Find workspace root by looking for nx.json
    $workspaceRoot = $PWD
    while ($workspaceRoot -and -not (Test-Path (Join-Path $workspaceRoot "nx.json"))) {
        $workspaceRoot = Split-Path $workspaceRoot -Parent
    }
    
    if (-not $workspaceRoot) {
        Write-Error "Could not find workspace root (nx.json not found)"
        return 1
    }
    
    $cliPath = Join-Path $workspaceRoot "libs/project-alias-expander/dist/cli.js"
    if (-not (Test-Path $cliPath)) {
        Write-Error "PAE CLI not found at: $cliPath"
        return 1
    }
    
    node $cliPath $Alias @Arguments
}

${aliases.map(alias =>
    `function ${alias} { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaeAlias -Alias '${alias}' -Arguments $Arguments 
}`).join('\n\n')}

# Export all functions
Export-ModuleMember -Function ${aliases.join(', ')}

# Display startup message when module is loaded
Write-Host -ForegroundColor DarkGreen "  - Module loaded: PAE aliases "
`
	
    // Write the module to the dist directory
    const modulePath = path.join(PACKAGE_ROOT, 'dist', 'pae-functions.psm1')
	
    // Ensure dist directory exists
    const distDir = path.dirname(modulePath)

    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true })
    }
	
    fs.writeFileSync(modulePath, moduleContent)
	
    // Display yellow warning about shell restart
    console.log('\n\x1b[33m⚠️  IMPORTANT: Restart your shell to apply PAE alias changes!\x1b[0m')
    console.log('\x1b[90m   The PowerShell module has been updated. You need to restart your shell\x1b[0m')
    console.log('\x1b[90m   or reload the module to use the updated aliases.\x1b[0m\n')
	
    if (isVerbose) {
        console.log(`PowerShell module generated: ${modulePath}`)
        console.log('Import the module in your PowerShell profile with:')
        console.log('Import-Module libs/project-alias-expander/dist/pae-functions.psm1')
    }
}

function main() {
    const [, , ...args] = process.argv
    const previousEcho = process.env.PAE_ECHO
    
    // Handle special commands
    if (args.length > 0 && args[0] === 'install-aliases') {
        installAliases()
        return
    }
    
    // Handle both direct execution (pbc b) and pae-prefixed execution (pae pbc b)
    let alias: string
    let rest: string[]
    
    // Check if this is being called as 'pae' command (bin execution)
    const isPaeCommand = process.argv[1]?.endsWith('pae') || process.argv[1]?.includes('pae')
    
    if (isPaeCommand && args.length > 0) {
        // Called as: pae pbc b
        alias = args[0]
        rest = args.slice(1)
    }
    else {
        // Called as: pbc b (direct execution)
        alias = args[0]
        rest = args.slice(1)
    }

    if (!alias || alias === '-h' || alias === '--help' || alias === 'help') {
        const config = loadAliasConfig()
        const targets = config['package-targets'] ?? { b: 'build', l: 'lint', t: 'test' }
        const notNxTargets = (config as any)['not-nx-targets'] ?? {}
        const expandMap = config.expandables ?? { f: 'fix', s: 'skip-nx-cache' }
        
        console.log('pae <alias> <target> [flags]')
        console.log('')
        console.log('USAGE:')
        console.log('  <alias> <target> [flags]              # Direct execution (e.g., pbc b)')
        console.log('  pae <alias> <target> [flags]          # Pae-prefixed execution')
        console.log('  pae <package-alias> <target> [flags]  # Run target for specific package')
        console.log('  pae <ext|core|all> <target> [flags]   # Run target for all packages of type')
        console.log('')
        console.log('PACKAGE ALIASES:')

        const packages = config.packages ?? {}

        for (const [alias, value] of Object.entries(packages)) {
            const resolved = resolveProjectForAlias(value as AliasValue)

            console.log(`  ${alias.padEnd(8)} -> ${resolved.project}`)
        }
        console.log('')
        console.log('PACKAGE TARGETS:')
        for (const [short, target] of Object.entries(targets)) {
            console.log(`  ${short.padEnd(8)} -> ${target}`)
        }
        console.log('')
        if (config['feature-targets']) {
            console.log('FEATURE TARGETS (for full packages):')
            for (const [short, featureTarget] of Object.entries(config['feature-targets'])) {
                console.log(`  ${short.padEnd(8)} -> ${featureTarget['run-target']} (from ${featureTarget['run-from']})`)
            }
            console.log('')
        }
        console.log('NOT-NX TARGETS:')
        for (const [short, command] of Object.entries(notNxTargets)) {
            console.log(`  ${short.padEnd(8)} -> ${command}`)
        }
        console.log('')
        console.log('FLAG EXPANSIONS:')
        for (const [short, flag] of Object.entries(expandMap)) {
            console.log(`  -${short.padEnd(7)} -> --${flag}`)
        }
        console.log('')
        console.log('EXAMPLES:')
        console.log('  # Direct execution (PowerShell functions):')
        console.log('  pbc test --coverage')
        console.log('  pbc b -f -s')
        console.log('  pbc esv')
        console.log('  pae t -echo')
        console.log('')
        console.log('  # Global executor:')
        console.log('  pae pbc test --coverage')
        console.log('  pae ext build')
        console.log('  pae pbc esv')
        console.log('  pae pbc -f -s')
        console.log('  pae install-aliases --verbose')
        process.exit(0)
    }

    const config = loadAliasConfig()
    const targets = config['package-targets'] ?? { b: 'build', l: 'lint', t: 'test' }
    const featureTargets = config['feature-targets']
    const notNxTargets = (config as any)['not-nx-targets'] ?? {}
    const expandMap = config.expandables ?? { f: 'fix', s: 'skip-nx-cache' }
    
    // Get the alias value to determine if it's a full package
    const aliasVal = config.packages?.[alias]
    const isFull = typeof aliasVal === 'object' && aliasVal?.full === true
    
    const targetExpansion = expandTargetShortcuts(rest, targets, featureTargets, isFull)
    let processedArgs = targetExpansion.args
    const wasFeatureTarget = targetExpansion.wasFeatureTarget

    processedArgs = expandFlags(processedArgs, expandMap)

    // Handle ephemeral echo flag: "-echo" -> "--pae-echo"
    const paeEchoEnabled = processedArgs.includes('--pae-echo')

    // Remove control flag from downstream Nx args
    if (paeEchoEnabled) {
        processedArgs = processedArgs.filter(a =>
            a !== '--pae-echo')
    }

    if (alias === 'ext' || alias === 'core' || alias === 'all') {
        const target = processedArgs[0]
        const flags = processedArgs.filter(a =>
            a.startsWith('--'))

        const previousEcho = process.env.PAE_ECHO

        if (paeEchoEnabled) {
            process.env.PAE_ECHO = '1'
        }

        const code = runMany(alias as any, [target], flags, config)

        // Restore echo environment
        if (paeEchoEnabled) {
            if (previousEcho === undefined) {
                delete process.env.PAE_ECHO
            }
            else {
                process.env.PAE_ECHO = previousEcho
            }
        }

        process.exit(code)
    }

    if (!aliasVal) {
        console.error(`Alias '${alias}' is not defined.`)
        process.exit(1)
    }

    // Check args length before removing --pae-echo flag
    if (processedArgs.length === 0) {
        console.error(`Please provide a command for '${alias}'.`)
        process.exit(1)
    }

    const target = processedArgs[0]
    
    // Check if this is a feature target for a full package
    let project: string
    let full: boolean
    
    if (wasFeatureTarget) {
        // For feature targets, we need to resolve the project based on the original target
        const originalTarget = rest[0] // The original target before expansion
        const featureTarget = featureTargets![originalTarget]
        const resolved = resolveProjectForFeatureTarget(aliasVal, featureTarget)
        project = resolved.project
        full = resolved.full
    } else {
        // Use target-aware resolution for integration tests
        const resolved = resolveProjectForAliasWithTarget(aliasVal, target)
        project = resolved.project
        full = resolved.full
    }

    // Now check if the target is a not-nx-target (workspace-level command)
    const notNxTarget = notNxTargets[target]
    
    if (notNxTarget) {
        // For not-nx-targets, we run the workspace-level command with the project name
        const additionalArgs = processedArgs.slice(1)
        
        if (paeEchoEnabled) {
            process.env.PAE_ECHO = '1'
        }
        
        // Parse the command (e.g., "npx esbuild-visualizer --metadata")
        const commandParts = notNxTarget.split(' ')
        const command = commandParts[0]
        let commandArgs = [...commandParts.slice(1)]
        
        // Special handling for esbuild-visualizer
        if (notNxTarget.includes('esbuild-visualizer')) {
            // Convert project name to metadata file path
            const projectParts = project.replace('@fux/', '').split('-')
            const packageName = projectParts.slice(0, -1).join('-')
            const suffix = projectParts[projectParts.length - 1]
            const metadataPath = `packages/${packageName}/${suffix}/dist/meta.json`
            
            commandArgs = [...commandArgs, metadataPath, ...additionalArgs]
        }
        else {
            commandArgs = [...commandArgs, project, ...additionalArgs]
        }
        
        // Run the command directly
        const rc = runCommand(command, commandArgs)
        
        // Restore echo environment
        if (paeEchoEnabled) {
            if (previousEcho === undefined) {
                delete process.env.PAE_ECHO
            }
            else {
                process.env.PAE_ECHO = previousEcho
            }
        }
        
        if (rc !== 0)
            process.exit(rc)
        return
    }

    // Handle feature targets differently - pass run-target directly to nx
    if (wasFeatureTarget) {
        const originalTarget = rest[0] // The original target before expansion
        const featureTarget = featureTargets![originalTarget]
        const runTarget = featureTarget['run-target']
        
        // Parse the run-target to separate target from flags
        const runTargetParts = runTarget.split(' ')
        const targetName = runTargetParts[0]
        const targetFlags = runTargetParts.slice(1)
        
        // Combine target flags with any additional args from the command
        const allArgs = [...targetFlags, ...processedArgs.slice(1)]
        
        const rc = runNx([targetName, project, ...allArgs])
        
        // Restore echo environment
        if (paeEchoEnabled) {
            if (previousEcho === undefined) {
                delete process.env.PAE_ECHO
            }
            else {
                process.env.PAE_ECHO = previousEcho
            }
        }
        
        process.exit(rc)
    }

    // For regular Nx targets, continue with normal processing
    processedArgs[0] = normalizeFullSemantics(full, processedArgs[0])

    const normalizedTarget = processedArgs[0]

    // Ensure visible logs by default
    const flagArgs = processedArgs.filter(a =>
        a.startsWith('--'))
    const restArgs = processedArgs.slice(1).filter(a =>
        !a.startsWith('--'))

    // Auto-inject --output-style=stream for test:full, validate:deps, and lint:deps targets
    let enhancedArgs = [...flagArgs]

    if ((normalizedTarget === 'test:full' || normalizedTarget === 'validate:deps' || normalizedTarget === 'lint:deps')
	  && !enhancedArgs.some(arg =>
	      arg === '--stream' || arg === '--output-style=stream' || arg.startsWith('--output='))) {
        enhancedArgs = ['--output-style=stream', ...enhancedArgs]
    }

    // Auto-inject --parallel=false for validate:deps to get cleaner sequential output
    if (normalizedTarget === 'validate:deps' && !enhancedArgs.some(arg =>
        arg === '--parallel=false' || arg === '--parallel=true')) {
        enhancedArgs = ['--parallel=false', ...enhancedArgs]
    }

    // Default single invocation
    if (paeEchoEnabled) {
        process.env.PAE_ECHO = '1'
    }

    const rc = runNx([normalizedTarget, project, ...enhancedArgs, ...restArgs])

    // Restore echo environment
    if (paeEchoEnabled) {
        if (previousEcho === undefined) {
            delete process.env.PAE_ECHO
        }
        else {
            process.env.PAE_ECHO = previousEcho
        }
    }

    if (rc !== 0)
        process.exit(rc)
}

main()

// Test comment in source code
// Test comment in source code again ascf
// Test comment for @nx/js:node exsadgsdgecutor
