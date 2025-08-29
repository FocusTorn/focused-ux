# PAX Global Aliases - Auto-generated
function Invoke-PaxAlias {
    param([Parameter(Mandatory = $true)][string]$Alias, [string[]]$Arguments = @())
    pax $Alias @Arguments
}

function ccp { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaxAlias -Alias 'ccp' -Arguments $Arguments 
}

function ccpc { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaxAlias -Alias 'ccpc' -Arguments $Arguments 
}

function ccpe { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaxAlias -Alias 'ccpe' -Arguments $Arguments 
}

function dc { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaxAlias -Alias 'dc' -Arguments $Arguments 
}

function dcc { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaxAlias -Alias 'dcc' -Arguments $Arguments 
}

function dce { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaxAlias -Alias 'dce' -Arguments $Arguments 
}

function gw { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaxAlias -Alias 'gw' -Arguments $Arguments 
}

function gwc { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaxAlias -Alias 'gwc' -Arguments $Arguments 
}

function gwe { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaxAlias -Alias 'gwe' -Arguments $Arguments 
}

function pb { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaxAlias -Alias 'pb' -Arguments $Arguments 
}

function pbc { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaxAlias -Alias 'pbc' -Arguments $Arguments 
}

function pbe { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaxAlias -Alias 'pbe' -Arguments $Arguments 
}

function nh { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaxAlias -Alias 'nh' -Arguments $Arguments 
}

function nhc { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaxAlias -Alias 'nhc' -Arguments $Arguments 
}

function nhe { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaxAlias -Alias 'nhe' -Arguments $Arguments 
}

function mockly { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaxAlias -Alias 'mockly' -Arguments $Arguments 
}

function shared { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaxAlias -Alias 'shared' -Arguments $Arguments 
}

function audit { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaxAlias -Alias 'audit' -Arguments $Arguments 
}

function cmo { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaxAlias -Alias 'cmo' -Arguments $Arguments 
}

function pax { 
    [CmdletBinding()] 
    param([Parameter(Position = 0, ValueFromRemainingArguments = $true)][string[]]$Arguments) 
    Invoke-PaxAlias -Alias 'pax' -Arguments $Arguments 
}

Write-Host -ForegroundColor Cyan "PAX aliases loaded."
