@echo off
start /B python -m uvicorn web_app.main:app --host 0.0.0.0 --port 8001 > server_output.log 2>&1
echo Server started on port 8001
