import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Device } from "@shared/schema";

export function useDevices(clientId?: number) {
  return useQuery<Device[]>({
    queryKey: clientId ? ["/api/devices", { clientId }] : ["/api/devices"],
    queryFn: async ({ queryKey }) => {
      const [url, params] = queryKey;
      const searchParams = new URLSearchParams();
      if (params && typeof params === 'object' && 'clientId' in params) {
        searchParams.append('clientId', params.clientId!.toString());
      }
      const fullUrl = searchParams.toString() ? `${url}?${searchParams}` : url as string;
      const response = await fetch(fullUrl, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`Failed to fetch devices: ${response.statusText}`);
      }
      return response.json();
    },
  });
}

export function useDevice(id: number) {
  return useQuery<Device>({
    queryKey: ["/api/devices", id],
    queryFn: async () => {
      const response = await fetch(`/api/devices/${id}`, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`Failed to fetch device: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreateDevice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/devices", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
  });
}

export function useUpdateDevice(id: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/devices/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/devices", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
  });
}

export function useDeleteDevice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/devices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
  });
}
