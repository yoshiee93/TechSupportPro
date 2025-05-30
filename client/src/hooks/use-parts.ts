import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { PartsOrder, Reminder } from "@shared/schema";

export function usePartsOrders(ticketId?: number) {
  return useQuery<PartsOrder[]>({
    queryKey: ticketId ? ["/api/parts-orders", { ticketId }] : ["/api/parts-orders"],
    queryFn: async ({ queryKey }) => {
      const [url, params] = queryKey;
      const searchParams = new URLSearchParams();
      if (params && typeof params === 'object' && 'ticketId' in params) {
        searchParams.append('ticketId', params.ticketId!.toString());
      }
      const fullUrl = searchParams.toString() ? `${url}?${searchParams}` : url as string;
      const response = await fetch(fullUrl, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`Failed to fetch parts orders: ${response.statusText}`);
      }
      return response.json();
    },
  });
}

export function usePartsOrder(id: number) {
  return useQuery<PartsOrder>({
    queryKey: ["/api/parts-orders", id],
    queryFn: async () => {
      const response = await fetch(`/api/parts-orders/${id}`, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`Failed to fetch parts order: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreatePartsOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/parts-orders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });
}

export function useUpdatePartsOrder(id: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/parts-orders/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/parts-orders", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });
}

export function useDeletePartsOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/parts-orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });
}

export function useReminders(type?: "upcoming" | "overdue" | "all") {
  return useQuery<Reminder[]>({
    queryKey: type ? ["/api/reminders", { type }] : ["/api/reminders"],
    queryFn: async ({ queryKey }) => {
      const [url, params] = queryKey;
      const searchParams = new URLSearchParams();
      if (params && typeof params === 'object' && 'type' in params) {
        searchParams.append('type', params.type as string);
      }
      const fullUrl = searchParams.toString() ? `${url}?${searchParams}` : url as string;
      const response = await fetch(fullUrl, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`Failed to fetch reminders: ${response.statusText}`);
      }
      return response.json();
    },
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/reminders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
    },
  });
}

export function useUpdateReminder(id: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/reminders/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/reminders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
    },
  });
}
