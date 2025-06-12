import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VoiceTicketCreator from '@/components/voice/voice-ticket-creator';
import VoiceCommands from '@/components/voice/voice-commands';
import { Mic, Command, Brain } from 'lucide-react';

export default function VoicePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-3">
            <Mic className="w-8 h-8 text-blue-600" />
            <span>Voice Control Center</span>
          </h1>
          <p className="text-gray-600">Use voice commands and create tickets with speech recognition</p>
        </div>
      </div>

      {/* Voice Features Tabs */}
      <Tabs defaultValue="commands" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="commands" className="flex items-center space-x-2">
            <Command className="w-4 h-4" />
            <span>Voice Commands</span>
          </TabsTrigger>
          <TabsTrigger value="ticket-creator" className="flex items-center space-x-2">
            <Brain className="w-4 h-4" />
            <span>Voice Ticket Creator</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="commands">
          <VoiceCommands />
        </TabsContent>

        <TabsContent value="ticket-creator">
          <VoiceTicketCreator />
        </TabsContent>
      </Tabs>

      {/* Voice Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Command className="w-5 h-5 text-blue-600" />
              <span>Navigation Commands</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-3">Navigate the system using voice commands</p>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• "Show tickets" - Go to tickets page</li>
              <li>• "Show clients" - Go to clients page</li>
              <li>• "Dashboard" - Go to main dashboard</li>
              <li>• "Inventory" - Check parts and stock</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mic className="w-5 h-5 text-green-600" />
              <span>Voice Ticket Creation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-3">Create tickets by speaking naturally</p>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• Describe the issue in your own words</li>
              <li>• AI extracts client and device info</li>
              <li>• Automatically sets priority levels</li>
              <li>• Identifies symptoms and problems</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <span>AI Integration</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-3">Smart voice processing with AI</p>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• Natural language understanding</li>
              <li>• Automatic information extraction</li>
              <li>• Context-aware processing</li>
              <li>• Intelligent ticket structuring</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}