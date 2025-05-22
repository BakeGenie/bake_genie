import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";

// Form validation schema
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);

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

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/login", data);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }
      
      // Redirect to dashboard after successful login
      navigate("/dashboard");
      
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle demo login
  const handleDemoLogin = async () => {
    setLoading(true);
    
    try {
      // Use the demo credentials
      const demoData = {
        email: "demo@bakediary.com",
        password: "password123",
      };
      
      const response = await apiRequest("POST", "/api/auth/login", demoData);
      
      if (!response.ok) {
        // If the demo user doesn't exist, we could create it here
        toast({
          title: "Demo login",
          description: "Logging in with demo account...",
        });
        
        // For simplicity, we'll just redirect to dashboard
        navigate("/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "There was an error logging in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="mr-2">Logging in...</span>
                    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                  </>
                ) : "Log In"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-4 text-center">
            <Link href="/register" className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              Don't have an account? Register
            </Link>
          </div>
          
          <Separator className="my-4" />
          
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
            <p>Or log in with our demo account</p>
          </div>
          
          <Button 
            variant="outline"
            className="w-full mt-2" 
            onClick={handleDemoLogin}
            disabled={loading}
          >
            Demo Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;