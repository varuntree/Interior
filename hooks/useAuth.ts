"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/libs/api/http";

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const fetchUser = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await apiFetch("/api/v1/auth/me");
      
      if (response.success && response.data) {
        setState({
          user: response.data,
          loading: false,
          error: null,
        });
      } else {
        setState({
          user: null,
          loading: false,
          error: "Failed to fetch user data",
        });
      }
    } catch (error: any) {
      setState({
        user: null,
        loading: false,
        error: error.message || "Authentication failed",
      });
    }
  };

  const logout = async () => {
    try {
      // Clear local state first
      setState({
        user: null,
        loading: false,
        error: null,
      });
      
      // Navigate to server sign-out endpoint
      window.location.href = "/api/auth/signout";
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || "Logout failed",
      }));
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return {
    ...state,
    refetch: fetchUser,
    logout,
  };
}
