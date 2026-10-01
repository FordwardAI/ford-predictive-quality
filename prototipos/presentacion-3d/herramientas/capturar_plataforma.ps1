# Capturas locales de la plataforma para la presentación 3D (Windows).
#
#   powershell -File prototipos\presentacion-3d\herramientas\capturar_plataforma.ps1 [-Version presentacion]
#
# Corre prototipos/plataforma-web/shoot.sh con Git Bash y el Chrome de Windows
# (otra ruta con la variable de entorno CHROME) y copia d-hoja, d-inicio,
# d-codigos y d-alertas a prototipos/presentacion-3d/assets/local/. Esas capturas
# muestran tasas por código de la base ficticia: assets/local/ queda fuera de Git.
#
# Necesita prototipos/plataforma-web/data.js, que genera exportar_datos.py con el
# CSV crudo. Este script no genera datos: si falta data.js, falla y avisa.
param([string]$Version = 'presentacion')
$ErrorActionPreference = 'Stop'

$presentacion = Split-Path -Parent $PSScriptRoot
$plataforma = (Resolve-Path (Join-Path $presentacion '..\plataforma-web')).Path
$destino = Join-Path $presentacion 'assets\local'

if (-not (Test-Path (Join-Path $plataforma 'data.js'))) {
  Write-Host @'
Falta prototipos/plataforma-web/data.js.
Se genera con exportar_datos.py, que necesita el CSV crudo y el catálogo (fuera del repo):
  cd prototipos\plataforma-web
  ..\..\.venv\Scripts\python exportar_datos.py --csv "C:\ruta\al\Dataset QLS Inspección Adicional.csv" --catalogo "C:\ruta\a\Códigos de catálogo.csv"
Este script no genera datos. Sin las capturas, la presentación muestra los esquemas
de assets/ilustraciones/ (plataforma-mock.svg y hoja-mock.svg).
'@
  exit 1
}

# Git Bash para correr shoot.sh (no el bash de WSL).
$bash = @('C:\Program Files\Git\bin\bash.exe', 'C:\Program Files (x86)\Git\bin\bash.exe') |
  Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $bash) { Write-Host 'No encuentro Git Bash (C:\Program Files\Git\bin\bash.exe).'; exit 1 }

if (-not $env:CHROME) {
  $chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
  if (-not (Test-Path $chrome)) { Write-Host 'No encuentro Chrome: definir $env:CHROME con la ruta al ejecutable.'; exit 1 }
  # shoot.sh corre en Git Bash: la ruta va en formato /c/...
  $env:CHROME = '/c/Program Files/Google/Chrome/Application/chrome.exe'
}

& $bash (Join-Path $plataforma 'shoot.sh') $Version
if ($LASTEXITCODE -ne 0) { Write-Host "shoot.sh terminó con código $LASTEXITCODE"; exit $LASTEXITCODE }

New-Item -ItemType Directory -Force $destino | Out-Null
$faltan = 0
foreach ($p in 'd-hoja', 'd-inicio', 'd-codigos', 'd-alertas') {
  $origen = Join-Path $plataforma "shots\$Version\pantallas\$p.png"
  if (Test-Path $origen) {
    Copy-Item $origen (Join-Path $destino "$p.png") -Force
    Write-Host "assets/local/$p.png"
  } else {
    Write-Host "No se generó $origen"
    $faltan = 1
  }
}

# Control: nada de assets/local/ debe quedar a la vista de Git.
$visibles = git -C $presentacion status --porcelain -- assets/local
if ($visibles) { Write-Host 'ATENCIÓN: assets/local/ no está ignorado por Git; no subir estas capturas.'; exit 1 }
exit $faltan
