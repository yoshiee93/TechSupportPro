import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface TimeLog {
  id: number;
  ticketId: number;
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  description?: string;
  isActive: boolean;
  hourlyRate?: string;
  laborCost?: string;
  createdAt: string;
}

export interface TimeTrackingStats {
  totalHours: number;
  totalMinutes: number;
  totalCost: number;
  sessionsCount: number;
  averageSessionLength: number;
  ticketsWorked: number;
}

export function useStartTimeTracking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      ticketId: number;
      description?: string;
      hourlyRate?: number;
    }): Promise<TimeLog> => {
      const response = await apiRequest("POST", "/api/time-tracking/start", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-tracking/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-tracking/user"] });
    },
  });
}

export function useStopTimeTracking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      id: number;
      description?: string;
    }): Promise<TimeLog> => {
      const response = await apiRequest("POST", "/api/time-tracking/stop", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-tracking/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-tracking/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-tracking/stats"] });
    },
  });
}

export function useActiveTimeLog() {
  return useQuery({
    queryKey: ["/api/time-tracking/active"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useTicketTimeLogs(ticketId: number) {
  return useQuery({
    queryKey: ["/api/time-tracking/ticket", ticketId],
    enabled: !!ticketId,
  });
}

export function useUserTimeLogs(limit = 20, offset = 0) {
  return useQuery({
    queryKey: ["/api/time-tracking/user", { limit, offset }],
  });
}

export function useUpdateTimeLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: number;
      description?: string;
      hourlyRate?: string;
      duration?: number;
    }): Promise<TimeLog> => {
      const response = await apiRequest("PUT", `/api/time-tracking/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-tracking/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-tracking/stats"] });
    },
  });
}

export function useDeleteTimeLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await apiRequest("DELETE", `/api/time-tracking/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-tracking/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-tracking/stats"] });
    },
  });
}

export function useTimeTrackingStats() {
  return useQuery({
    queryKey: ["/api/time-tracking/stats"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}