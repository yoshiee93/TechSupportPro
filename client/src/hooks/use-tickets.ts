import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { TicketWithRelations } from "@shared/schema";

export function useTickets(search?: string) {
  return useQuery<TicketWithRelations[]>({
    queryKey: search ? ["/api/tickets", { search }] : ["/api/tickets"],
    queryFn: async ({ queryKey }) => {
      const [url, params] = queryKey;
      const searchParams = new URLSearchParams();
      if (params && typeof params === 'object' && 'search' in params) {
        searchParams.append('search', params.search as string);
      }
      const fullUrl = searchParams.toString() ? `${url}?${searchParams}` : url as string;
      const response = await fetch(fullUrl, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`Failed to fetch tickets: ${response.statusText}`);
      }
      return response.json();
    },
  });
}

export function useTicket(id: number) {
  return useQuery<TicketWithRelations>({
    queryKey: ["/api/tickets", id],
    queryFn: async () => {
      const response = await fetch(`/api/tickets/${id}`, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`Failed to fetch ticket: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!id,
  });
}

export function useTicketByNumber(ticketNumber: string) {
  return useQuery<TicketWithRelations>({
    queryKey: ["/api/tickets/number", ticketNumber],
    queryFn: async () => {
      const response = await fetch(`/api/tickets/number/${ticketNumber}`, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`Failed to fetch ticket: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!ticketNumber,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/tickets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });
}

export function useUpdateTicket(id: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/tickets/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/tickets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats", { credentials: "include" });
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard stats: ${response.statusText}`);
      }
      return response.json();
    },
  });
}

export function useActivityLogs(ticketId: number) {
  return useQuery({
    queryKey: ["/api/tickets", ticketId, "activity-logs"],
    queryFn: async () => {
      const response = await fetch(`/api/tickets/${ticketId}/activity-logs`, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`Failed to fetch activity logs: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!ticketId,
  });
}
