function generate-setupFoldMarker {
    param([string[]]$DescribeLine)
    
    $describeLineContents = $DescribeLine -join ' '
    $result = ("    // SETUP " + "-" * (($describeLineContents).Length - 15) + ">>")
    
    Write-Output $result
}

# Usage
# . .cursor/_ai-helpers/generate-setupFoldMarker.ps1; generate-setupFoldMarker "describe('TemplateProcessor', () => {"     