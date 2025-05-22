import React, { createContext, useContext, useState, useEffect } from 'react';
import { queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// Define User type
export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  businessName?: string | null;
  profileImageUrl?: string | null;
}

// Define AuthContext type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  logout: async () => {},
});

// Create provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch user data
  const { data: user, isLoading: isUserLoading, error } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update loading state based on query
  useEffect(() => {
    setIsLoading(isUserLoading);
  }, [isUserLoading]);

  // Handle error logging
  useEffect(() => {
    if (error) {
      console.error('Error fetching user:', error);
    }
  }, [error]);

  // Logout function
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include',
      });
      
      // Clear auth data from cache
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      await queryClient.setQueryData(['/api/auth/user'], null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Use type assertion to ensure user matches our expected type
  const value: AuthContextType = {
    user: (user as User) || null,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Create hook for using auth context
export const useAuth = () => useContext(AuthContext);