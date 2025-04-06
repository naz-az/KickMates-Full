# KickMates - Sports Meetup App

KickMates is a mobile application that helps users find teammates and organize sports events. This repository contains both the React Native mobile app (built with Expo) and a simple API server for testing purposes.

## Project Structure

- `KickMatesApp/` - React Native mobile app (Expo)
- `server.js` - Simple Express server for testing the API
- `package.json` - Server dependencies
- `start-app.bat` - Windows batch file to start both server and app
- `start.ps1` - PowerShell script to start both server and app (alternative)

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- Expo CLI (`npm install -g expo-cli`)

### Quick Start

For Windows users, you can use the batch file to start both the server and app:

```bash
start-app.bat
```

Or use the PowerShell script (alternative):

```powershell
./start.ps1
```

### Manual Setup

#### Server Setup (API)

1. Install server dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

   The server will run on http://localhost:5001

#### Mobile App Setup

1. Navigate to the app directory:
   ```bash
   cd KickMatesApp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   npm start
   ```

4. Connect using:
   - Expo Go app on your physical device
   - Android Emulator
   - iOS Simulator

## Troubleshooting

If you encounter image loading errors, ensure that:
1. The `/KickMatesApp/assets` directory exists with a `favicon.png` file
2. The correct package versions are installed:
   ```bash
   npm install @react-native-async-storage/async-storage@1.21.0 expo-image-picker@14.7.1 @react-native-community/datetimepicker@7.7.0 react-native@0.73.6
   ```

## Demo Accounts

For testing, you can use the following account:

- Email: john@example.com
- Password: password

## Features

- User authentication (login/register)
- Create and join sports events
- Search for events, users, and discussions
- Real-time notifications
- User profile management
- Settings customization

## Development Notes

- The server provides a simplified API for testing purposes only
- Real-world deployment would require a proper backend implementation
- Current API endpoints available:
  - Auth: `/api/users/login`, `/api/users/register`
  - Events: `/api/events`, `/api/events/:id`
  - Notifications: `/api/notifications`
  - Settings: `/api/users/settings`
  - Search: `/api/search`, `/api/search/events`, etc.

## License

This project is licensed under the MIT License

## Contact

Your Name - your.email@example.com

Project Link: [https://github.com/yourusername/kickmates](https://github.com/yourusername/kickmates) 