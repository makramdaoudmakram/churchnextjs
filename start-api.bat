@echo off
title Charity API (port 5173)
echo Starting Charity API on http://localhost:5173 ...
echo Swagger will open in your browser when the API is ready.
echo Keep this window OPEN while using the website.
echo.
cd /d D:\church\churchapi
dotnet run --project src\Charity.Api --launch-profile http
pause
