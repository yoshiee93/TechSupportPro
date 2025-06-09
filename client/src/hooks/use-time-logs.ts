import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { TimeLog, InsertTimeLog } from "@shared/schema";

export function useTimeLogs(ticketId: number) {
  return useQuery({
    queryKey: ["/api/time-logs", ticketId],
    queryFn: () => apiRequest<TimeLog[]>({ url: `/api/time-logs/${ticketId}`, on401: "throw" }),
  });
}

export function useActiveTimeLog(ticketId: number, technicianName: string = "Unknown") {
  return useQuery({
    queryKey: ["/api/time-logs", ticketId, "active", technicianName],
    queryFn: () => apiRequest<TimeLog | null>({ 
      url: `/api/time-logs/${ticketId}/active?technician=${encodeURIComponent(technicianName)}`, 
      on401: "throw" 
    }),
    refetchInterval: 5000, // Refresh every 5 seconds to keep timer updated
  });
}

export function useCreateTimeLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (timeLogData: InsertTimeLog) =>
      apiRequest<TimeLog>({
        url: "/api/time-logs",
        method: "POST",
        body: timeLogData,
        on401: "throw",
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-logs", data.ticketId] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-logs", data.ticketId, "active"] });
    },
  });
}

export function useUpdateTimeLog(id: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (timeLogData: Partial<InsertTimeLog>) =>
      apiRequest<TimeLog>({
        url: `/api/time-logs/${id}`,
        method: "PATCH",
        body: timeLogData,
        on401: "throw",
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-logs", data.ticketId] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-logs", data.ticketId, "active"] });
    },
  });
}

export function useStopTimeLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, endTime }: { id: number; endTime?: Date }) =>
      apiRequest<TimeLog>({
        url: `/api/time-logs/${id}/stop`,
        method: "PATCH",
        body: { endTime },
        on401: "throw",
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-logs", data.ticketId] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-logs", data.ticketId, "active"] });
    },
  });
}

export function useDeleteTimeLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest({
        url: `/api/time-logs/${id}`,
        method: "DELETE",
        on401: "throw",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-logs"] });
    },
  });
}