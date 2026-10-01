# Renders de la escena 3D (WebP 1600x900 en assets/renders/) con Chrome headless.
# Envoltorio de renderizar.py, que levanta el servidor local, abre escena/demo.html?captura=1
# por DevTools y guarda cada escena. Solo biblioteca estandar de Python.
#
# Uso (PowerShell, desde cualquier carpeta):
#   .\prototipos\presentacion-3d\herramientas\renderizar.ps1 [escena ...] [-Chrome <ruta>] [-Extra "reducido&env=room"] [-- opciones]
# Opciones de renderizar.py: --calidad alta|baja, --p 0.5, --formato webp|png, --sufijo=-x,
#   --salida <carpeta>, --gl d3d11|swiftshader|default. Ver: python renderizar.py --help
# Requiere internet: three.js, GSAP y el decodificador Draco se cargan por CDN.
param(
  [string]$Chrome = $env:CHROME,
  [string]$Extra = 'reducido',
  [Parameter(ValueFromRemainingArguments = $true)][string[]]$Resto = @()
)
$ErrorActionPreference = 'Stop'

if (-not $Chrome) {
  $candidatos = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
  )
  $Chrome = $candidatos | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
}
if (-not $Chrome) { throw 'No se encontro Chrome: pasa -Chrome <ruta> o defini $env:CHROME.' }

$python = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $python) { $python = (Get-Command py -ErrorAction SilentlyContinue).Source }
if (-not $python) { throw 'No se encontro Python en el PATH.' }

# Python escribe avisos en stderr: no tratarlos como error de PowerShell.
$ErrorActionPreference = 'Continue'
# Por defecto la escena se congela (?reducido): renders reproducibles, sin giro ni particulas al azar.
& $python (Join-Path $PSScriptRoot 'renderizar.py') --chrome $Chrome --extra $Extra @Resto
exit $LASTEXITCODE
