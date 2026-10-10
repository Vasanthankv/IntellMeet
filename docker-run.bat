@echo off
echo ====================================================
echo Starting IntellMeet Containers with Docker Compose
echo ====================================================
docker compose up --build -d
echo.
echo ====================================================
echo IntellMeet is running!
echo Frontend: http://localhost:80 or http://localhost:5173
echo Backend:  http://localhost:5000
echo MongoDB:  localhost:27017
echo ====================================================
pause
