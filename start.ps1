# Start the backend server
Write-Host "Starting backend server..."
Start-Process powershell -ArgumentList "-Command & {node server.js}"

# Wait for server to start
Start-Sleep -Seconds 3

# Start the Expo app
Write-Host "Starting Expo development server..."
Set-Location -Path "./KickMatesApp"
npm start 