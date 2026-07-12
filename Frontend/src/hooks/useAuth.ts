import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "employee" | "technician" | "auditor";
  status: "Active" | "Inactive";
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["user"],
    queryFn: async () => {
      const token = localStorage.getItem("assetflow_token");
      if (!token) return null;
      try {
        const response = await api.get("/auth/profile");
        return response.data.data;
      } catch (err) {
        localStorage.removeItem("assetflow_token");
        localStorage.removeItem("assetflow_user");
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const logout = () => {
    localStorage.removeItem("assetflow_token");
    localStorage.removeItem("assetflow_user");
    queryClient.setQueryData(["user"], null);
    queryClient.clear();
    toast.success("Successfully logged out");
    window.location.href = "/login";
  };

  return {
    user,
    isLoading,
    error,
    logout,
    isAuthenticated: !!user,
  };
}
