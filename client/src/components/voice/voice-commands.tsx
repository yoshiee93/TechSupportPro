import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useVoiceCommands } from '@/hooks/use-speech';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Command,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface VoiceCommand {
  command: string;
  description: string;
  patterns: string[];
  action: () => void;
}

export default function VoiceCommands() {
  const [location, setLocation] = useLocation();
  const [isEnabled, setIsEnabled] = useState(false);
  const { toast } = useToast();

  const voiceCommands: VoiceCommand[] = [
    {
      command: 'Go to Dashboard',
      description: 'Navigate to the main dashboard',
      patterns: ['dashboard', 'home', 'main page'],
      action: () => setLocation('/')
    },
    {
      command: 'Show Tickets',
      description: 'Navigate to tickets page',
      patterns: ['tickets', 'show tickets', 'ticket list'],
      action: () => setLocation('/tickets')
    },
    {
      command: 'Show Clients',
      description: 'Navigate to clients page',
      patterns: ['clients', 'customers', 'show clients'],
      action: () => setLocation('/clients')
    },
    {
      command: 'Show Inventory',
      description: 'Navigate to inventory page',
      patterns: ['inventory', 'parts', 'stock'],
      action: () => setLocation('/inventory')
    },
    {
      command: 'Show Sales',
      description: 'Navigate to sales page',
      patterns: ['sales', 'transactions', 'show sales'],
      action: () => setLocation('/sales')
    },
    {
      command: 'Show Invoices',
      description: 'Navigate to invoices page',
      patterns: ['invoices', 'bills', 'show invoices'],
      action: () => setLocation('/invoices')
    },
    {
      command: 'AI Insights',
      description: 'Navigate to AI insights',
      patterns: ['ai insights', 'analytics', 'insights'],
      action: () => setLocation('/ai-insights')
    },
    {
      command: 'Create Ticket',
      description: 'Start voice ticket creation',
      patterns: ['new ticket', 'create ticket', 'add ticket'],
      action: () => {
        setLocation('/tickets');
        toast({
          title: "Voice Ticket Creation",
          description: "Use the voice ticket creator to add a new ticket",
        });
      }
    }
  ];

  const handleVoiceCommand = (spokenCommand: string) => {
    const normalizedCommand = spokenCommand.toLowerCase().trim();
    
    // Find matching command
    const matchedCommand = voiceCommands.find(cmd => 
      cmd.patterns.some(pattern => 
        normalizedCommand.includes(pattern.toLowerCase())
      )
    );

    if (matchedCommand) {
      toast({
        title: "Command Executed",
        description: `${matchedCommand.command}`,
      });
      matchedCommand.action();
    } else {
      toast({
        title: "Command Not Recognized",
        description: `"${spokenCommand}" - Try saying one of the available commands`,
        variant: "destructive",
      });
    }
  };

  const {
    isListening,
    lastCommand,
    isSupported,
    error,
    startListening,
    stopListening,
  } = useVoiceCommands(handleVoiceCommand);

  const speakCommands = () => {
    if ('speechSynthesis' in window) {
      const commandList = voiceCommands.map(cmd => cmd.command).join(', ');
      const utterance = new SpeechSynthesisUtterance(
        `Available voice commands: ${commandList}`
      );
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Voice Commands Not Supported</h3>
          <p className="text-gray-500">
            Your browser doesn't support voice recognition. Please use Chrome, Edge, or Safari.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Command className="w-5 h-5" />
          <span>Voice Commands</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice Control */}
        <div className="text-center space-y-4">
          <div className="flex justify-center space-x-4">
            <Button
              onClick={isListening ? stopListening : startListening}
              size="lg"
              variant={isListening ? "destructive" : "default"}
            >
              {isListening ? (
                <>
                  <MicOff className="w-5 h-5 mr-2" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 mr-2" />
                  Start Voice Commands
                </>
              )}
            </Button>

            <Button
              onClick={speakCommands}
              variant="outline"
              size="lg"
            >
              <Volume2 className="w-5 h-5 mr-2" />
              Available Commands
            </Button>
          </div>

          {isListening && (
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
              <span className="font-medium">Listening for commands...</span>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          {lastCommand && (
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">Last command: "{lastCommand}"</span>
            </div>
          )}
        </div>

        {/* Available Commands */}
        <div>
          <h4 className="font-medium text-gray-700 mb-3">Available Voice Commands:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {voiceCommands.map((cmd, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <span className="font-medium text-sm">{cmd.command}</span>
                  <p className="text-xs text-gray-500">{cmd.description}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  Say: {cmd.patterns[0]}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Usage Tips */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Usage Tips:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Speak clearly and wait for the beep</li>
            <li>• Use the exact phrases shown in the commands</li>
            <li>• Commands work best in quiet environments</li>
            <li>• Click "Available Commands" to hear them spoken</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}