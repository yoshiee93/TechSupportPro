import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Square, Clock, User } from "lucide-react";
import { useActiveTimeLog, useCreateTimeLog, useStopTimeLog, useTimeLogs } from "@/hooks/use-time-logs";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface TicketTimerProps {
  ticketId: number;
}

export default function TicketTimer({ ticketId }: TicketTimerProps) {
  const [technicianName, setTechnicianName] = useState("Unknown");
  const [elapsedTime, setElapsedTime] = useState(0);
  const { toast } = useToast();

  const { data: activeTimeLog, isLoading: isLoadingActive } = useActiveTimeLog(ticketId, technicianName);
  const { data: timeLogs, isLoading: isLoadingLogs } = useTimeLogs(ticketId);
  const createTimeLog = useCreateTimeLog();
  const stopTimeLog = useStopTimeLog();

  // Update elapsed time every second when timer is running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeTimeLog) {
      interval = setInterval(() => {
        const startTime = new Date(activeTimeLog.startTime);
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeTimeLog]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = async () => {
    if (!technicianName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a technician name before starting the timer.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createTimeLog.mutateAsync({
        ticketId,
        technicianName: technicianName.trim(),
        startTime: new Date(),
        description: `Work session started by ${technicianName.trim()}`,
      });
      toast({
        title: "Timer Started",
        description: "Time tracking has begun for this ticket.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start timer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStopTimer = async () => {
    if (!activeTimeLog) return;

    try {
      await stopTimeLog.mutateAsync({
        id: activeTimeLog.id,
        endTime: new Date(),
      });
      toast({
        title: "Timer Stopped",
        description: `Time logged: ${formatTime(elapsedTime)}`,
      });
      setElapsedTime(0);
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to stop timer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getTotalTime = () => {
    if (!timeLogs) return 0;
    return timeLogs.reduce((total, log) => total + (log.duration || 0), 0);
  };

  if (isLoadingActive || isLoadingLogs) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading timer...</div>
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
        {/* Technician Name Input */}
        <div className="space-y-2">
          <Label htmlFor="technician">Technician Name</Label>
          <Input
            id="technician"
            value={technicianName}
            onChange={(e) => setTechnicianName(e.target.value)}
            placeholder="Enter your name"
            disabled={!!activeTimeLog}
          />
        </div>

        {/* Timer Display */}
        <div className="text-center">
          <div className="text-3xl font-mono font-bold mb-2">
            {activeTimeLog ? formatTime(elapsedTime) : "00:00:00"}
          </div>
          <div className="flex items-center justify-center gap-2">
            {activeTimeLog ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Play className="h-3 w-3" />
                Running
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1">
                <Pause className="h-3 w-3" />
                Stopped
              </Badge>
            )}
          </div>
        </div>

        {/* Timer Controls */}
        <div className="flex gap-2">
          {!activeTimeLog ? (
            <Button
              onClick={handleStartTimer}
              disabled={createTimeLog.isPending || !technicianName.trim()}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Timer
            </Button>
          ) : (
            <Button
              onClick={handleStopTimer}
              disabled={stopTimeLog.isPending}
              variant="destructive"
              className="flex-1"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop Timer
            </Button>
          )}
        </div>

        {/* Active Session Info */}
        {activeTimeLog && (
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span className="font-medium">{activeTimeLog.technicianName}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Started {formatDistanceToNow(new Date(activeTimeLog.startTime))} ago
            </div>
            {activeTimeLog.description && (
              <div className="text-xs text-muted-foreground mt-1">
                {activeTimeLog.description}
              </div>
            )}
          </div>
        )}

        {/* Total Time Summary */}
        {timeLogs && timeLogs.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Total Time Logged:</span>
              <span className="font-mono">{formatTime(getTotalTime())}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {timeLogs.length} session{timeLogs.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}