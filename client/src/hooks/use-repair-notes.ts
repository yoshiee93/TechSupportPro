import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { RepairNote } from "@shared/schema";

export function useRepairNotes(ticketId: number) {
  return useQuery<RepairNote[]>({
    queryKey: ["/api/tickets", ticketId, "repair-notes"],
    queryFn: async () => {
      const response = await fetch(`/api/tickets/${ticketId}/repair-notes`, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`Failed to fetch repair notes: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!ticketId,
  });
}

export function useCreateRepairNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      console.log("Creating repair note with data:", data);
      const response = await apiRequest("POST", `/api/tickets/${data.ticketId}/repair-notes`, data);
      const result = await response.json();
      console.log("API response:", result);
      return result;
    },
    onSuccess: (newNote: any) => {
      console.log("Mutation success, invalidating queries for ticket:", newNote.ticketId);
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", newNote.ticketId, "repair-notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
    },
    onError: (error: any) => {
      console.error("Mutation error:", error);
    },
  });
}

export function useUpdateRepairNote(id: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/repair-notes/${id}`, data);
    },
    onSuccess: (updatedNote: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", updatedNote.ticketId, "repair-notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
    },
  });
}

export function useDeleteRepairNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/repair-notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
    },
  });
}