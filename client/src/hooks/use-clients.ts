import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Client, ClientWithDevices } from "@shared/schema";

export function useClients() {
  return useQuery<ClientWithDevices[]>({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const response = await fetch("/api/clients", { credentials: "include" });
      if (!response.ok) {
        throw new Error(`Failed to fetch clients: ${response.statusText}`);
      }
      return response.json();
    },
  });
}

export function useClient(id: number) {
  return useQuery<ClientWithDevices>({
    queryKey: ["/api/clients", id],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${id}`, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`Failed to fetch client: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/clients", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
  });
}

export function useUpdateClient(id: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/clients/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients", id] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
  });
}
