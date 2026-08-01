@echo off
cd /d %~dp0
echo SafeLens Backend Starting...
set PYTHONPATH=.
call venv\Scripts\activate.bat
venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
pause