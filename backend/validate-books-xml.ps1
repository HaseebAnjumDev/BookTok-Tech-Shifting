[CmdletBinding()]
param(
  [Parameter(Mandatory = $false)]
  [string]$XmlPath,

  [Parameter(Mandatory = $false)]
  [string]$XsdPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptRoot = if ($PSScriptRoot) {
  $PSScriptRoot
} else {
  Split-Path -Parent $MyInvocation.MyCommand.Path
}

if ([string]::IsNullOrWhiteSpace($XmlPath)) {
  $XmlPath = Join-Path $scriptRoot "..\xml\books.xml"
}
if ([string]::IsNullOrWhiteSpace($XsdPath)) {
  $XsdPath = Join-Path $scriptRoot "..\xml\books.xsd"
}

if (-not (Test-Path -LiteralPath $XmlPath)) {
  throw "XML file not found: $XmlPath"
}
if (-not (Test-Path -LiteralPath $XsdPath)) {
  throw "XSD file not found: $XsdPath"
}

Add-Type -AssemblyName System.Xml

$schemaSet = New-Object System.Xml.Schema.XmlSchemaSet
$null = $schemaSet.Add($null, $XsdPath)

$settings = New-Object System.Xml.XmlReaderSettings
$settings.ValidationType = [System.Xml.ValidationType]::Schema
$settings.Schemas.Add($schemaSet) | Out-Null
$settings.DtdProcessing = [System.Xml.DtdProcessing]::Prohibit

$errors = New-Object System.Collections.Generic.List[string]

$handler = [System.Xml.Schema.ValidationEventHandler]{
  param($sender, $e)
  $errors.Add($e.Message) | Out-Null
}
$settings.add_ValidationEventHandler($handler)

$reader = [System.Xml.XmlReader]::Create($XmlPath, $settings)
try {
  while ($reader.Read()) { }
}
finally {
  $reader.Dispose()
}

if ($errors.Count -gt 0) {
  Write-Host "INVALID: $XmlPath" -ForegroundColor Red
  $errors | Select-Object -Unique | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
  exit 1
}

Write-Host "VALID: $XmlPath" -ForegroundColor Green
exit 0
