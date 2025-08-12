# FocusedUX alias launcher (slim shim)

$script:AliasCache = $null

function Get-AliasConfiguration {
    if ($script:AliasCache -eq $null) {
        $jsonPath = Join-Path (Resolve-Path "$PSScriptRoot/../../../..") '.vscode/shell/pnpm_aliases.json'
        if (-not (Test-Path $jsonPath)) { throw "Alias file not found: $jsonPath" }
        $script:AliasCache = Get-Content -Path $jsonPath -Raw | ConvertFrom-Json
    }
    return $script:AliasCache
}

function Get-PackageAliases { $c = Get-AliasConfiguration; if ($c.packages) { $c.packages } else { $c } }

function Invoke-Process { param([string]$Executable,[string[]]$Arguments) $OutputEncoding=[System.Text.Encoding]::UTF8; & $Executable @Arguments }

function Invoke-AkaCLI {
    param([Parameter(Mandatory=$true)][string]$Alias,[string[]]$Args=@())
    # PSScriptRoot = <repo>/libs/tools/aka/ps → repo root is four levels up
    $root = (Resolve-Path "$PSScriptRoot/../../../..").Path
    $tsArgs = @("$root\libs\tools\aka\src\main.ts", $Alias) + $Args
    Invoke-Process -Executable 'tsx' -Arguments $tsArgs
}

function Show-PnpmAliases {
    $aliases=Get-PackageAliases
    Write-Host "`nAvailable PNPM/Nx Aliases:" -ForegroundColor Cyan
    Write-Host "`n  Meta Aliases (run-many):" -ForegroundColor Yellow
    Write-Host ("  "+"ext".PadRight(8)+"→ all '-ext' packages")
    Write-Host ("  "+"core".PadRight(8)+"→ all '-core' packages")
    Write-Host ("  "+"all".PadRight(8)+"→ all aliased packages")
    Write-Host ""
    Write-Host "  Package Aliases:" -ForegroundColor Yellow
    foreach ($a in $aliases.PSObject.Properties.Name) {
        $v = $aliases.$a
        if ($v -is [PSCustomObject] -and $v.PSObject.Properties['name']) { $pkg = $v.name; $s = $v.suffix; if ($s) { $proj = "@fux/$pkg-$s" } else { $proj = "@fux/$pkg" } $full = $v.full -eq $true }
        else { $pkg = $v; if ($pkg.StartsWith('@fux/')) { $proj = $pkg } else { $proj = "@fux/$pkg" } $full = $false }
        $fi = if ($full) { ' (full)' } else { '' }
        Write-Host ("  " + $a.PadRight(8) + "→ " + $pkg + $fi + "  (Nx: " + $proj + ")")
    }
    Write-Host "`nUsage: <alias> <target> [flags]"
    Write-Host "Examples:"
    Write-Host "  gw b --prod                    # Build ghost-writer extension"
    Write-Host "  ext b --prod                   # Build all extension packages"
}

Set-Alias pnpm-aliases-help Show-PnpmAliases
$aliases = Get-PackageAliases
function New-PnpmAliasFunction {
    param([string]$alias)
    # Build the function body without variable expansion using a single-quoted here-string
    $scriptBlockText = @'
param([Parameter(ValueFromRemainingArguments = $true)][string[]] $args)
# Detect if this alias invocation is part of a pipeline and warn. Piping alias output to commands like 'cat' (Get-Content) is unsupported in PowerShell.
$__invocationLine = $MyInvocation.Line
if ($__invocationLine -match "(?i)\b__ALIAS__\b.*\|") {
    Write-Host "[aka] Warning: Piping from alias '__ALIAS__' is not supported in PowerShell (e.g., '| cat' maps to Get-Content). Use without piping or pipe to Out-Host/Tee-Object instead." -ForegroundColor Yellow
}
Invoke-AkaCLI -Alias '__ALIAS__' -Args $args
'@
    $scriptBlockText = $scriptBlockText.Replace('__ALIAS__', $alias)
    $sb = [ScriptBlock]::Create($scriptBlockText)
    Set-Item "function:global:$alias" $sb
}
foreach ($a in $aliases.PSObject.Properties.Name) { New-PnpmAliasFunction $a }
New-PnpmAliasFunction 'ext'; New-PnpmAliasFunction 'core'; New-PnpmAliasFunction 'all'

# Optional: standalone audit helper remains available
function Invoke-Audit { param([string]$PackageName=$null,[string[]]$Flags=@()) $root = (Resolve-Path "$PSScriptRoot/../../../..").Path; $args=@("$root\libs\tools\structure-auditor\src\main.ts")+$Flags; if ($PackageName) { $args+=$PackageName }; Invoke-Process -Executable 'tsx' -Arguments $args }
function audit { [CmdletBinding()] param([Parameter(Position=0,ValueFromRemainingArguments=$true)][string[]]$Arguments) if ($Arguments.Count -eq 0 -or $Arguments -contains '-h' -or $Arguments -contains '--help') { Write-Host 'Usage: audit [package|lib] [-l|--list] [-g|--grouped]'; return } $pkg=$null; $flags=@(); foreach ($a in $Arguments) { if ($a -in '-l','--list','-g','--grouped') { $flags+=$a } elseif (-not $pkg) { $pkg=$a } }; Invoke-Audit -PackageName $pkg -Flags $flags }

# Optional: optimizer shortcuts retained
function cmo-p { tsx --expose-gc libs/tools/cursor-memory-optimizer/src/index.ts purge }
function cmo-purge { tsx --expose-gc libs/tools/cursor-memory-optimizer/src/index.ts purge }
New-Alias -Name 'cmo-p' -Value 'cmo-p' -Force
New-Alias -Name 'cmo-purge' -Value 'cmo-purge' -Force
New-Alias -Name 'p' -Value 'cmo-p' -Force
New-Alias -Name 'purge' -Value 'cmo-purge' -Force

