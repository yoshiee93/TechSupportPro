# TechFix Pro Mobile App

A professional React Native mobile application for field technicians using Expo.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Expo CLI: `npm install -g @expo/cli`
- Expo Go app on your mobile device

### Installation
```bash
cd mobile
npm install --legacy-peer-deps
```

### Development
```bash
npm start
```
- Scan QR code with Expo Go app
- Press 'a' for Android emulator
- Press 'i' for iOS simulator

## 📱 Features

### ✅ Completed Features
- **Authentication** - Secure login with session management
- **Dashboard** - Overview of tickets, stats, and quick actions
- **Ticket Management** - View, search, filter, and update tickets
- **Barcode Scanning** - Native camera scanning with ZXing
- **Inventory Management** - Parts lookup with stock alerts
- **Client Directory** - Search and view client information
- **Profile Management** - User settings and app information

### 📋 Core Screens
- `LoginScreen` - Authentication with username/password
- `DashboardScreen` - Main overview with quick actions
- `TicketsScreen` - List all tickets with search/filter
- `TicketDetailScreen` - Full ticket details and actions
- `BarcodeScannerScreen` - Camera barcode scanning
- `InventoryScreen` - Parts management and stock tracking
- `ClientsScreen` - Client directory and contact info
- `ProfileScreen` - User profile and app settings

## 🛠 Technical Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Stack + Tabs)
- **State Management**: TanStack Query + React Context
- **Storage**: AsyncStorage for offline data
- **Camera**: Expo Camera + Barcode Scanner
- **UI**: Custom components with React Native styling
- **TypeScript**: Full type safety

## 🔧 API Integration

The app connects to your TechFix Pro backend:
- Development: `http://localhost:3000/api`
- Production: Configure your domain

### Available Endpoints
- Authentication: `/auth/login`, `/auth/logout`
- Tickets: `/tickets`, `/tickets/:id`
- Clients: `/clients`, `/clients/:id`  
- Parts: `/parts`, `/parts/barcode/:code`
- Time Tracking: `/time-logs`

## 📱 Mobile Features

### Native Capabilities
- **Camera Access** - Barcode scanning and photo capture
- **Offline Storage** - Local data caching with AsyncStorage
- **Push Notifications** - Ready for real-time alerts
- **Vibration Feedback** - Tactile responses for scans
- **GPS Location** - Ready for location-based features

### Professional UI
- Touch-optimized interface design
- Professional color scheme and branding
- Smooth animations and transitions
- Responsive layouts for all screen sizes

## 🔐 Security

- Session-based authentication
- Secure token storage
- API request encryption
- Local data protection

## 📦 Production Build

### Android APK
```bash
npm run build:android
```

### iOS App
```bash
npm run build:ios
```

## 🏗 Architecture

```
mobile/
├── src/
│   ├── screens/          # App screens
│   ├── context/          # React context providers
│   ├── services/         # API services
│   ├── types/           # TypeScript definitions
│   └── components/      # Reusable components (future)
├── App.tsx              # Main app component
└── package.json         # Dependencies
```

## 🔄 Integration with TechFix Pro

This mobile app is designed to work seamlessly with your existing TechFix Pro backend:

- **Shared API** - Uses the same endpoints as the web app
- **Real-time Updates** - WebSocket integration ready
- **Data Sync** - Automatic synchronization with server
- **Offline Mode** - Local caching for field work

## 🚀 Next Steps

1. Test the app on your device with Expo Go
2. Configure production API endpoints
3. Add company branding and colors
4. Set up push notification credentials
5. Build and deploy to app stores

The mobile app provides your field technicians with professional tools to manage tickets, scan barcodes, track time, and update client information directly from their phones.