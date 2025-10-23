import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    // Don't treat null as an error
    refetchOnWindowFocus: false,
  });

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
  };
}
