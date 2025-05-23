import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { CalendarDaysIcon, CheckCircleIcon, ArrowRightIcon, Loader2Icon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const TryTrial = () => {
  const [_, setLocation] = useLocation();
  const [isStarted, setIsStarted] = useState(false);

  const { mutate: startTrial, isPending } = useMutation({
    mutationFn: async () => {
      try {
        const response = await fetch('/api/subscription/trial/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to start trial');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error starting trial:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.success) {
        setIsStarted(true);
        toast({
          title: "Trial Started!",
          description: "Your 30-day free trial has been activated successfully.",
          variant: "default",
        });
      } else {
        throw new Error(data.error || 'Failed to start trial');
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Something went wrong. Please try again.';
      
      // Handle the case where the user already had a trial
      if (errorMessage.includes('already used your free trial')) {
        toast({
          title: "Trial Already Used",
          description: "You've already used your free trial period. Please subscribe to continue using premium features.",
          variant: "destructive",
        });
        setTimeout(() => {
          setLocation('/manage-subscription');
        }, 2000);
      } else if (errorMessage.includes('already have an active subscription')) {
        toast({
          title: "Active Subscription",
          description: "You already have an active subscription or trial. No need to start a new trial.",
          variant: "default",
        });
        setTimeout(() => {
          setLocation('/dashboard');
        }, 2000);
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  });

  const handleStartTrial = async () => {
    try {
      // Direct fetch approach rather than using the mutation
      const response = await fetch('/api/subscription/trial/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setIsStarted(true);
        toast({
          title: "Trial Started!",
          description: "Your 30-day free trial has been activated successfully.",
          variant: "default",
        });
      } else {
        // Handle error responses
        const errorMessage = data.error || 'Failed to start trial';
        
        if (errorMessage.includes('already used your free trial')) {
          toast({
            title: "Trial Already Used",
            description: "You've already used your free trial period. Please subscribe to continue using premium features.",
            variant: "destructive",
          });
          setTimeout(() => {
            setLocation('/manage-subscription');
          }, 2000);
        } else if (errorMessage.includes('already have an active subscription')) {
          toast({
            title: "Active Subscription",
            description: "You already have an active subscription or trial. No need to start a new trial.",
            variant: "default",
          });
          setTimeout(() => {
            setLocation('/dashboard');
          }, 2000);
        } else {
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error starting trial:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    }
  };

  // If the trial has been successfully started
  if (isStarted) {
    return (
      <div className="container max-w-4xl mx-auto py-12">
        <Card className="w-full">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center">
              <CheckCircleIcon className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-2xl">Your Free Trial Has Started!</CardTitle>
            <CardDescription>
              You now have full access to all BakeDiary premium features for the next 30 days.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-primary/5 p-4 flex items-center gap-4">
              <CalendarDaysIcon className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-medium">30-Day Trial Period</h3>
                <p className="text-sm text-muted-foreground">Your trial will expire in 30 days. You can upgrade to a paid plan anytime.</p>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">What's included in your trial:</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Unlimited orders and customer management</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Full access to invoice and quote creation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Complete recipe and ingredient management</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Business reporting and analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Financial tracking with expense management</span>
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button 
              onClick={() => setLocation('/dashboard')}
              className="gap-2"
            >
              Go to Dashboard <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Default: Display trial offer page
  return (
    <div className="container max-w-4xl mx-auto py-12">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Try BakeDiary For Free</CardTitle>
          <CardDescription>
            Start your 30-day free trial today. No credit card required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Why try BakeDiary?</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Streamline your bakery business management</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Organize orders and keep track of customers</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Create professional invoices and quotes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Manage recipes and ingredients</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Track expenses and monitor your business growth</span>
                </li>
              </ul>
            </div>
            <div className="rounded-md bg-primary/5 p-4 flex flex-col justify-center space-y-4">
              <h3 className="font-medium text-lg">Free Trial Includes:</h3>
              <div className="space-y-3">
                <p className="flex items-center gap-2">
                  <CalendarDaysIcon className="h-5 w-5 text-primary" />
                  <span className="font-medium">30 days of full access</span>
                </p>
                <p className="text-sm text-muted-foreground">Experience all premium features with no limitations during your trial period.</p>
              </div>
              <div className="pt-2">
                <Button 
                  onClick={handleStartTrial}
                  className="w-full gap-2"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                      Starting Trial...
                    </>
                  ) : (
                    <>
                      Start Free Trial
                      <ArrowRightIcon className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-center border-t pt-4">
          <p className="text-sm text-muted-foreground">
            No credit card required. You can cancel anytime during your trial.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TryTrial;