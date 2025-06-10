import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Tickets from "@/pages/tickets";
import Clients from "@/pages/clients";
import Devices from "@/pages/devices";
import Parts from "@/pages/parts";
import Admin from "@/pages/admin";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">PC Repair Management</CardTitle>
          <p className="text-gray-600">Please sign in to access your repair management system</p>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => window.location.href = "/api/login"}
            className="w-full"
            size="lg"
          >
            Sign In with Replit
          </Button>
          <p className="text-xs text-gray-500 text-center mt-4">
            Secure authentication powered by Replit Auth
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function AuthenticatedApp() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/tickets" component={Tickets} />
            <Route path="/clients" component={Clients} />
            <Route path="/devices" component={Devices} />
            <Route path="/parts" component={Parts} />
            <Route path="/admin" component={Admin} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function Router() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
