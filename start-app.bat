@echo off
echo Starting backend server...
start cmd /k "node server.js"

echo Waiting for server to start...
timeout /t 3 /nobreak

echo Starting Expo development server...
cd KickMatesApp
npm start 