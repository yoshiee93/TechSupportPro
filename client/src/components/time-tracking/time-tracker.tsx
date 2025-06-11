import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Play, Square, Clock, DollarSign } from "lucide-react";
import { useActiveTimeLog, useStartTimeTracking, useStopTimeTracking } from "@/hooks/use-time-tracking";
import { useToast } from "@/hooks/use-toast";

interface TimeTrackerProps {
  ticketId: number;
  ticketTitle: string;
}

export function TimeTracker({ ticketId, ticketTitle }: TimeTrackerProps) {
  const [description, setDescription] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const { toast } = useToast();
  const { data: activeTimeLog, isLoading } = useActiveTimeLog();
  const startTimeTracking = useStartTimeTracking();
  const stopTimeTracking = useStopTimeTracking();

  const isActive = activeTimeLog?.ticketId === ticketId;
  const isTrackingOtherTicket = activeTimeLog && activeTimeLog.ticketId !== ticketId;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && activeTimeLog) {
      interval = setInterval(() => {
        const startTime = new Date(activeTimeLog.startTime).getTime();
        const now = new Date().getTime();
        setElapsedTime(Math.floor((now - startTime) / 1000));
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isActive, activeTimeLog]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    try {
      await startTimeTracking.mutateAsync({
        ticketId,
        description: description.trim() || undefined,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
      });
      
      toast({
        title: "Time tracking started",
        description: `Now tracking time for ticket #${ticketId}`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to start time tracking",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleStop = async () => {
    if (!activeTimeLog) return;
    
    try {
      await stopTimeTracking.mutateAsync({
        id: activeTimeLog.id,
        description: description.trim() || undefined,
      });
      
      toast({
        title: "Time tracking stopped",
        description: `Session completed for ticket #${ticketId}`,
      });
      
      setDescription("");
      setElapsedTime(0);
    } catch (error: any) {
      toast({
        title: "Failed to stop time tracking",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isTrackingOtherTicket && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              You're currently tracking time for another ticket. Stop that session first to start tracking this ticket.
            </p>
          </div>
        )}
        
        {isActive && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-800">
                Time tracking active
              </span>
              <div className="text-2xl font-mono text-green-700">
                {formatTime(elapsedTime)}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="What are you working on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isActive}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="hourlyRate" className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              Hourly Rate (optional)
            </Label>
            <Input
              id="hourlyRate"
              type="number"
              placeholder="0.00"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              disabled={isActive}
              step="0.01"
              min="0"
            />
          </div>
        </div>

        <div className="flex gap-2">
          {!isActive && (
            <Button
              onClick={handleStart}
              disabled={startTimeTracking.isPending || isTrackingOtherTicket}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Tracking
            </Button>
          )}
          
          {isActive && (
            <Button
              onClick={handleStop}
              disabled={stopTimeTracking.isPending}
              variant="destructive"
              className="flex-1"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop Tracking
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}