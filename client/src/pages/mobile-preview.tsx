import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Smartphone, 
  QrCode, 
  Download, 
  Play, 
  CheckCircle, 
  Wifi,
  Camera,
  Users,
  ClipboardList,
  Package,
  User
} from 'lucide-react';

export default function MobilePreviewPage() {
  const [activeScreen, setActiveScreen] = useState('login');

  const screens = [
    { id: 'login', name: 'Login', icon: User },
    { id: 'dashboard', name: 'Dashboard', icon: ClipboardList },
    { id: 'tickets', name: 'Tickets', icon: ClipboardList },
    { id: 'scanner', name: 'Scanner', icon: Camera },
    { id: 'inventory', name: 'Inventory', icon: Package },
    { id: 'clients', name: 'Clients', icon: Users },
  ];

  const features = [
    { name: 'Authentication', status: 'complete', description: 'Secure login with session management' },
    { name: 'Dashboard', status: 'complete', description: 'Ticket overview and quick actions' },
    { name: 'Ticket Management', status: 'complete', description: 'View, search, and update tickets' },
    { name: 'Barcode Scanning', status: 'complete', description: 'Native camera scanning' },
    { name: 'Inventory Management', status: 'complete', description: 'Parts lookup and stock alerts' },
    { name: 'Client Directory', status: 'complete', description: 'Search and view client info' },
    { name: 'Offline Storage', status: 'ready', description: 'Local data caching' },
    { name: 'Push Notifications', status: 'ready', description: 'Real-time alerts' },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">TechFix Pro Mobile App</h1>
          <p className="text-muted-foreground">Professional mobile app for field technicians</p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle className="w-4 h-4 mr-1" />
          Complete
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="screens">Screens</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  React Native App
                </CardTitle>
                <CardDescription>
                  Professional mobile app built with Expo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Framework:</span>
                    <span className="font-medium">React Native + Expo</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Navigation:</span>
                    <span className="font-medium">React Navigation</span>
                  </div>
                  <div className="flex justify-between">
                    <span>State:</span>
                    <span className="font-medium">TanStack Query</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Storage:</span>
                    <span className="font-medium">AsyncStorage</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Native Features
                </CardTitle>
                <CardDescription>
                  Device capabilities integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Camera & Barcode Scanning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Photo Capture & Upload</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Vibration Feedback</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Offline Data Storage</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="w-5 h-5" />
                  API Integration
                </CardTitle>
                <CardDescription>
                  Connects to your TechFix Pro backend
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Authentication</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Ticket Management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Inventory Sync</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Real-time Updates</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mobile App Features</CardTitle>
              <CardDescription>
                Complete feature set for field technicians
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature) => (
                  <div key={feature.name} className="flex items-start gap-3 p-3 border rounded-lg">
                    <CheckCircle className={`w-5 h-5 mt-0.5 ${
                      feature.status === 'complete' ? 'text-green-500' : 'text-blue-500'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{feature.name}</h4>
                        <Badge variant={feature.status === 'complete' ? 'default' : 'secondary'}>
                          {feature.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Mobile App Setup Options
              </CardTitle>
              <CardDescription>
                Choose how you want to test the mobile app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">Option 1: Direct Download (Recommended)</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Download the mobile folder and run it locally for full native features
                  </p>
                  <div className="space-y-2 text-sm">
                    <p><strong>1.</strong> Download the <code>mobile/</code> folder from this Replit</p>
                    <p><strong>2.</strong> Install Expo CLI: <code>npm install -g @expo/cli</code></p>
                    <p><strong>3.</strong> Run: <code>cd mobile && npm install --legacy-peer-deps</code></p>
                    <p><strong>4.</strong> Start: <code>npm start</code></p>
                    <p><strong>5.</strong> Scan QR code with Expo Go app on your Samsung</p>
                  </div>
                  <Button className="mt-4">
                    <Download className="w-4 h-4 mr-2" />
                    Download Instructions
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">Option 2: Web Preview</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Test the UI and functionality in your browser (limited camera features)
                  </p>
                  <Button variant="outline">
                    <Play className="w-4 h-4 mr-2" />
                    Open Web Preview
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">Option 3: Production Deployment</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Build and deploy to app stores for your technicians
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline">Build Android APK</Button>
                    <Button variant="outline">Build iOS App</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="screens" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mobile App Screens</CardTitle>
              <CardDescription>
                All screens are built and ready for testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {screens.map((screen) => {
                  const Icon = screen.icon;
                  return (
                    <button
                      key={screen.id}
                      onClick={() => setActiveScreen(screen.id)}
                      className={`p-4 border rounded-lg text-center transition-colors ${
                        activeScreen === screen.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className="w-8 h-8 mx-auto mb-2" />
                      <span className="text-sm font-medium">{screen.name}</span>
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-6 p-6 border rounded-lg bg-muted/30">
                <h4 className="font-semibold mb-2">Screen Details: {screens.find(s => s.id === activeScreen)?.name}</h4>
                <div className="text-sm text-muted-foreground">
                  {activeScreen === 'login' && 'Professional login screen with username/password authentication'}
                  {activeScreen === 'dashboard' && 'Overview dashboard with ticket stats, urgent alerts, and quick actions'}
                  {activeScreen === 'tickets' && 'Complete ticket management with search, filtering, and status updates'}
                  {activeScreen === 'scanner' && 'Native barcode scanner with camera integration and flash control'}
                  {activeScreen === 'inventory' && 'Parts management with stock alerts, search, and barcode lookup'}
                  {activeScreen === 'clients' && 'Client directory with contact information and search functionality'}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}