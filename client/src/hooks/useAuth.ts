import { useQuery } from "@tanstack/react-query";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  avatar?: string;
}

export function useAuth() {
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async ({ queryKey }) => {
      try {
        const response = await fetch(queryKey[0] as string, {
          credentials: "include",
          method: "GET",
        });
        
        if (response.status === 401) {
          return null;
        }
        
        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }
        
        return await response.json();
      } catch (err) {
        console.error("Auth error:", err);
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    user: user as User | null,
    isLoading,
    isAuthenticated: !!user,
    error,
    refetch,
  };
}