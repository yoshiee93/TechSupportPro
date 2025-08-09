# TechFix Pro Mobile App

React Native mobile application for field technicians.

## Project Structure

```
mobile/
├── src/
│   ├── components/        # Reusable UI components
│   ├── screens/          # App screens/pages
│   ├── services/         # API calls and data services
│   ├── context/          # React context providers
│   ├── utils/           # Helper functions
│   ├── types/           # TypeScript type definitions
│   └── constants/       # App constants and config
├── assets/              # Images, fonts, etc.
├── App.tsx             # Main app entry point
├── app.json            # Expo configuration
└── package.json        # Dependencies and scripts
```

## Development

1. Install Expo CLI: `npm install -g expo-cli`
2. Install dependencies: `cd mobile && npm install`
3. Start development server: `npm start`
4. Use Expo Go app to scan QR code for testing

## API Integration

The mobile app connects to the main TechFix Pro backend at:
- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

## Building

- Android: `npm run build:android`
- iOS: `npm run build:ios`

## Features

- ✅ Authentication and login
- ✅ Ticket management
- ✅ Barcode scanning
- ✅ Photo capture
- ✅ Offline sync
- ✅ Push notifications
- ✅ GPS tracking