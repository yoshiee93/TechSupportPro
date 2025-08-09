# Mobile App Setup Instructions

## Prerequisites

1. **Install Expo CLI globally:**
   ```bash
   npm install -g @expo/cli
   ```

2. **Install dependencies:**
   ```bash
   cd mobile
   npm install
   ```

3. **Install Expo Go app on your device:**
   - Android: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)

## Development Workflow

1. **Start the development server:**
   ```bash
   cd mobile
   npm start
   ```

2. **Test on device:**
   - Scan the QR code with Expo Go app
   - Or press 'a' for Android emulator
   - Or press 'i' for iOS simulator

## API Configuration

Update the API endpoint in `src/services/api.ts`:
- Development: Points to `http://localhost:3000/api`
- Production: Update with your actual domain

## Building for Production

### Android APK:
```bash
cd mobile
npm run build:android
```

### iOS App:
```bash
cd mobile  
npm run build:ios
```

## Project Structure

```
mobile/
├── src/
│   ├── components/     # Reusable UI components
│   ├── screens/       # App screens
│   ├── services/      # API and data services
│   ├── context/       # React context providers
│   ├── types/         # TypeScript definitions
│   └── utils/         # Helper functions
├── assets/           # Images and static files
├── App.tsx          # Main app component
└── package.json     # Dependencies
```

## Features Included

- ✅ Authentication with login/logout
- ✅ Dashboard with ticket overview
- ✅ Ticket list with filtering
- ✅ Barcode scanner integration
- ✅ Photo capture capabilities
- ✅ Offline storage ready
- ✅ Push notifications ready
- ✅ GPS location ready

## Next Steps

1. Complete remaining screens (TicketDetail, Inventory, etc.)
2. Implement offline sync functionality
3. Add push notification configuration
4. Test on real devices
5. Configure app store deployment