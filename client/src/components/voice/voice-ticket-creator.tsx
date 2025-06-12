import { useState, useEffect } from 'react';
import { useSpeechToText } from '@/hooks/use-speech';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useClients } from '@/hooks/use-clients';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Wand2, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  Brain
} from 'lucide-react';

interface VoiceTicketData {
  clientName: string;
  deviceInfo: string;
  issueDescription: string;
  priority: string;
  symptoms: string[];
}

export default function VoiceTicketCreator() {
  const [ticketData, setTicketData] = useState<VoiceTicketData>({
    clientName: '',
    deviceInfo: '',
    issueDescription: '',
    priority: 'medium',
    symptoms: []
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');

  const { data: clients = [] } = useClients();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    transcript,
    isListening,
    isSupported,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechToText();

  const createTicketMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('/api/tickets', {
        method: 'POST',
        body: data,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: "Ticket Created Successfully",
        description: "Voice-generated ticket has been saved",
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Ticket",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const processVoiceInput = async () => {
    if (!transcript.trim()) {
      toast({
        title: "No Voice Input",
        description: "Please record your voice first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingStep('Analyzing voice input...');

    try {
      // Send transcript to AI for parsing
      const response = await apiRequest('/api/ai/parse-voice-ticket', {
        method: 'POST',
        body: { transcript },
      });

      setProcessingStep('Extracting ticket information...');

      // Update form with AI-parsed data
      setTicketData({
        clientName: response.clientName || '',
        deviceInfo: response.deviceInfo || '',
        issueDescription: response.issueDescription || transcript,
        priority: response.priority || 'medium',
        symptoms: response.symptoms || []
      });

      setProcessingStep('Ticket ready for review');
      setTimeout(() => setIsProcessing(false), 1000);

      toast({
        title: "Voice Input Processed",
        description: "Please review and submit the ticket",
      });
    } catch (error: any) {
      setIsProcessing(false);
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process voice input",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!ticketData.issueDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide an issue description",
        variant: "destructive",
      });
      return;
    }

    // Find or create client
    let clientId = null;
    if (ticketData.clientName) {
      const existingClient = clients.find(c => 
        c.name.toLowerCase().includes(ticketData.clientName.toLowerCase())
      );
      clientId = existingClient?.id;
    }

    const ticketPayload = {
      clientId,
      title: `Voice Ticket: ${ticketData.deviceInfo || 'Device Issue'}`,
      description: ticketData.issueDescription,
      priority: ticketData.priority,
      status: 'open',
      deviceBrand: extractDeviceBrand(ticketData.deviceInfo),
      deviceModel: extractDeviceModel(ticketData.deviceInfo),
      issueType: 'repair',
      estimatedCost: null,
      notes: `Voice-generated ticket. Symptoms: ${ticketData.symptoms.join(', ')}`
    };

    createTicketMutation.mutate(ticketPayload);
  };

  const extractDeviceBrand = (deviceInfo: string): string => {
    const brands = ['apple', 'samsung', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'microsoft'];
    const brand = brands.find(b => deviceInfo.toLowerCase().includes(b));
    return brand ? brand.charAt(0).toUpperCase() + brand.slice(1) : 'Unknown';
  };

  const extractDeviceModel = (deviceInfo: string): string => {
    // Simple extraction - could be enhanced with AI
    const words = deviceInfo.split(' ');
    return words.slice(1, 3).join(' ') || 'Unknown Model';
  };

  const resetForm = () => {
    setTicketData({
      clientName: '',
      deviceInfo: '',
      issueDescription: '',
      priority: 'medium',
      symptoms: []
    });
    resetTranscript();
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (transcript && !isListening) {
      setTicketData(prev => ({
        ...prev,
        issueDescription: transcript
      }));
    }
  }, [transcript, isListening]);

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Voice Not Supported</h3>
          <p className="text-gray-500">
            Your browser doesn't support voice recognition. Please use Chrome, Edge, or Safari.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mic className="w-5 h-5" />
            <span>Voice Ticket Creator</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Voice Recording Section */}
          <div className="text-center space-y-4">
            <div className="flex justify-center space-x-4">
              <Button
                onClick={isListening ? stopListening : startListening}
                size="lg"
                variant={isListening ? "destructive" : "default"}
                disabled={isProcessing}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-5 h-5 mr-2" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5 mr-2" />
                    Start Recording
                  </>
                )}
              </Button>

              <Button
                onClick={() => speakText("Please describe the device issue. Include the client name, device type, and problem details.")}
                variant="outline"
                size="lg"
              >
                <Volume2 className="w-5 h-5 mr-2" />
                Instructions
              </Button>
            </div>

            {isListening && (
              <div className="flex items-center justify-center space-x-2 text-red-600">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                <span className="font-medium">Listening...</span>
              </div>
            )}

            {speechError && (
              <div className="text-red-600 text-sm">{speechError}</div>
            )}
          </div>

          {/* Transcript Display */}
          {transcript && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <Label className="text-sm font-medium text-gray-700">Voice Transcript:</Label>
              <p className="mt-1 text-gray-900">{transcript}</p>
              <div className="mt-2 flex space-x-2">
                <Button
                  onClick={processVoiceInput}
                  disabled={isProcessing}
                  size="sm"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {processingStep}
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Process with AI
                    </>
                  )}
                </Button>
                <Button onClick={resetTranscript} variant="outline" size="sm">
                  Clear
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Form */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={ticketData.clientName}
                onChange={(e) => setTicketData(prev => ({ ...prev, clientName: e.target.value }))}
                placeholder="Enter client name"
              />
            </div>

            <div>
              <Label htmlFor="deviceInfo">Device Information</Label>
              <Input
                id="deviceInfo"
                value={ticketData.deviceInfo}
                onChange={(e) => setTicketData(prev => ({ ...prev, deviceInfo: e.target.value }))}
                placeholder="e.g., iPhone 13, Dell Laptop"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={ticketData.priority} onValueChange={(value) => 
              setTicketData(prev => ({ ...prev, priority: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="issueDescription">Issue Description</Label>
            <Textarea
              id="issueDescription"
              value={ticketData.issueDescription}
              onChange={(e) => setTicketData(prev => ({ ...prev, issueDescription: e.target.value }))}
              placeholder="Describe the issue in detail"
              rows={4}
            />
          </div>

          {ticketData.symptoms.length > 0 && (
            <div>
              <Label>Detected Symptoms:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ticketData.symptoms.map((symptom, index) => (
                  <Badge key={index} variant="secondary">
                    {symptom}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button onClick={resetForm} variant="outline">
              Reset Form
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createTicketMutation.isPending || !ticketData.issueDescription.trim()}
            >
              {createTicketMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Create Ticket
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}