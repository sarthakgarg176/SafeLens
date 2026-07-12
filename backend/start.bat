@echo off
echo SafeLens Backend Starting...
cd /d %~dp0
call venv\Scripts\activate.bat
echo Virtual environment activated!
echo Starting server...
uvicorn app.main:app --reload
pause