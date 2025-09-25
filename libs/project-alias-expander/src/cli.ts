#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { spawnSync, execSync } from 'node:child_process'
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

type ExpandableValue = string | {
    position?: 'prefix' | 'pre-args' | 'suffix'
    defaults?: Record<string, string>
    template: string
}

interface AliasConfig {
    'package-targets'?: TargetsMap
    'feature-targets'?: Record<string, FeatureTarget>
    'not-nx-targets'?: Record<string, string>
    'expandables'?: Record<string, ExpandableValue>
    'packages': Record<string, AliasValue>
}

function loadAliasConfig(): AliasConfig {
    // The config.json is in the package root directory
    const configPath = path.join(PACKAGE_ROOT, 'config.json')
    
    if (process.argv.includes('--debug-workspace')) {
        console.log('DEBUG: configPath:', configPath)
        console.log('DEBUG: config exists:', fs.existsSync(configPath))
    }
    
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

function expandTemplate(template: string, variables: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (match, varName) => {
        return variables[varName] || match
    })
}

function parseExpandableFlag(flag: string): { key: string, value?: string } {
    // Handle both -key=value and -key:value syntax
    const equalMatch = flag.match(/^-([^=]+)=(.*)$/)

    if (equalMatch) {
        return { key: equalMatch[1], value: equalMatch[2] }
    }
    
    const colonMatch = flag.match(/^-([^:]+):(.*)$/)

    if (colonMatch) {
        return { key: colonMatch[1], value: colonMatch[2] }
    }
    
    // No value provided
    return { key: flag.slice(1) }
}

function expandFlags(args: string[], expandables: Record<string, ExpandableValue> = {}): {
    prefix: string[],
    preArgs: string[],
    suffix: string[],
    remainingArgs: string[]
} {
    const prefix: string[] = []
    const preArgs: string[] = []
    const suffix: string[] = []
    const remainingArgs: string[] = []

    for (const arg of args) {
        if (arg.startsWith('--')) {
            remainingArgs.push(arg)
            continue
        }
        
        if (arg.startsWith('-') && arg.length > 1) {
            const { key, value } = parseExpandableFlag(arg)
            
            // Check if this is an expandable
            if (expandables[key]) {
                const expandable = expandables[key]
                
                if (typeof expandable === 'string') {
                    // Simple string expansion - default to suffix position
                    suffix.push(expandable)
                } else {
                    // Template-based expansion
                    const variables = { ...expandable.defaults }

                    if (value !== undefined) {
                        // Use the provided value for the first variable in defaults
                        const firstVar = Object.keys(expandable.defaults || {})[0]

                        if (firstVar) {
                            variables[firstVar] = value
                        }
                    }
                    
                    const expanded = expandTemplate(expandable.template, variables)
                    const position = expandable.position || 'suffix'
                    
                    switch (position) {
                        case 'prefix':
                            prefix.push(expanded)
                            break
                        case 'pre-args':
                            preArgs.push(expanded)
                            break
                        case 'suffix':
                        default:
                            suffix.push(expanded)
                            break
                    }
                }
                continue
            }
            
            // Handle short bundle flags like -fs or -sf
            const shorts = key.split('')
            let hasExpandable = false
            
            for (const s of shorts) {
                if (expandables[s]) {
                    hasExpandable = true

                    const expandable = expandables[s]
                    
                    if (typeof expandable === 'string') {
                        suffix.push(expandable)
                    } else {
                        const expanded = expandTemplate(expandable.template, expandable.defaults || {})
                        const position = expandable.position || 'suffix'
                        
                        switch (position) {
                            case 'prefix':
                                prefix.push(expanded)
                                break
                            case 'pre-args':
                                preArgs.push(expanded)
                                break
                            case 'suffix':
                            default:
                                suffix.push(expanded)
                                break
                        }
                    }
                } else {
                    remainingArgs.push(`-${s}`)
                }
            }
            
            if (!hasExpandable) {
                remainingArgs.push(arg)
            }
            continue
        }
        
        remainingArgs.push(arg)
    }
    
    return { prefix, preArgs, suffix, remainingArgs }
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

    const res = spawnSync('nx', argv, {
        stdio: 'inherit',
        shell: process.platform === 'win32',
        timeout: 300000, // 5 minute timeout
        killSignal: 'SIGTERM'
    })

    return res.status ?? 1
}

function runCommand(command: string, args: string[]): number {
    if (process.env.PAE_ECHO === '1') {
        console.log(`COMMAND_CALL -> ${command} ${args.join(' ')}`)
        return 0
    }

    const res = spawnSync(command, args, {
        stdio: 'inherit',
        shell: process.platform === 'win32',
        timeout: 300000, // 5 minute timeout
        killSignal: 'SIGTERM'
    })

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

function detectShell(): 'powershell' | 'gitbash' | 'unknown' {
    // Check for PowerShell first (more specific indicators)
    if (process.env.PSModulePath
        || process.env.POWERSHELL_DISTRIBUTION_CHANNEL
        || process.env.PSExecutionPolicyPreference
        || process.env.PSExecutionPolicyPreference
        || (process.env.TERM_PROGRAM === 'vscode' && process.env.PSModulePath)) {
        return 'powershell'
    }
    
    // Check for Git Bash/WSL (more specific)
    if (process.env.MSYS_ROOT
        || process.env.MINGW_ROOT
        || process.env.WSL_DISTRO_NAME
        || process.env.WSLENV
        || process.env.SHELL?.includes('bash')
        || process.env.SHELL?.includes('git-bash')
        || process.env.SHELL?.includes('bash.exe')) {
        return 'gitbash'
    }
    
    return 'unknown'
}

function generateLocalFiles() {
    const config = loadAliasConfig()
    const aliases = Object.keys(config.packages)
    const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v')
    const shell = detectShell()
	
    if (isVerbose) {
        console.log(`Detected shell: ${shell}`)
        console.log(`Found ${aliases.length} aliases: ${aliases.join(', ')}`)
        console.log('Generating local files only (build process)')
    }
	
    // Generate PowerShell module content - Simple approach
    const moduleContent = `# PAE Global Aliases - Auto-generated PowerShell Module
# Generated from config.json - DO NOT EDIT MANUALLY
# Simple approach: each alias just calls 'pae <alias> <args>'

${aliases.map(alias =>
    `function Invoke-${alias} { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    pae ${alias} @Arguments
}

# Alias for backward compatibility
Set-Alias -Name ${alias} -Value Invoke-${alias}`).join('\n\n')}

# Refresh function to reload aliases
function Invoke-PaeRefresh {
    Write-Host "Refreshing [PWSH] PAE aliases..." -ForegroundColor Yellow
    
    # Find workspace root by looking for nx.json
    $workspaceRoot = $PWD
    while ($workspaceRoot -and -not (Test-Path (Join-Path $workspaceRoot "nx.json"))) {
        $workspaceRoot = Split-Path $workspaceRoot -Parent
    }
    
    if (-not $workspaceRoot) {
        Write-Error "Could not find workspace root (nx.json not found)"
        return 1
    }
    
    $modulePath = Join-Path $workspaceRoot "libs\\project-alias-expander\\dist\\pae-functions.psm1"
    Import-Module $modulePath -Force
    Write-Host "[PWSH] PAE aliases refreshed!" -ForegroundColor Green
}

# Alias for backward compatibility
Set-Alias -Name pae-refresh -Value Invoke-PaeRefresh

# Export all functions and aliases
Export-ModuleMember -Function ${aliases.map(alias => `Invoke-${alias}`).join(', ')}, Invoke-PaeRefresh
Export-ModuleMember -Alias ${aliases.join(', ')}, pae-refresh

# Display startup message when module is loaded
Write-Host -ForegroundColor DarkGreen "  - Module loaded: [PWSH] PAE aliases (simple)"
`
	
    // Generate Git Bash aliases content - Simple approach
    const bashAliasesContent = `# PAE Global Aliases - Auto-generated Git Bash Aliases
# Generated from config.json - DO NOT EDIT MANUALLY
# Simple approach: each alias just calls 'pae <alias> <args>'

# Prevent double-loading
if [ -n "$PAE_ALIASES_LOADED" ]; then
    return 0
fi
export PAE_ALIASES_LOADED=1

${aliases.map(alias => `alias ${alias}='pae ${alias}'`).join('\n')}

# Refresh function
function pae-refresh {
    echo "Refreshing [GitBash] PAE aliases..."
    unset PAE_ALIASES_LOADED
    source libs/project-alias-expander/dist/pae-aliases.sh
    echo "[GitBash] PAE aliases refreshed!"
}

# Display startup message
echo -e "\x1b[32m  - Aliases loaded: [GitBash] PAE aliases (simple)\x1b[0m"
`
	
    // Write files to the dist directory
    const distDir = path.join(PACKAGE_ROOT, 'dist')

    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true })
    }
    
    // Always generate PowerShell module
    const modulePath = path.join(distDir, 'pae-functions.psm1')

    fs.writeFileSync(modulePath, moduleContent)
    
    // Generate Git Bash aliases
    const bashAliasesPath = path.join(distDir, 'pae-aliases.sh')

    fs.writeFileSync(bashAliasesPath, bashAliasesContent)
    
    if (isVerbose) {
        console.log(`PowerShell module generated: ${modulePath}`)
        console.log(`Git Bash aliases generated: ${bashAliasesPath}`)
        console.log(`Detected shell: ${shell}`)
    }
    
    console.log('\x1b[32m✅ Local files generated successfully!\x1b[0m')
    console.log('')
    console.log('\x1b[33m⚠️  Run "pae install-aliases" to install to system locations\x1b[0m')
}

function installAliases() {
    // Prevent multiple installations during the same process
    if (process.env.PAE_INSTALLING === '1') {
        return
    }
    process.env.PAE_INSTALLING = '1'
    
    const config = loadAliasConfig()
    const aliases = Object.keys(config.packages)
    const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v')
    const autoRefresh = process.argv.includes('--auto-refresh')
    const shell = detectShell()
	
    if (isVerbose) {
        console.log(`Detected shell: ${shell}`)
        console.log(`Found ${aliases.length} aliases: ${aliases.join(', ')}`)
        if (autoRefresh) {
            console.log('Auto-refresh enabled')
        }
    }
	
    // Generate PowerShell module content - Simple approach
    const moduleContent = `# PAE Global Aliases - Auto-generated PowerShell Module
# Generated from config.json - DO NOT EDIT MANUALLY
# Simple approach: each alias just calls 'pae <alias> <args>'

${aliases.map(alias =>
    `function Invoke-${alias} { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    pae ${alias} @Arguments
}

# Alias for backward compatibility
Set-Alias -Name ${alias} -Value Invoke-${alias}`).join('\n\n')}

# Refresh function to reload aliases
function Invoke-PaeRefresh {
    Write-Host "Refreshing [PWSH] PAE aliases..." -ForegroundColor Yellow
    
    # Find workspace root by looking for nx.json
    $workspaceRoot = $PWD
    while ($workspaceRoot -and -not (Test-Path (Join-Path $workspaceRoot "nx.json"))) {
        $workspaceRoot = Split-Path $workspaceRoot -Parent
    }
    
    if (-not $workspaceRoot) {
        Write-Error "Could not find workspace root (nx.json not found)"
        return 1
    }
    
    $modulePath = Join-Path $workspaceRoot "libs\\project-alias-expander\\dist\\pae-functions.psm1"
    Import-Module $modulePath -Force
    Write-Host "[PWSH] PAE aliases refreshed!" -ForegroundColor Green
}

# Alias for backward compatibility
Set-Alias -Name pae-refresh -Value Invoke-PaeRefresh

# Export all functions and aliases
Export-ModuleMember -Function ${aliases.map(alias => `Invoke-${alias}`).join(', ')}, Invoke-PaeRefresh
Export-ModuleMember -Alias ${aliases.join(', ')}, pae-refresh

# Display startup message when module is loaded
Write-Host -ForegroundColor DarkGreen "  - Module loaded: [PWSH] PAE aliases (simple)"
`
	
    // Generate Git Bash aliases content - Simple approach
    const bashAliasesContent = `# PAE Global Aliases - Auto-generated Git Bash Aliases
# Generated from config.json - DO NOT EDIT MANUALLY
# Simple approach: each alias just calls 'pae <alias> <args>'

# Prevent double-loading
if [ -n "$PAE_ALIASES_LOADED" ]; then
    return 0
fi
export PAE_ALIASES_LOADED=1

${aliases.map(alias => `alias ${alias}='pae ${alias}'`).join('\n')}

# Refresh function to reload aliases
function pae-refresh {
    echo "Refreshing [GitBash] PAE aliases..."
    unset PAE_ALIASES_LOADED
    source libs/project-alias-expander/dist/pae-aliases.sh
    echo "[GitBash] PAE aliases refreshed!"
}

# Display startup message
echo -e "\x1b[32m  - Aliases loaded: [GitBash] PAE aliases (simple)\x1b[0m"
`
	
    // Write files to the dist directory
    const distDir = path.join(PACKAGE_ROOT, 'dist')

    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true })
    }
    
    // Always generate PowerShell module
    const modulePath = path.join(distDir, 'pae-functions.psm1')

    fs.writeFileSync(modulePath, moduleContent)
    
    // Generate Git Bash aliases
    const bashAliasesPath = path.join(distDir, 'pae-aliases.sh')

    fs.writeFileSync(bashAliasesPath, bashAliasesContent)
    
    // Handle shell-specific auto-loading
    if (shell === 'powershell') {
        console.log('\n\x1b[32m✅ PowerShell module generated successfully!\x1b[0m\n')
        console.log('\x1b[33m⚠️  Run \x1b[1;93mpae-refresh\x1b[0;33m to reload the aliases into the current shell\x1b[0m')
    } else if (shell === 'gitbash') {
        console.log('\n\x1b[32m✅ Git Bash aliases generated successfully!\x1b[0m\n')
        console.log('\x1b[33m⚠️  Run \x1b[1;93mpae-refresh\x1b[0;33m to reload the aliases into the current shell\x1b[0m')
    } else {
        // Unknown shell - show manual instructions
        console.log('\n\x1b[33m⚠️  Shell detection failed. Manual setup required:\x1b[0m')
        console.log('\x1b[90m   PowerShell: Import-Module libs/project-alias-expander/dist/pae-functions.psm1\x1b[0m')
        console.log('\x1b[90m   Git Bash: source libs/project-alias-expander/dist/pae-aliases.sh\x1b[0m\n')
    }
	
    if (isVerbose) {
        console.log(`PowerShell module generated: ${modulePath}`)
        console.log(`Git Bash aliases generated: ${bashAliasesPath}`)
        console.log(`Detected shell: ${shell}`)
    }
    
    // Install PowerShell module to native location if on Windows
    if (process.platform === 'win32' && shell === 'powershell') {
        try {
            const psModuleDir = path.join(process.env.USERPROFILE || '', 'Documents', 'WindowsPowerShell', 'Modules', 'PAE')
            const psModulePath = path.join(psModuleDir, 'PAE.psm1')
            
            if (isVerbose) {
                console.log(`Installing PowerShell module to: ${psModulePath}`)
            }
            
            // Create module directory if it doesn't exist
            if (!fs.existsSync(psModuleDir)) {
                fs.mkdirSync(psModuleDir, { recursive: true })
                if (isVerbose) {
                    console.log(`Created module directory: ${psModuleDir}`)
                }
            }
            
            // Copy the module file
            fs.copyFileSync(modulePath, psModulePath)
            
            console.log('\x1b[32m✅ PowerShell module installed to native location!\x1b[0m')
            console.log(`\x1b[36m   Module location: ${psModulePath}\x1b[0m`)
            
            // Try to auto-refresh the module in the current session
            try {
                console.log('\x1b[33m🔄 Attempting to auto-refresh module in current session...\x1b[0m')
                
                const psCommand = 'Import-Module PAE -Force; Write-Host "Module loaded successfully!" -ForegroundColor Green'
                
                execSync(`powershell -Command "${psCommand}"`, {
                    stdio: 'inherit',
                    cwd: process.cwd(),
                    timeout: 5000
                })
                
                console.log('\x1b[32m✅ Module auto-refreshed in current session!\x1b[0m')
            } catch (error) {
                console.log('\x1b[33m⚠️  Auto-refresh failed. Manual refresh required.\x1b[0m')
                console.log('\x1b[36m   Run: pae-refresh\x1b[0m')
                console.log('\x1b[90m   Or: Import-Module PAE -Force\x1b[0m')
                if (isVerbose) {
                    console.log(`Error: ${error}`)
                }
            }
        } catch (error) {
            console.log('\x1b[33m⚠️  Failed to install PowerShell module to native location.\x1b[0m')
            if (isVerbose) {
                console.log(`Error: ${error}`)
            }
            console.log('\x1b[90m   Manual installation required:\x1b[0m')
            console.log('\x1b[90m   Import-Module libs/project-alias-expander/dist/pae-functions.psm1 -Force\x1b[0m')
        }
    }
    
    // Auto-refresh if requested
    if (autoRefresh) {
        console.log('\n\x1b[33m🔄 Auto-refreshing aliases in current session...\x1b[0m')
        try {
            if (shell === 'powershell') {
                // Try to auto-refresh PowerShell module
                try {
                    console.log('\x1b[33m🔄 Attempting to auto-refresh PowerShell module...\x1b[0m')
                    
                    // Try to execute PowerShell command to import the module
                    const psCommand = 'Import-Module PAE -Force; Write-Host "Module refreshed successfully!" -ForegroundColor Green'
                    
                    execSync(`powershell -Command "${psCommand}"`, {
                        stdio: 'inherit',
                        cwd: process.cwd(),
                        timeout: 5000
                    })
                    
                    console.log('\x1b[32m✅ PowerShell module auto-refreshed successfully!\x1b[0m')
                } catch (error) {
                    console.log('\x1b[33m⚠️  Auto-refresh failed. Manual refresh required.\x1b[0m')
                    console.log('\x1b[36m   Run: pae-refresh\x1b[0m')
                    console.log('\x1b[90m   Or: Import-Module PAE -Force\x1b[0m')
                    if (isVerbose) {
                        console.log(`Error: ${error}`)
                    }
                }
            } else if (shell === 'gitbash') {
                // For Git Bash, source the aliases and then run pae-refresh
                try {
                    const aliasFile = path.resolve(bashAliasesPath).replace(/\\/g, '/')

                    execSync(`bash -c "source '${aliasFile}' && pae-refresh"`, {
                        stdio: 'inherit',
                        cwd: process.cwd(),
                        timeout: 5000
                    })
                    console.log('\x1b[32m✅ Git Bash aliases refreshed successfully!\x1b[0m')
                } catch (_error) {
                    console.log('\x1b[33m⚠️  Auto-refresh failed. Manual refresh required.\x1b[0m')
                    console.log('\x1b[36m   Run: pae-refresh\x1b[0m')
                    console.log('\x1b[90m   Or: source libs/project-alias-expander/dist/pae-aliases.sh\x1b[0m')
                }
            } else {
                console.log('\x1b[33m⚠️  Unknown shell - manual refresh required.\x1b[0m')
            }
        } catch (error) {
            console.log('\x1b[31m❌ Auto-refresh failed. Manual refresh required.\x1b[0m')
            if (isVerbose) {
                console.log(`Error: ${error}`)
            }
        }
    }
}

function refreshAliases() {
    const shell = detectShell()
    const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v')
    
    if (isVerbose) {
        console.log(`Refreshing aliases for detected shell: ${shell}`)
    }
    
    // Regenerate the alias files
    installAliases()
    
    // Now try to reload them in the current session
    if (shell === 'powershell') {
        console.log('\n\x1b[33m⚠️  PowerShell refresh requires manual reload:\x1b[0m')
        console.log('\x1b[36m   Import-Module libs/project-alias-expander/dist/pae-functions.psm1 -Force\x1b[0m\n')
    } else if (shell === 'gitbash') {
        console.log('\n\x1b[33m⚠️  Git Bash refresh requires manual reload:\x1b[0m')
        console.log('\x1b[36m   source libs/project-alias-expander/dist/pae-aliases.sh\x1b[0m\n')
    } else {
        console.log('\n\x1b[33m⚠️  Unknown shell. Manual reload required:\x1b[0m')
        console.log('\x1b[90m   PowerShell: Import-Module libs/project-alias-expander/dist/pae-functions.psm1 -Force\x1b[0m')
        console.log('\x1b[90m   Git Bash: source libs/project-alias-expander/dist/pae-aliases.sh\x1b[0m\n')
    }
}

function refreshAliasesDirect() {
    const shell = detectShell()
    
    try {
        if (shell === 'powershell') {
            // Execute pae-refresh in PowerShell (load module first)
            const modulePath = path.resolve('libs/project-alias-expander/dist/pae-functions.psm1')

            execSync(`powershell -Command "Import-Module '${modulePath}' -Force; pae-refresh"`, {
                stdio: 'inherit',
                cwd: process.cwd(),
                timeout: 5000
            })
        } else if (shell === 'gitbash') {
            // Execute pae-refresh in Git Bash
            execSync('pae-refresh', {
                stdio: 'inherit',
                cwd: process.cwd(),
                timeout: 5000
            })
        } else {
            console.log('\x1b[33m⚠️  Unknown shell. Manual refresh required.\x1b[0m')
        }
    } catch (_error) {
        console.log('\x1b[31m❌ Refresh failed. Manual refresh required.\x1b[0m')
        console.log('\x1b[90m   PowerShell: pae-refresh\x1b[0m')
        console.log('\x1b[90m   Git Bash: pae-refresh\x1b[0m')
    }
}

function main() {
    const [, , ...args] = process.argv
    const previousEcho = process.env.PAE_ECHO
    
    // Debug mode - show workspace detection info
    if (args.includes('--debug-workspace')) {
        console.log('DEBUG: process.argv[1]:', process.argv[1])
        console.log('DEBUG: import.meta.url:', import.meta.url)
        console.log('DEBUG: PACKAGE_ROOT:', PACKAGE_ROOT)
        console.log('DEBUG: process.cwd():', process.cwd())
        console.log('DEBUG: __filename:', __filename)
        return
    }
    
    // Handle special commands
    if (args.length > 0 && args[0] === 'install-aliases') {
        installAliases()
        return
    }
    
    if (args.length > 0 && args[0] === 'install') {
        installAliases()
        return
    }
    
    if (args.length > 0 && args[0] === 'refresh') {
        refreshAliases()
        return
    }
    
    if (args.length > 0 && args[0] === 'refresh-aliases') {
        refreshAliasesDirect()
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

    if (!alias) {
        // When run without arguments, generate files locally (for build process - cacheable)
        generateLocalFiles()
        return
    }

    if (alias === '-h' || alias === '--help' || alias === 'help') {
        const config = loadAliasConfig()
        const targets = config['package-targets'] ?? { b: 'build', l: 'lint', t: 'test' }
        const notNxTargets = config['not-nx-targets'] ?? {}
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
        for (const [short, expandable] of Object.entries(expandMap)) {
            if (typeof expandable === 'string') {
                console.log(`  -${short.padEnd(7)} -> ${expandable}`)
            } else {
                const example = expandTemplate(expandable.template, expandable.defaults || {})

                console.log(`  -${short.padEnd(7)} -> ${example} (template: ${expandable.template})`)
            }
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
        console.log('  pae refresh --verbose')
        process.exit(0)
    }

    const config = loadAliasConfig()
    const targets = config['package-targets'] ?? { b: 'build', l: 'lint', t: 'test' }
    const featureTargets = config['feature-targets']
    const notNxTargets = config['not-nx-targets'] ?? {}
    const expandMap = config.expandables ?? { f: 'fix', s: 'skip-nx-cache' }
    
    // Get the alias value to determine if it's a full package
    const aliasVal = config.packages?.[alias]
    const isFull = typeof aliasVal === 'object' && aliasVal?.full === true
    
    const targetExpansion = expandTargetShortcuts(rest, targets, featureTargets, isFull)
    let processedArgs = targetExpansion.args
    const wasFeatureTarget = targetExpansion.wasFeatureTarget

    const flagExpansion = expandFlags(processedArgs, expandMap)

    processedArgs = [...flagExpansion.prefix, ...flagExpansion.remainingArgs, ...flagExpansion.preArgs, ...flagExpansion.suffix]

    // Handle ephemeral echo flag: "-echo" -> "--pae-echo"
    const paeEchoEnabled = processedArgs.includes('--pae-echo')

    // Remove control flag from downstream Nx args
    if (paeEchoEnabled) {
        processedArgs = processedArgs.filter(a =>
            a !== '--pae-echo')
    }

    // Special handling for 'alias' command - call PAE CLI directly
    if (alias === 'alias') {
        const target = processedArgs[0]
        const flags = processedArgs.filter(a =>
            a.startsWith('--'))

        const previousEcho = process.env.PAE_ECHO

        if (paeEchoEnabled) {
            process.env.PAE_ECHO = '1'
        }

        // Call the PAE CLI directly with the target and flags
        const code = runNx([target, ...flags])

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

    if (alias === 'ext' || alias === 'core' || alias === 'all') {
        const target = processedArgs[0]
        const flags = processedArgs.filter(a =>
            a.startsWith('--'))

        const previousEcho = process.env.PAE_ECHO

        if (paeEchoEnabled) {
            process.env.PAE_ECHO = '1'
        }

        const code = runMany(alias as 'ext' | 'core' | 'all', [target], flags, config)

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

// Export functions for testing
export {
    loadAliasConfig,
    resolveProjectForAlias,
    expandTargetShortcuts,
    expandTemplate,
    parseExpandableFlag,
    expandFlags,
    runNx,
    installAliases,
    runMany,
    normalizeFullSemantics,
    resolveProjectForAliasWithTarget,
    resolveProjectForFeatureTarget
}

// Only run main if this file is executed directly
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('cli.js')) {
    main()
}

// Test comment in source code
// Test comment in source code again ascf
// Test comment for @nx/js:node exsadgsdgecutor
