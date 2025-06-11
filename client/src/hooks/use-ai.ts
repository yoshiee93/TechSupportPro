import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface TicketAnalysis {
  priority: "low" | "medium" | "high" | "urgent";
  estimatedDifficulty: "easy" | "medium" | "hard" | "expert";
  estimatedTimeHours: number;
  suggestedActions: string[];
  recommendedParts: string[];
  diagnosticQuestions: string[];
  riskFactors: string[];
  confidenceScore: number;
}

export interface RepairSuggestion {
  steps: string[];
  tools: string[];
  parts: string[];
  warnings: string[];
  estimatedTime: number;
  difficulty: "easy" | "medium" | "hard" | "expert";
}

export function useAnalyzeTicket() {
  return useMutation({
    mutationFn: async (data: {
      ticketId?: number;
      deviceBrand: string;
      deviceModel: string;
      issueDescription: string;
      customerComplaints?: string[];
    }): Promise<TicketAnalysis> => {
      const response = await apiRequest("/api/ai/analyze-ticket", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json();
    },
  });
}

export function useGenerateRepairSuggestions() {
  return useMutation({
    mutationFn: async (data: {
      deviceBrand: string;
      deviceModel: string;
      diagnosedIssue: string;
      availableParts?: string[];
    }): Promise<RepairSuggestion> => {
      const response = await apiRequest("/api/ai/repair-suggestions", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json();
    },
  });
}

export function useSuggestParts() {
  return useMutation({
    mutationFn: async (data: {
      deviceBrand: string;
      deviceModel: string;
      symptoms: string[];
    }): Promise<{ parts: string[] }> => {
      const response = await apiRequest("/api/ai/suggest-parts", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json();
    },
  });
}

export function usePrioritizeTickets() {
  return useMutation({
    mutationFn: async (data: {
      ticketIds: number[];
    }): Promise<{ priorityAdjustments: Array<{ ticketId: number; suggestedPriority: string; reason: string }> }> => {
      const response = await apiRequest("/api/ai/prioritize-tickets", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json();
    },
  });
}

export function useAIInsights() {
  return useQuery({
    queryKey: ["/api/ai/insights"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}