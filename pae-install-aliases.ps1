# PAE Global Aliases - Auto-generated
function Invoke-PaeAlias {
    param([Parameter(Mandatory = $true)][string]$Alias, [string[]]$Arguments = @())
    node libs/project-alias-expander/dist/cli.js $Alias @Arguments
}

function ccp { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaeAlias -Alias 'ccp' -Arguments $Arguments 
}

function ccpc { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaeAlias -Alias 'ccpc' -Arguments $Arguments 
}

function ccpe { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaeAlias -Alias 'ccpe' -Arguments $Arguments 
}

function dc { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaeAlias -Alias 'dc' -Arguments $Arguments 
}

function dcc { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaeAlias -Alias 'dcc' -Arguments $Arguments 
}

function dce { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaeAlias -Alias 'dce' -Arguments $Arguments 
}

function gw { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaeAlias -Alias 'gw' -Arguments $Arguments 
}

function gwc { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaeAlias -Alias 'gwc' -Arguments $Arguments 
}

function gwe { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaeAlias -Alias 'gwe' -Arguments $Arguments 
}

function pb { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaeAlias -Alias 'pb' -Arguments $Arguments 
}

function pbc { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaeAlias -Alias 'pbc' -Arguments $Arguments 
}

function pbe { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaeAlias -Alias 'pbe' -Arguments $Arguments 
}

function nh { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaeAlias -Alias 'nh' -Arguments $Arguments 
}

function nhc { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaeAlias -Alias 'nhc' -Arguments $Arguments 
}

function nhe { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaeAlias -Alias 'nhe' -Arguments $Arguments 
}

function mockly { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaeAlias -Alias 'mockly' -Arguments $Arguments 
}

function shared { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaeAlias -Alias 'shared' -Arguments $Arguments 
}

function audit { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaeAlias -Alias 'audit' -Arguments $Arguments 
}

function cmo { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaeAlias -Alias 'cmo' -Arguments $Arguments 
}

function pax { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaeAlias -Alias 'pax' -Arguments $Arguments 
}

Write-Host -ForegroundColor Cyan "PAE aliases loaded."
