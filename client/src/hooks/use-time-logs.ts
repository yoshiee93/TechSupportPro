import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TimeLog, InsertTimeLog } from "@shared/schema";

export function useTimeLogs(ticketId: number) {
  return useQuery<TimeLog[]>({
    queryKey: ["/api/time-logs", ticketId],
    queryFn: async () => {
      const response = await fetch(`/api/time-logs/${ticketId}`, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`Failed to fetch time logs: ${response.statusText}`);
      }
      return response.json();
    },
  });
}

export function useActiveTimeLog(ticketId: number, technicianName: string = "Unknown") {
  return useQuery<TimeLog | null>({
    queryKey: ["/api/time-logs", ticketId, "active", technicianName],
    queryFn: async () => {
      const response = await fetch(`/api/time-logs/${ticketId}/active?technician=${encodeURIComponent(technicianName)}`, { 
        credentials: "include" 
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch active time log: ${response.statusText}`);
      }
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds to keep timer updated
  });
}

export function useCreateTimeLog() {
  const queryClient = useQueryClient();
  
  return useMutation<TimeLog, Error, InsertTimeLog>({
    mutationFn: async (timeLogData: InsertTimeLog): Promise<TimeLog> => {
      const response = await fetch("/api/time-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(timeLogData),
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to create time log: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data: TimeLog) => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-logs", data.ticketId] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-logs", data.ticketId, "active"] });
    },
  });
}

export function useUpdateTimeLog(id: number) {
  const queryClient = useQueryClient();
  
  return useMutation<TimeLog, Error, Partial<InsertTimeLog>>({
    mutationFn: async (timeLogData: Partial<InsertTimeLog>): Promise<TimeLog> => {
      const response = await fetch(`/api/time-logs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(timeLogData),
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to update time log: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data: TimeLog) => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-logs", data.ticketId] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-logs", data.ticketId, "active"] });
    },
  });
}

export function useStopTimeLog() {
  const queryClient = useQueryClient();
  
  return useMutation<TimeLog, Error, { id: number; endTime?: Date }>({
    mutationFn: async ({ id, endTime }: { id: number; endTime?: Date }): Promise<TimeLog> => {
      const response = await fetch(`/api/time-logs/${id}/stop`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endTime }),
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to stop time log: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data: TimeLog) => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-logs", data.ticketId] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-logs", data.ticketId, "active"] });
    },
  });
}

export function useDeleteTimeLog() {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, number>({
    mutationFn: async (id: number): Promise<void> => {
      const response = await fetch(`/api/time-logs/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to delete time log: ${response.statusText}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-logs"] });
    },
  });
}