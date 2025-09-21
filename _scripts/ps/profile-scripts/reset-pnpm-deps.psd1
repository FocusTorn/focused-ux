# reset-pnpm-deps.psd1
@{
    RootModule = 'reset-pnpm-deps.psm1'
    ModuleVersion = '1.0.0'
    GUID = '12345678-1234-1234-1234-123456789012'
    Author = 'FocusedUX'
    CompanyName = 'FocusedUX'
    Copyright = '(c) FocusedUX. All rights reserved.'
    Description = 'PowerShell module for resetting pnpm dependencies in Nx monorepos'
    PowerShellVersion = '5.1'
    FunctionsToExport = @('reset-pnpm-deps', 'Test-PnpmReset', 'Get-PnpmResetHelp')
    CmdletsToExport = @()
    VariablesToExport = @()
    AliasesToExport = @()
    PrivateData = @{
        PSData = @{
            Tags = @('pnpm', 'nx', 'monorepo', 'reset', 'dependencies')
            ProjectUri = 'https://github.com/FocusTorn/focused-ux'
            LicenseUri = 'https://github.com/FocusTorn/focused-ux/blob/main/LICENSE'
        }
    }
}
