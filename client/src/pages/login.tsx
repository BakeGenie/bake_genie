import React, { useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const Login: React.FC = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Check for logout parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const loggedOut = urlParams.get("logged_out");
    
    if (loggedOut === "true") {
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
        duration: 3000,
      });
      
      // Remove the query parameter
      navigate("/login", { replace: true });
    }
  }, [toast, navigate]);

  // Handle demo login
  const handleDemoLogin = () => {
    // Since we're using a demo user, we'll just redirect to the dashboard
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <svg className="h-10 w-10 mx-auto" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#f0f0f0" stroke="#d1d1d1" strokeWidth="0.5" />
              <circle cx="16" cy="16" r="10" fill="#f8f8f8" stroke="#e0e0e0" strokeWidth="0.5" />
              <path d="M16 6 L19 9 L22 7 L20 11 L24 13 L20 15 L22 19 L18 17 L16 21 L14 17 L10 19 L12 15 L8 13 L12 11 L10 7 L14 9 Z" fill="#6285f8" stroke="#3b64ef" strokeWidth="0.5" />
              <circle cx="16" cy="16" r="4" fill="#f5f7ff" stroke="#d6e0fd" strokeWidth="0.5" />
              <circle cx="16" cy="16" r="2" fill="#ffffff" stroke="#ebf0fe" strokeWidth="0.5" />
              <path d="M16 28 C22.6274 28 28 22.6274 28 16 C28 9.37258 22.6274 4 16 4" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
              <path d="M16 4 C9.37258 4 4 9.37258 4 16 C4 22.6274 9.37258 28 16 28" stroke="#d0d0d0" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
            </svg>
          </div>
          <CardTitle className="text-2xl">Welcome to BakeGenie</CardTitle>
          <CardDescription>
            Sign in to manage your bakery business
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* In a real app, this would be a login form */}
          <div className="space-y-4">
            <div className="text-center text-sm text-gray-500">
              <p>This is a demo application</p>
              <p>Click the button below to login with the demo account</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleDemoLogin}
          >
            Login with Demo Account
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;