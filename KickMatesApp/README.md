# KickMates Mobile App

A React Native mobile application that allows users to find teammates and organize sports events.

## Features

- **User Authentication**: Register, login, and profile management
- **Events**: Browse, create, join, and manage sports events
- **Discussions**: Participate in sport-related discussions
- **Messaging**: Chat with other users and event participants
- **Notifications**: Receive updates about events and messages
- **Social Features**: Comment, bookmark, and share events

## Tech Stack

- **React Native**: Mobile app framework
- **Expo**: Development platform
- **React Navigation**: Navigation library
- **React Native Paper**: UI component library
- **Axios**: HTTP client for API requests
- **AsyncStorage**: Local data persistence
- **React Native Vector Icons**: Icon library
- **Date-fns**: Date manipulation
- **Formik & Yup**: Form handling and validation

## Prerequisites

- Node.js (>= 14.x)
- npm or yarn
- Expo CLI
- Android Studio or Xcode (for mobile development)
- iOS simulator or Android emulator

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/kickmates-mobile.git
cd kickmates-mobile
```

2. Install dependencies:
```bash
npm install
# or with yarn
yarn install
```

3. Start the development server:
```bash
npm start
# or with expo
expo start
```

4. Follow the instructions in the terminal to open the app on your device or emulator.

## Backend API Integration

This mobile app connects to the KickMates backend API. Make sure to update the API URL in `src/services/api.ts` to point to your running backend server:

```typescript
// For Android emulator
const API_URL = 'http://10.0.2.2:5001/api'; 

// For iOS simulator
// const API_URL = 'http://localhost:5001/api'; 

// For production
// const API_URL = 'https://yourapidomain.com/api';
```

## Project Structure

```
KickMatesApp/
├── src/
│   ├── assets/        # Images, fonts, and other static assets
│   ├── components/    # Reusable components
│   ├── context/       # React context for state management
│   ├── hooks/         # Custom React hooks
│   ├── navigation/    # Navigation configuration
│   ├── screens/       # App screens
│   ├── services/      # API services
│   └── utils/         # Utility functions
├── App.tsx            # App entry point
├── app.json           # Expo configuration
├── babel.config.js    # Babel configuration
├── package.json       # Dependencies and scripts
└── tsconfig.json      # TypeScript configuration
```

## Building for Production

### For Android:

```bash
expo build:android
```

### For iOS:

```bash
expo build:ios
```

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 