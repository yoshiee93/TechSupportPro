import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, Trash2, Play, Square } from "lucide-react";
import { useTimeLogs, useDeleteTimeLog } from "@/hooks/use-time-logs";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface TimeLogsListProps {
  ticketId: number;
}

export default function TimeLogsList({ ticketId }: TimeLogsListProps) {
  const { data: timeLogs, isLoading } = useTimeLogs(ticketId);
  const deleteTimeLog = useDeleteTimeLog();
  const { toast } = useToast();

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDeleteTimeLog = async (id: number) => {
    try {
      await deleteTimeLog.mutateAsync(id);
      toast({
        title: "Time log deleted",
        description: "The time log entry has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete time log. Please try again.",
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
            Time Log History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading time logs...</div>
        </CardContent>
      </Card>
    );
  }

  if (!timeLogs || timeLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Log History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            No time logs recorded for this ticket yet.
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalDuration = timeLogs.reduce((total, log) => total + (log.duration || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Log History
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Total time: {formatDuration(totalDuration)} across {timeLogs.length} session{timeLogs.length !== 1 ? 's' : ''}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {timeLogs.map((log) => (
            <div
              key={log.id}
              className="border rounded-lg p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{log.technicianName}</span>
                  {!log.endTime && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Play className="h-3 w-3" />
                      Active
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">
                    {formatDuration(log.duration)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTimeLog(log.id)}
                    disabled={deleteTimeLog.isPending}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>
                    Started: {format(new Date(log.startTime), "MMM dd, yyyy 'at' h:mm a")}
                  </span>
                  {log.endTime && (
                    <span>
                      Ended: {format(new Date(log.endTime), "MMM dd, yyyy 'at' h:mm a")}
                    </span>
                  )}
                </div>
              </div>

              {log.description && (
                <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  {log.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}