@echo off
rem Levanta la plataforma (http://127.0.0.1:8765) y la presentacion (http://localhost:8000/prototipos/presentacion-3d/).
rem
rem   iniciar.bat                                   demo: la plataforma usa una base sintetica
rem   iniciar.bat "<Dataset QLS ...csv>" "<Codigos de catalogo.csv>"   con la base de Ford
rem
rem La primera vez crea el entorno .venv con Python 3.13 e instala requirements.txt.
rem Cada servidor abre su propia ventana: cerrarlas para cortar.
setlocal
cd /d "%~dp0"
set PYTHONUTF8=1

if exist ".venv\Scripts\python.exe" goto listo
py -3.13 -c "import sys" >nul 2>nul && set "PY=py -3.13" && goto crear
python -c "import sys; sys.exit(0 if sys.version_info[:2] == (3, 13) else 1)" >nul 2>nul && set "PY=python" && goto crear
echo Hace falta Python 3.13: https://www.python.org/downloads/ ^(marcar "Add python.exe to PATH"^).
exit /b 1

:crear
echo Creando el entorno .venv e instalando dependencias ^(una sola vez, unos minutos^)...
%PY% -m venv .venv || exit /b 1
".venv\Scripts\python.exe" -m pip install --disable-pip-version-check -q -r requirements.txt || exit /b 1

:listo
set "ARGS="
if not "%~2"=="" set ARGS=--csv "%~1" --catalogo "%~2"
if not "%~1"=="" if "%~2"=="" (
  echo Pasar los dos archivos ^(CSV y catalogo^) o ninguno, para la demo.
  exit /b 1
)

start "Plataforma FordwardAI" ".venv\Scripts\python.exe" -m plataforma.servidor %ARGS% --puerto 8765
start "Presentacion FordwardAI" ".venv\Scripts\python.exe" -m http.server 8000 --bind 127.0.0.1
".venv\Scripts\python.exe" -m plataforma.esperar 8765
start "" "http://127.0.0.1:8765"
start "" "http://localhost:8000/prototipos/presentacion-3d/"
echo.
echo Plataforma:   http://127.0.0.1:8765
echo Presentacion: http://localhost:8000/prototipos/presentacion-3d/  ^(necesita internet^)
echo Para cortar, cerrar las ventanas "Plataforma FordwardAI" y "Presentacion FordwardAI".
endlocal
