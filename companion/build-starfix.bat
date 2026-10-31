@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Starfix

rem ASCII on purpose. UTF-8 Chinese in a bat file is split by cmd.

call :find_python
if not defined PY (
  echo.
  echo  Python 3 was not found.
  echo  Install Python 3 and tick Add python.exe to PATH.
  echo  https://www.python.org/downloads/
  goto :fail
)

echo.
call :say "\u6b63\u5728\u7528\u5f53\u524d\u6e90\u7801\u6253\u5305 Starfix.exe"
echo.
call :say "\u4f7f\u7528"
echo   "%PY%"
"%PY%" -c "import sys; print(sys.version)"
if errorlevel 1 goto :fail

"%PY%" -c "import PyInstaller" >nul 2>&1
if errorlevel 1 (
  echo.
  call :say "\u6b63\u5728\u5b89\u88c5\u6253\u5305\u5de5\u5177 PyInstaller ..."
  "%PY%" -m pip install --disable-pip-version-check pyinstaller
  if errorlevel 1 goto :fail
)

tasklist /FI "IMAGENAME eq Starfix.exe" /NH | find /I "Starfix.exe" >nul
if not errorlevel 1 (
  echo.
  call :say "Starfix \u6b63\u5728\u8fd0\u884c\u3002\u4e0d\u5173\u6389\u5b83\uff0c\u65b0\u7684 exe \u5199\u4e0d\u8fdb\u53bb\u3002"
  call :say "\u8bf7\u5148\u5173\u95ed\u6240\u6709 Starfix \u7a97\u53e3\uff0c\u7136\u540e\u6309\u4efb\u610f\u952e\u7ee7\u7eed\u3002"
  pause
  tasklist /FI "IMAGENAME eq Starfix.exe" /NH | find /I "Starfix.exe" >nul
  if not errorlevel 1 (
    call :say "Starfix \u4ecd\u5728\u8fd0\u884c\uff0c\u8fd9\u6b21\u6ca1\u6709\u6253\u5305\u3002"
    goto :fail
  )
)

echo.
call :say "\u5f00\u59cb\u6253\u5305\uff0c\u5927\u7ea6\u9700\u8981\u4e00\u4e24\u5206\u949f\u3002"
echo.

if exist "Starfix.spec" (
  "%PY%" -m PyInstaller --noconfirm --clean "Starfix.spec"
) else (
  "%PY%" -m PyInstaller --noconfirm --clean --onefile --windowed --name Starfix --icon "icon.ico" --add-data "icon.png;." --add-data "icon.ico;." --add-data "index.html;." --add-data "VERSION;." --add-data "..\css\starmap.css;css" "app.py"
)
if errorlevel 1 goto :fail

if not exist "dist\Starfix.exe" (
  call :say "\u6253\u5305\u547d\u4ee4\u7ed3\u675f\u4e86\uff0c\u4f46\u662f\u6ca1\u6709\u627e\u5230 dist\Starfix.exe\u3002"
  goto :fail
)

echo.
call :say "\u5b8c\u6210\u3002"
echo  %cd%\dist\Starfix.exe
echo.
explorer /select,"%cd%\dist\Starfix.exe"
goto :done

:find_python
set "PY="
where py >nul 2>&1
if not errorlevel 1 (
  for /f "delims=" %%E in ('py -3 -c "import sys; print(sys.executable)" 2^>nul') do (
    if not defined PY set "PY=%%E"
  )
)
if defined PY exit /b 0

for %%P in (
  "%LocalAppData%\Programs\Python\Python313\python.exe"
  "%LocalAppData%\Programs\Python\Python312\python.exe"
  "%LocalAppData%\Programs\Python\Python311\python.exe"
  "%LocalAppData%\Programs\Python\Python310\python.exe"
  "%ProgramFiles%\Python313\python.exe"
  "%ProgramFiles%\Python312\python.exe"
  "%ProgramFiles%\Python311\python.exe"
) do (
  if not defined PY if exist "%%~P" set "PY=%%~P"
)
if defined PY exit /b 0

where python >nul 2>&1
if not errorlevel 1 (
  for /f "delims=" %%W in ('where python 2^>nul') do (
    if not defined PY (
      echo %%W | find /I "\WindowsApps\" >nul
      if errorlevel 1 (
        "%%W" -c "import sys" >nul 2>&1
        if not errorlevel 1 set "PY=%%W"
      )
    )
  )
)
exit /b 0

:say
"%PY%" -c "import sys; print(sys.argv[1].encode('ascii').decode('unicode_escape'))" %1
exit /b 0

:fail
echo.
if defined PY (
  call :say "\u6253\u5305\u6ca1\u6709\u5b8c\u6210\u3002"
) else (
  echo  Build did not finish.
)
echo.
pause
exit /b 1

:done
echo.
pause
exit /b 0
