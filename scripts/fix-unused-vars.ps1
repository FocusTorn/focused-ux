# Fix unused variables by prefixing them with underscore
# Usage: .\scripts\fix-unused-vars.ps1 [file-or-directory]

param(
    [string]$Path = "."
)

function Fix-UnusedVariables {
    param([string]$FilePath)
    
    $content = Get-Content $FilePath -Raw
    $originalContent = $content
    
    # Pattern to match function parameters that might be unused
    # This is a simplified approach - you might want to enhance this
    $patterns = @(
        # Function parameters: function test(param1, param2) or (param1, param2) =>
        '(?<=\(\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*[,\)])',
        # Variable declarations: const/let/var variableName
        '(?<=\b(?:const|let|var)\s+)([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*=)'
    )
    
    foreach ($pattern in $patterns) {
        $matches = [regex]::Matches($content, $pattern)
        foreach ($match in $matches) {
            $varName = $match.Groups[1].Value
            if ($varName -notmatch '^_' -and $varName -notmatch '^[A-Z]') {
                # Check if this variable is actually used in the file
                $usagePattern = "\b$varName\b"
                $usages = [regex]::Matches($content, $usagePattern)
                
                # If it's only used in the declaration, it's unused
                if ($usages.Count -eq 1) {
                    Write-Host "Found unused variable: $varName in $FilePath"
                    $content = $content -replace "\b$varName\b", "_$varName"
                }
            }
        }
    }
    
    if ($content -ne $originalContent) {
        Set-Content $FilePath $content -NoNewline
        Write-Host "Fixed unused variables in $FilePath"
    }
}

# Process files
if (Test-Path $Path -PathType Leaf) {
    if ($Path -match '\.ts$|\.tsx$|\.js$|\.jsx$') {
        Fix-UnusedVariables $Path
    }
} else {
    Get-ChildItem -Path $Path -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx" | ForEach-Object {
        Fix-UnusedVariables $_.FullName
    }
}

Write-Host "Done fixing unused variables!" 