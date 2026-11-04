$ErrorActionPreference = 'Stop'

$packageDir = $PSScriptRoot
$outputPath = Join-Path $packageDir 'campaign-url-builder-teams.zip'
$packageFiles = @('manifest.json', 'color.png', 'outline.png')

foreach ($name in $packageFiles) {
    if (-not (Test-Path -LiteralPath (Join-Path $packageDir $name) -PathType Leaf)) {
        throw "Missing Microsoft Teams app package file: $name"
    }
}

Compress-Archive -LiteralPath ($packageFiles | ForEach-Object { Join-Path $packageDir $_ }) -DestinationPath $outputPath -Force
Write-Output "Created $outputPath"
