import type { ShellDetectionResult, ShellType } from './_types/index.js'

export function detectShell(): ShellDetectionResult {
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
