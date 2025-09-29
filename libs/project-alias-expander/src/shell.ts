import type { ShellDetectionResult, ShellType } from './_types/index.js'

// Debug mode - check environment variable or debug flag
const DEBUG = process.env.PAE_DEBUG === '1' || process.argv.includes('-d') || process.argv.includes('--debug')

function debug(message: string, ...args: any[]) {
    if (DEBUG) {
        console.error(`[SHELL CACHE DEBUG] ${message}`, ...args)
    }
}

// Cache shell detection per process session
let cachedShellType: ShellDetectionResult | null = null
let shellDetectionFingerprint: string | null = null

function generateEnvironmentFingerprint(): string {
    // Create a fingerprint based on relevant environment variables
    const relevantVars = [
        'PSModulePath',
        'POWERSHELL_DISTRIBUTION_CHANNEL',
        'PSExecutionPolicyPreference',
        'TERM_PROGRAM',
        'MSYS_ROOT',
        'MINGW_ROOT',
        'WSL_DISTRO_NAME',
        'WSLENV',
        'SHELL'
    ]
    
    const fingerprint = relevantVars
        .map(varName => `${varName}=${process.env[varName] || ''}`)
        .join('|')
    
    debug(`Generated environment fingerprint: ${fingerprint}`)
    return fingerprint
}

function detectShellTypeRaw(): ShellDetectionResult {
    debug('Performing raw shell detection')
    
    // Check for PowerShell first (more specific indicators)
    if (process.env.PSModulePath
        || process.env.POWERSHELL_DISTRIBUTION_CHANNEL
        || process.env.PSExecutionPolicyPreference
        || process.env.PSExecutionPolicyPreference
        || (process.env.TERM_PROGRAM === 'vscode' && process.env.PSModulePath)) {
        debug('Detected PowerShell')
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
        debug('Detected Git Bash')
        return 'gitbash'
    }
    
    debug('Detected unknown shell')
    return 'unknown'
}

export function detectShellTypeCached(): ShellDetectionResult {
    const currentFingerprint = generateEnvironmentFingerprint()

    if (cachedShellType && shellDetectionFingerprint === currentFingerprint) {
        debug(`Using cached shell detection: ${cachedShellType}`)
        return cachedShellType
    }

    debug('Environment changed, re-detecting shell')
    cachedShellType = detectShellTypeRaw()
    shellDetectionFingerprint = currentFingerprint
    
    debug(`Cached shell detection: ${cachedShellType}`)
    return cachedShellType
}

// Legacy function for backward compatibility
export function detectShell(): ShellDetectionResult {
    return detectShellTypeCached()
}

// Utility functions for cache management
export function clearShellDetectionCache(): void {
    debug('Clearing shell detection cache')
    cachedShellType = null
    shellDetectionFingerprint = null
}

export function getShellDetectionCacheStats(): { cached: boolean, shell: ShellDetectionResult | null, fingerprint: string | null } {
    return {
        cached: cachedShellType !== null,
        shell: cachedShellType,
        fingerprint: shellDetectionFingerprint
    }
}