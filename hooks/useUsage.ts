"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/libs/api/http";

interface UsageData {
  currentPlan: {
    label: string;
    monthlyGenerations: number;
  };
  usage: {
    generationsUsed: number;
    remaining: number;
    percentage: number;
  };
  billingPeriod: {
    startDate: string;
    endDate: string;
    daysRemaining: number;
  };
}

interface UsageState {
  data: UsageData | null;
  loading: boolean;
  error: string | null;
}

export function useUsage() {
  const [state, setState] = useState<UsageState>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchUsage = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await apiFetch("/api/v1/usage");
      
      if (response.success && response.data) {
        setState({
          data: response.data,
          loading: false,
          error: null,
        });
      } else {
        setState({
          data: null,
          loading: false,
          error: "Failed to fetch usage data",
        });
      }
    } catch (error: any) {
      // For Phase 5, we'll use mock data if the API isn't ready
      if (error.status === 404 || error.status === 500) {
        // Mock data for development
        const mockData: UsageData = {
          currentPlan: {
            label: "Starter",
            monthlyGenerations: 150,
          },
          usage: {
            generationsUsed: 45,
            remaining: 105,
            percentage: 30,
          },
          billingPeriod: {
            startDate: "2024-12-01",
            endDate: "2024-12-31",
            daysRemaining: 18,
          },
        };
        
        setState({
          data: mockData,
          loading: false,
          error: null,
        });
      } else {
        setState({
          data: null,
          loading: false,
          error: error.message || "Failed to fetch usage data",
        });
      }
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  return {
    ...state,
    refetch: fetchUsage,
  };
}